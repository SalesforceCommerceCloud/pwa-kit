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

const DEFAULT_SHIPMENT_ID = 'me'

/**
 * Custom hook to handle multiship functionality for cart items
 * @param {Object} basket - The current basket object
 * @returns {Object} Object containing helper functions for multiship management
 */
export const useMultiship = (basket) => {
    const {
        isCurrentShippingMethodPickup,
        getDefaultShippingMethodId,
        getPickupShippingMethodId,
        configureDefaultShipmentIfNeeded
    } = usePickupShipment(basket)

    const updateItemInBasketMutation = useShopperBasketsMutation('updateItemInBasket')
    const createShipmentForBasketMutation = useShopperBasketsMutation('createShipmentForBasket')
    const removeShipmentFromBasketMutation = useShopperBasketsMutation('removeShipmentFromBasket')
    const updateShippingMethodForShipmentMutation = useShopperBasketsMutation(
        'updateShippingMethodForShipment'
    )
    const updateItemsInBasketMutation = useShopperBasketsMutation('updateItemsInBasket')

    // Hook for shipping methods for the main shipment - we'll use this as a fallback
    //
    // TODO: Ideally we would not use the shipping methods for the main shipment on all shipments
    //
    const {refetch: refetchShippingMethods} = useShippingMethodsForShipment(
        {
            parameters: {
                basketId: basket?.basketId,
                shipmentId: DEFAULT_SHIPMENT_ID
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
            const {data: shippingMethods} = await refetchShippingMethods()
            const defaultShippingMethodId = getDefaultShippingMethodId(shippingMethods)

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
     * Creates a new delivery shipment without a shipping method, or configures and returns the default shipment for delivery if it's empty
     * The default shipping method will be assigned later by assignDefaultShippingMethodsToShipments
     * @param {Object} basket - The basket object
     * @returns {Promise<Object>} The created shipment response
     */
    const createNewDeliveryShipment = async (basket) => {
        // If default shipment is empty, configure it for delivery and return
        const defaultShipment = basket.shipments?.find(
            (shipment) => shipment.shipmentId === DEFAULT_SHIPMENT_ID
        )
        const isDefaultShipmentEmpty =
            defaultShipment &&
            !basket.productItems?.some((item) => item.shipmentId === DEFAULT_SHIPMENT_ID)

        if (isDefaultShipmentEmpty) {
            return await configureDefaultShipmentIfNeeded(basket, DEFAULT_SHIPMENT_ID, false)
        }

        // Otherwise, create a new shipment without a shipping method
        // The assignDefaultShippingMethodsToShipments function will handle setting the default shipping method
        return await createShipmentForBasketMutation.mutateAsync({
            parameters: {
                basketId: basket.basketId
            },
            body: {
                // Note: c_fromStoreId is omitted since this is a delivery shipment
                // shippingMethod is also omitted - will be set by assignDefaultShippingMethodsToShipments
            }
        })
    }

    /**
     * Ensures a delivery shipment exists and returns it
     * Creates a new delivery shipment if none exists
     * @returns {Promise<string>} The delivery shipment ID
     */
    const findOrCreateDeliveryShipment = async () => {
        // Check if there's an existing delivery shipment
        let existingDeliveryShipment = findExistingDeliveryShipment(basket)

        if (!existingDeliveryShipment) {
            // Create a new delivery shipment
            const newShipmentResponse = await createNewDeliveryShipment(basket)
            // Use the new shipment from the response
            existingDeliveryShipment = newShipmentResponse?.shipments?.find(
                (shipment) => !isCurrentShippingMethodPickup(shipment.shippingMethod)
            )
        }

        return existingDeliveryShipment?.shipmentId
    }

    /**
     * Ensures a pickup shipment exists for the specified store and returns it
     * Creates a new pickup shipment if none exists for the store
     * @param {Object} storeInfo - The store object containing id and inventoryId
     * @returns {Promise<string>} The pickup shipment ID
     */
    const findOrCreatePickupShipment = async (storeInfo) => {
        if (!storeInfo?.id) {
            throw new Error('No store selected for pickup')
        }

        if (!storeInfo.inventoryId) {
            throw new Error('Selected store does not have an inventory ID')
        }

        // Check if there's an existing pickup shipment for this store
        let existingPickupShipment = findExistingPickupShipment(basket, storeInfo.id)

        if (!existingPickupShipment) {
            // Create a new pickup shipment for this store
            const newShipmentResponse = await createNewPickupShipment(basket, storeInfo)
            // Find the newly created pickup shipment
            existingPickupShipment = newShipmentResponse?.shipments?.find(
                (shipment) =>
                    isCurrentShippingMethodPickup(shipment.shippingMethod) &&
                    shipment.c_fromStoreId === storeInfo.id
            )
        }

        return existingPickupShipment?.shipmentId
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
     * Creates a new pickup shipment for the specified store, or configures and returns the default shipment for pickup if it's empty
     * @param {Object} basket - The basket object
     * @param {Object} storeInfo - The store object containing id and inventoryId
     * @returns {Promise<Object>} The created shipment response
     */
    const createNewPickupShipment = async (basket, storeInfo) => {
        // If default shipment is empty, configure it for pickup and return
        const defaultShipment = basket.shipments?.find(
            (shipment) => shipment.shipmentId === DEFAULT_SHIPMENT_ID
        )
        const isDefaultShipmentEmpty =
            defaultShipment &&
            !basket.productItems?.some((item) => item.shipmentId === DEFAULT_SHIPMENT_ID)

        if (isDefaultShipmentEmpty) {
            return await configureDefaultShipmentIfNeeded(
                basket,
                DEFAULT_SHIPMENT_ID,
                true,
                storeInfo
            )
        }

        // Get shipping methods to determine the pickup shipping method ID
        const {data: shippingMethods} = await refetchShippingMethods()
        const pickupShippingMethodId = getPickupShippingMethodId(shippingMethods)

        if (!pickupShippingMethodId) {
            throw new Error('No pickup shipping method found')
        }

        // Create a new shipment with pickup configuration
        return await createShipmentForBasketMutation.mutateAsync({
            parameters: {
                basketId: basket.basketId
            },
            body: {
                shippingMethod: {
                    id: pickupShippingMethodId
                },
                c_fromStoreId: storeInfo.id
            }
        })
    }

    /**
     * Compares two addresses to determine if they are the same
     * @param {Object} address1 - First address object
     * @param {Object} address2 - Second address object
     * @returns {boolean} True if addresses match
     */
    const areAddressesEqual = (address1, address2) => {
        if (!address1 || !address2) return false

        // Compare key address fields
        return (
            address1.address1 === address2.address1 &&
            address1.city === address2.city &&
            address1.stateCode === address2.stateCode &&
            address1.postalCode === address2.postalCode &&
            address1.countryCode === address2.countryCode
        )
    }

    /**
     * Extracts only valid OrderAddress fields from an address object
     * @param {Object} address - The address object (may contain extra fields from customer address)
     * @returns {Object} Clean address object with only OrderAddress fields
     */
    const cleanAddressForOrder = (address) => {
        if (!address) return null

        return {
            address1: address.address1,
            city: address.city,
            countryCode: address.countryCode,
            firstName: address.firstName,
            lastName: address.lastName,
            phone: address.phone,
            postalCode: address.postalCode,
            stateCode: address.stateCode
        }
    }

    /**
     * Finds an existing delivery shipment with matching address
     * @param {Object} basket - The basket object
     * @param {Object} address - The address to match
     * @returns {string} The matching shipment ID
     */
    const findDeliveryShipmentWithSameAddress = (basket, address) => {
        if (!basket?.shipments || !address) return null

        const foundShipment = basket.shipments.find((shipment) => {
            // Must be a delivery shipment (not pickup)
            if (isCurrentShippingMethodPickup(shipment.shippingMethod)) {
                return false
            }

            // Check if shipment has a shipping address that matches
            return shipment.shippingAddress && areAddressesEqual(shipment.shippingAddress, address)
        })
        return foundShipment?.shipmentId
    }

    /**
     * Creates a new delivery shipment with the specified address
     * @param {Object} basket - The basket object
     * @param {Object} address - The address to use for the shipment
     * @returns {Promise<string>} The created shipment ID
     */
    const createNewDeliveryShipmentWithAddress = async (basket, address) => {
        if (!basket?.basketId || !address) return null

        const shippingAddress = cleanAddressForOrder(address)

        const response = await createShipmentForBasketMutation.mutateAsync({
            parameters: {
                basketId: basket.basketId
            },
            body: {
                shippingAddress: shippingAddress
            }
        })

        // Find the newly created shipment by matching the address
        return response?.shipments?.find(
            (shipment) =>
                !isCurrentShippingMethodPickup(shipment.shippingMethod) &&
                areAddressesEqual(shipment.shippingAddress, shippingAddress)
        )?.shipmentId
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

        return await updateItemInBasketMutation.mutateAsync({
            parameters: {
                basketId: basket.basketId,
                itemId: productItem.itemId
            },
            body: updateData
        })
    }

    /**
     * Moves a product item from pickup to delivery shipment
     * @param {Object} productItem - The product item to move
     * @param {string} targetShipmentId - The target shipment ID (optional)
     * @param {string} defaultInventoryId - The default inventory ID to use for delivery items (required)
     * @returns {Promise<Object>} The updated basket response
     */
    const moveItemToDeliveryShipment = async (
        productItem,
        targetShipmentId = DEFAULT_SHIPMENT_ID,
        defaultInventoryId
    ) => {
        if (!basket?.basketId || !productItem?.itemId) {
            throw new Error('Invalid basket or product item')
        }

        // Update the item to remove inventory ID and move to different shipment
        const updateData = {
            productId: productItem.productId,
            quantity: productItem.quantity,
            shipmentId: targetShipmentId
        }

        // Set inventoryId to default for delivery items (instead of null which doesn't work)
        if (productItem.inventoryId) {
            updateData.inventoryId = defaultInventoryId
        }

        return await updateItemInBasketMutation.mutateAsync({
            parameters: {
                basketId: basket.basketId,
                itemId: productItem.itemId
            },
            body: updateData
        })
    }

    /**
     * Moves multiple product items from pickup to delivery shipment in parallel
     * @param {Array} productItems - Array of product items to move
     * @param {string} targetShipmentId - The target shipment ID (optional)
     * @param {string} defaultInventoryId - The default inventory ID to use for delivery items (required)
     * @returns {Promise<Object>} The updated basket response
     */
    const moveItemsToDeliveryShipment = async (
        productItems,
        targetShipmentId = DEFAULT_SHIPMENT_ID,
        defaultInventoryId
    ) => {
        if (!basket?.basketId || !Array.isArray(productItems) || productItems.length === 0) {
            throw new Error('Invalid basket or product items array')
        }

        // Prepare update data for all items
        const updateData = productItems.map((productItem) => ({
            itemId: productItem.itemId,
            productId: productItem.productId,
            quantity: productItem.quantity,
            shipmentId: targetShipmentId,
            // Set inventoryId to default for delivery items (instead of null which doesn't work)
            ...(productItem.inventoryId && {inventoryId: defaultInventoryId})
        }))

        try {
            return await updateItemsInBasketMutation.mutateAsync({
                parameters: {
                    basketId: basket.basketId
                },
                body: updateData
            })
        } catch (error) {
            console.error('Failed to move items to delivery shipment:', error)
            return error
        }
    }

    /**
     * Moves multiple product items to pickup shipment in parallel
     * @param {Array} productItems - Array of product items to move
     * @param {string} targetShipmentId - The target shipment ID
     * @param {string} inventoryId - The inventory ID for the store
     * @returns {Promise<Object>} The updated basket response
     */
    const moveItemsToPickupShipment = async (productItems, targetShipmentId, inventoryId) => {
        if (!basket?.basketId || !Array.isArray(productItems) || productItems.length === 0) {
            throw new Error('Invalid basket or product items array')
        }

        // Prepare update data for all items
        const updateData = productItems.map((productItem) => ({
            itemId: productItem.itemId,
            productId: productItem.productId,
            quantity: productItem.quantity,
            shipmentId: targetShipmentId,
            inventoryId: inventoryId
        }))

        try {
            const response = await updateItemsInBasketMutation.mutateAsync({
                parameters: {
                    basketId: basket.basketId
                },
                body: updateData
            })

            return response
        } catch (error) {
            console.error('Failed to move items to pickup shipment:', error)
            return error
        }
    }

    /**
     * Handles delivery option change for a product item
     * Note: this might leave empty shipments behind
     * @param {Object} productItem - The product item
     * @param {boolean} selectedPickup - Whether pickup is selected (true) or delivery is selected (false)
     * @param {Object} storeInfo - The selected store object (required for pickup)
     * @param {string} defaultInventoryId - The default inventory ID to use for delivery items (required)
     * @returns {Promise<void>}
     */
    const handleDeliveryOptionChange = async (
        productItem,
        selectedPickup,
        storeInfo,
        defaultInventoryId
    ) => {
        if (!basket?.basketId || !productItem) {
            throw new Error('Invalid basket or product item')
        }

        const currentShipment = basket.shipments?.find(
            (shipment) => shipment.shipmentId === productItem.shipmentId
        )
        const isCurrentlyPickup = isCurrentShippingMethodPickup(currentShipment?.shippingMethod)

        let targetShipmentId = null

        // Handle change from pickup to delivery
        if (!selectedPickup && isCurrentlyPickup) {
            targetShipmentId = await findOrCreateDeliveryShipment()

            if (!targetShipmentId) {
                throw new Error('Failed to find or create shipment')
            }

            await moveItemToDeliveryShipment(productItem, targetShipmentId, defaultInventoryId)
        }
        // Handle change from delivery to pickup
        else if (selectedPickup && !isCurrentlyPickup) {
            targetShipmentId = await findOrCreatePickupShipment(storeInfo)

            if (!targetShipmentId) {
                throw new Error('Failed to find or create shipment')
            }

            // Move the item to the pickup shipment
            await moveItemToPickupShipment(productItem, targetShipmentId, storeInfo.inventoryId)
        }
    }

    /**
     * Fetches the appropriate shipment ID for product items based on pickup selection
     * @param {boolean} selectedPickup - Whether pickup is selected (true) or delivery is selected (false)
     * @param {Object} selectedStore - Selected store information
     * @returns {Promise<string>} The target shipment ID
     */
    const getShipmentForItems = async (selectedPickup, selectedStore) => {
        let targetShipmentId = DEFAULT_SHIPMENT_ID

        if (basket) {
            // Ensure a suitable shipment exists
            if (selectedPickup) {
                targetShipmentId = await findOrCreatePickupShipment(selectedStore)
            } else {
                targetShipmentId = await findOrCreateDeliveryShipment()
            }
        }
        return targetShipmentId
    }

    /**
     * Identifies shipments that have no product items
     * @param {Object} basket - The basket object
     * @returns {Array} Array of empty shipments
     */
    const findEmptyShipments = (basket) => {
        if (!basket?.shipments?.length) {
            return []
        }

        return basket.shipments.filter((shipment) => {
            const hasItems = basket.productItems?.some(
                (item) => item.shipmentId === shipment.shipmentId
            )
            return !hasItems
        })
    }

    /**
     * Finds the best non-empty shipment to consolidate into the default shipment
     * @param {Object} basket - The basket object
     * @returns {Object|null} The shipment to consolidate or null if none found
     */
    const findShipmentToConsolidate = (basket) => {
        if (!basket?.shipments?.length) {
            return null
        }

        return (
            basket.shipments.find((shipment) => {
                const hasItems = basket.productItems?.some(
                    (item) => item.shipmentId === shipment.shipmentId
                )
                return hasItems && shipment.shipmentId !== DEFAULT_SHIPMENT_ID
            }) || null
        )
    }

    /**
     * Gets items that belong to a specific shipment
     * @param {Object} basket - The basket object
     * @param {string} shipmentId - The shipment ID
     * @returns {Array} Array of product items
     */
    const getItemsForShipment = (basket, shipmentId) => {
        return basket?.productItems?.filter((item) => item.shipmentId === shipmentId) || []
    }

    /**
     * Consolidates items from a source shipment into the default shipment
     * @param {Object} sourceShipment - The shipment to consolidate from
     * @param {Array} itemsToMove - The items to move
     * @returns {Promise<boolean>} True if consolidation was successful
     */
    const consolidateIntoDefaultShipment = async (sourceShipment, itemsToMove) => {
        try {
            const isSourcePickup = isCurrentShippingMethodPickup(sourceShipment.shippingMethod)

            if (isSourcePickup) {
                return await consolidatePickupShipment(sourceShipment, itemsToMove)
            } else {
                return await consolidateDeliveryShipment(itemsToMove)
            }
        } catch (error) {
            console.error(`Failed to consolidate shipment ${sourceShipment.shipmentId}:`, error)
            return false
        }
    }

    /**
     * Consolidates a pickup shipment into the default shipment
     * @param {Object} sourceShipment - The pickup shipment to consolidate
     * @param {Array} itemsToMove - The items to move
     * @returns {Promise<boolean>} True if successful
     */
    const consolidatePickupShipment = async (sourceShipment, itemsToMove) => {
        const storeId = sourceShipment.c_fromStoreId
        const inventoryId = itemsToMove[0]?.inventoryId

        if (!storeId || !inventoryId) {
            console.warn('Missing store or inventory information for pickup consolidation')
            return false
        }

        const storeInfo = {id: storeId, inventoryId: inventoryId}

        await configureDefaultShipmentIfNeeded(basket, DEFAULT_SHIPMENT_ID, true, storeInfo)
        await moveItemsToPickupShipment(itemsToMove, DEFAULT_SHIPMENT_ID, inventoryId)

        return true
    }

    /**
     * Consolidates a delivery shipment into the default shipment
     * @param {Array} itemsToMove - The items to move
     * @returns {Promise<boolean>} True if successful
     */
    const consolidateDeliveryShipment = async (itemsToMove) => {
        const defaultInventoryId = itemsToMove[0]?.inventoryId

        await configureDefaultShipmentIfNeeded(basket, DEFAULT_SHIPMENT_ID, false, null)
        await moveItemsToDeliveryShipment(itemsToMove, DEFAULT_SHIPMENT_ID, defaultInventoryId)

        return true
    }

    /**
     * Removes a shipment from the basket
     * @param {string} shipmentId - The shipment ID to remove
     * @returns {Promise<boolean>} True if removal was successful
     */
    const removeShipment = async (shipmentId) => {
        try {
            await removeShipmentFromBasketMutation.mutateAsync({
                parameters: {
                    basketId: basket.basketId,
                    shipmentId: shipmentId
                }
            })
            return true
        } catch (error) {
            console.error(`Failed to remove shipment ${shipmentId}:`, error)
            return false
        }
    }

    /**
     * Removes multiple shipments in parallel
     * @param {Array} shipments - Array of shipments to remove
     * @returns {Promise<void>}
     */
    const removeShipmentsInParallel = async (shipments) => {
        const removalPromises = shipments.map((shipment) => removeShipment(shipment.shipmentId))
        await Promise.all(removalPromises)
    }

    /**
     * Handles consolidation when the default shipment is empty
     * @param {Array} emptyShipments - Array of empty shipments
     * @returns {Promise<string|null>} The shipment ID that was consolidated, or null
     */
    const handleDefaultShipmentConsolidation = async (emptyShipments) => {
        const defaultShipment = emptyShipments.find(
            (shipment) => shipment.shipmentId === DEFAULT_SHIPMENT_ID
        )

        if (!defaultShipment) {
            return null
        }

        const sourceShipment = findShipmentToConsolidate(basket)
        if (!sourceShipment) {
            return null
        }

        const itemsToMove = getItemsForShipment(basket, sourceShipment.shipmentId)
        if (itemsToMove.length === 0) {
            return null
        }

        const consolidationSuccessful = await consolidateIntoDefaultShipment(
            sourceShipment,
            itemsToMove
        )

        if (consolidationSuccessful) {
            await removeShipment(sourceShipment.shipmentId)
            return sourceShipment.shipmentId
        }

        return null
    }

    /**
     * Removes empty shipments from the basket
     * Special handling for "me" shipment: if "me" is empty but other shipments have items,
     * transfers items to "me" and reconfigures it appropriately, then removes the original shipment
     * @returns {Promise<void>}
     */
    const removeEmptyShipments = async () => {
        if (!basket?.basketId || !basket?.shipments?.length) {
            return
        }

        const emptyShipments = findEmptyShipments(basket)
        if (emptyShipments.length === 0) {
            return
        }

        // Handle default shipment consolidation first
        const consolidatedShipmentId = await handleDefaultShipmentConsolidation(emptyShipments)

        // Remove remaining empty shipments (excluding "me" and any that were consolidated)
        const shipmentsToRemove = emptyShipments.filter((shipment) => {
            return (
                shipment.shipmentId !== DEFAULT_SHIPMENT_ID &&
                shipment.shipmentId !== consolidatedShipmentId
            )
        })

        if (shipmentsToRemove.length > 0) {
            await removeShipmentsInParallel(shipmentsToRemove)
        }
    }

    return {
        assignDefaultShippingMethodsToShipments,
        handleDeliveryOptionChange,
        removeEmptyShipments,
        findExistingDeliveryShipment,
        findExistingPickupShipment,
        createNewDeliveryShipment,
        createNewDeliveryShipmentWithAddress,
        createNewPickupShipment,
        moveItemToDeliveryShipment,
        moveItemsToDeliveryShipment,
        moveItemToPickupShipment,
        moveItemsToPickupShipment,
        findDeliveryShipmentWithSameAddress,
        findOrCreateDeliveryShipment,
        findOrCreatePickupShipment,
        getShipmentForItems,
        findEmptyShipments,
        findShipmentToConsolidate,
        getItemsForShipment
    }
}
