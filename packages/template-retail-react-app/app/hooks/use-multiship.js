/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    useShopperBasketsMutation,
    useShippingMethodsForShipment
} from '@salesforce/commerce-sdk-react'
import {usePickupShipment} from '@salesforce/retail-react-app/app/hooks/use-pickup-shipment'

/**
 * Custom hook to handle multiship functionality for cart items
 * @param {Object} basket - The current basket object
 * @returns {Object} Object containing helper functions for multiship management
 */
export const useMultiship = (basket) => {
    const {isCurrentShippingMethodPickup, getDefaultShippingMethodId, getPickupShippingMethodId} =
        usePickupShipment(basket)

    const updateItemInBasketMutation = useShopperBasketsMutation('updateItemInBasket')
    const createShipmentForBasketMutation = useShopperBasketsMutation('createShipmentForBasket')
    const removeShipmentFromBasketMutation = useShopperBasketsMutation('removeShipmentFromBasket')
    const updateShippingMethodForShipmentMutation = useShopperBasketsMutation(
        'updateShippingMethodForShipment'
    )

    // Hook for shipping methods for the main shipment - we'll use this as a fallback
    //
    // TODO: Ideally we would not use the shipping methods for the main shipment on all shipments
    //
    const {refetch: refetchMeShippingMethods} = useShippingMethodsForShipment(
        {
            parameters: {
                basketId: basket?.basketId,
                shipmentId: 'me'
            }
        },
        {
            enabled: false // Disable automatic fetching, we'll fetch manually when needed
        }
    )

    /**
     * Assigns default shipping methods to shipments that don't have one
     * Note: Currently uses the same shipping methods as the main shipment ('me') for all shipments
     * This is a limitation due to React hooks constraints - ideally each shipment would get its own shipping methods
     * @returns {Promise<void>} Promise that resolves when all updates are complete
     */
    const assignDefaultShippingMethodsToShipments = async () => {
        if (!basket?.basketId || !basket?.shipments?.length) {
            return
        }

        // Find shipments that don't have a shipping method assigned
        const shipmentsWithoutMethod = basket.shipments.filter(
            (shipment) => !shipment.shippingMethod
        )

        if (shipmentsWithoutMethod.length === 0) {
            return
        }

        try {
            // Get shipping methods (using main shipment as reference)
            // Note: This is a limitation - all shipments will get the same options
            const {data: shippingMethods} = await refetchMeShippingMethods()
            const defaultShippingMethodId = getDefaultShippingMethodId(shippingMethods)

            // if (!defaultShippingMethodId) {
            //     console.warn('No default shipping method found')
            //     return
            // }

            // Update each shipment that doesn't have a shipping method
            const updatePromises = shipmentsWithoutMethod.map(async (shipment) => {
                try {
                    await updateShippingMethodForShipmentMutation.mutateAsync({
                        parameters: {
                            basketId: basket.basketId,
                            shipmentId: shipment.shipmentId
                        },
                        body: {
                            id: defaultShippingMethodId
                        }
                    })
                } catch (error) {
                    console.error(
                        `Failed to assign shipping method to shipment ${shipment.shipmentId}:`,
                        error
                    )
                }
            })

            await Promise.all(updatePromises)
        } catch (error) {
            console.error('Failed to fetch shipping methods:', error)
        }
    }

    /**
     * Finds an existing delivery shipment in the basket
     * @param {Object} basket - The basket object
     * @returns {Object|null} The delivery shipment object or null if not found
     */
    const findExistingDeliveryShipment = (basket) => {
        if (!basket?.shipments) return null

        return basket.shipments.find(
            (shipment) => !isCurrentShippingMethodPickup(shipment.shippingMethod)
        )
    }

    /**
     * Creates a new delivery shipment without a shipping method
     * The default shipping method will be assigned later by assignDefaultShippingMethodsToShipments
     * @param {string} basketId - The basket ID
     * @returns {Promise<Object>} The created shipment response
     */
    const createNewDeliveryShipment = async (basketId) => {
        // Create a new shipment without a shipping method
        // The assignDefaultShippingMethodsToShipments function will handle setting the default shipping method
        const response = await createShipmentForBasketMutation.mutateAsync({
            parameters: {
                basketId
            },
            body: {
                // Note: c_fromStoreId is omitted since this is a delivery shipment
                // shippingMethod is also omitted - will be set by assignDefaultShippingMethodsToShipments
            }
        })

        return response
    }

    /**
     * Finds an existing pickup shipment for the specified store
     * @param {Object} basket - The basket object
     * @param {string} storeId - The store ID to find pickup shipment for
     * @returns {Object|null} The pickup shipment object or null if not found
     */
    const findExistingPickupShipment = (basket, storeId) => {
        if (!basket?.shipments || !storeId) return null

        return basket.shipments.find(
            (shipment) =>
                isCurrentShippingMethodPickup(shipment.shippingMethod) &&
                shipment.c_fromStoreId === storeId
        )
    }

    /**
     * Creates a new pickup shipment for the specified store
     * @param {string} basketId - The basket ID
     * @param {Object} storeInfo - The store object containing id and inventoryId
     * @returns {Promise<Object>} The created shipment response
     */
    const createNewPickupShipment = async (basketId, storeInfo) => {
        // Get shipping methods to determine the pickup shipping method ID
        const {data: shippingMethods} = await refetchMeShippingMethods()
        const pickupShippingMethodId = getPickupShippingMethodId(shippingMethods)

        if (!pickupShippingMethodId) {
            throw new Error('No pickup shipping method found')
        }

        // Create a new shipment with pickup configuration
        const response = await createShipmentForBasketMutation.mutateAsync({
            parameters: {
                basketId
            },
            body: {
                shippingMethod: {
                    id: pickupShippingMethodId
                },
                c_fromStoreId: storeInfo.id
            }
        })

        return response
    }

    /**
     * Moves a product item to a pickup shipment for the specified store
     * @param {Object} productItem - The product item to move
     * @param {string} targetShipmentId - The target shipment ID
     * @param {string} inventoryId - The inventory ID for the store
     * @returns {Promise<Object>} The updated basket response
     */
    const moveItemToPickupShipment = async (productItem, targetShipmentId, inventoryId) => {
        if (!basket?.basketId || !productItem?.itemId) {
            throw new Error('Invalid basket or product item')
        }

        // Update the item to add inventory ID and move to pickup shipment
        const updateData = {
            productId: productItem.productId,
            quantity: productItem.quantity,
            shipmentId: targetShipmentId,
            inventoryId: inventoryId
        }

        const response = await updateItemInBasketMutation.mutateAsync({
            parameters: {
                basketId: basket.basketId,
                itemId: productItem.itemId
            },
            body: updateData
        })

        return response
    }

    /**
     * Moves a product item from pickup to delivery shipment
     * @param {Object} productItem - The product item to move
     * @param {string} targetShipmentId - The target shipment ID (optional)
     * @returns {Promise<Object>} The updated basket response
     */
    const moveItemToDeliveryShipment = async (productItem, targetShipmentId = 'me') => {
        if (!basket?.basketId || !productItem?.itemId) {
            throw new Error('Invalid basket or product item')
        }

        // Update the item to remove inventory ID and move to different shipment
        const updateData = {
            productId: productItem.productId,
            quantity: productItem.quantity,
            shipmentId: targetShipmentId
        }

        // Remove inventoryId if it exists (for pickup items) by setting it to null
        //
        // TODO: This does not actually clear the id. We need an API fix maybe?
        //
        if (productItem.inventoryId) {
            updateData.inventoryId = null
        }

        const response = await updateItemInBasketMutation.mutateAsync({
            parameters: {
                basketId: basket.basketId,
                itemId: productItem.itemId
            },
            body: updateData
        })

        return response
    }

    /**
     * Handles delivery option change for a product item
     * @param {Object} productItem - The product item
     * @param {boolean} selectedPickup - Whether pickup is selected (true) or delivery is selected (false)
     * @param {Object} storeInfo - The selected store object (required for pickup)
     * @returns {Promise<void>}
     */
    const handleDeliveryOptionChange = async (productItem, selectedPickup, storeInfo) => {
        if (!basket?.basketId || !productItem) {
            throw new Error('Invalid basket or product item')
        }

        const currentShipment = basket.shipments?.find(
            (shipment) => shipment.shipmentId === productItem.shipmentId
        )
        const isCurrentlyPickup = isCurrentShippingMethodPickup(currentShipment?.shippingMethod)
        const sourceShipmentId = productItem.shipmentId

        let updatedBasket = null

        // Handle change from pickup to delivery
        if (!selectedPickup && isCurrentlyPickup) {
            // Check if there's an existing delivery shipment
            let existingDeliveryShipment = findExistingDeliveryShipment(basket)

            if (!existingDeliveryShipment) {
                // Create a new delivery shipment
                const newShipmentResponse = await createNewDeliveryShipment(basket.basketId)
                // Use the newly created shipment from the response
                existingDeliveryShipment = newShipmentResponse.shipments?.find(
                    (shipment) => !isCurrentShippingMethodPickup(shipment.shippingMethod)
                )
            }

            // Move the item to the delivery shipment
            if (!existingDeliveryShipment?.shipmentId) {
                throw new Error('Failed to create or find delivery shipment')
            }

            updatedBasket = await moveItemToDeliveryShipment(
                productItem,
                existingDeliveryShipment.shipmentId
            )
        }
        // Handle change from delivery to pickup
        else if (selectedPickup && !isCurrentlyPickup) {
            if (!storeInfo) {
                throw new Error('No store selected for pickup')
            }

            if (!storeInfo.inventoryId) {
                throw new Error('Selected store does not have an inventory ID')
            }

            // Check if there's an existing pickup shipment for this store
            let existingPickupShipment = findExistingPickupShipment(basket, storeInfo.id)

            if (!existingPickupShipment) {
                // Create a new pickup shipment for this store
                const newShipmentResponse = await createNewPickupShipment(
                    basket.basketId,
                    storeInfo
                )
                // Find the newly created pickup shipment
                existingPickupShipment = newShipmentResponse.shipments?.find(
                    (shipment) =>
                        isCurrentShippingMethodPickup(shipment.shippingMethod) &&
                        shipment.c_fromStoreId === storeInfo.id
                )
            }

            if (!existingPickupShipment) {
                throw new Error('Failed to create or find pickup shipment')
            }

            // Move the item to the pickup shipment
            updatedBasket = await moveItemToPickupShipment(
                productItem,
                existingPickupShipment.shipmentId,
                storeInfo.inventoryId
            )
        }

        // Check if the source shipment is now empty and remove it if necessary
        // Use the updated basket from the move operation
        if (sourceShipmentId && sourceShipmentId !== 'me' && updatedBasket) {
            // Check if any remaining items are in the source shipment using the updated basket
            const hasRemainingItems = updatedBasket.productItems?.some(
                (item) => item.shipmentId === sourceShipmentId
            )

            if (!hasRemainingItems) {
                try {
                    await removeShipmentFromBasketMutation.mutateAsync({
                        parameters: {
                            basketId: basket.basketId,
                            shipmentId: sourceShipmentId
                        }
                    })
                } catch (error) {
                    console.error(
                        `Failed to remove empty source shipment ${sourceShipmentId}:`,
                        error
                    )
                }
            }
        }

        //
        // TODO: if there was an error along the way we need to clean up, especialy delete the empty new shipment.
        //
    }

    return {
        assignDefaultShippingMethodsToShipments,
        handleDeliveryOptionChange,
        findExistingDeliveryShipment,
        findExistingPickupShipment,
        createNewDeliveryShipment,
        createNewPickupShipment,
        moveItemToDeliveryShipment,
        moveItemToPickupShipment,
        isCurrentShippingMethodPickup
    }
}
