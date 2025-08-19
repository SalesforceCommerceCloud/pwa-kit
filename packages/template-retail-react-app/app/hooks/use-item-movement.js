/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useCallback} from 'react'
import {useErrorHandler} from '@salesforce/retail-react-app/app/hooks/use-error-handler'
import {DEFAULT_SHIPMENT_ID} from '@salesforce/retail-react-app/app/constants'

/**
 * Hook for item movement operations
 * Focused only on moving items between shipments (basket data manipulation)
 * @param {string} basketId - The basket ID
 * @returns {Object} Object containing item movement functions
 */
export const useItemMovement = (basketId) => {
    const handleError = useErrorHandler()
    const updateItemInBasketMutation = useShopperBasketsMutation('updateItemInBasket')
    const updateItemsInBasketMutation = useShopperBasketsMutation('updateItemsInBasket')

    /**
     * Moves a product item to a pickup shipment
     * @param {Object} productItem - The product item to move
     * @param {string} targetShipmentId - The target shipment ID
     * @param {string} inventoryId - The inventory ID for the store
     * @returns {Promise<Object>} The updated basket response
     */
    const moveItemToPickupShipment = useCallback(
        async (productItem, targetShipmentId, inventoryId) => {
            if (!basketId || !productItem?.itemId) {
                throw new Error('Invalid basket or product item')
            }

            try {
                // Update the item to add inventory ID and move to pickup shipment
                const updateData = {
                    productId: productItem.productId,
                    quantity: productItem.quantity,
                    shipmentId: targetShipmentId,
                    inventoryId: inventoryId
                }

                return await updateItemInBasketMutation.mutateAsync({
                    parameters: {
                        basketId,
                        itemId: productItem.itemId
                    },
                    body: updateData
                })
            } catch (error) {
                handleError('Failed to move item to pickup shipment', error)
                throw error
            }
        },
        [basketId, updateItemInBasketMutation, handleError]
    )

    /**
     * Moves a product item from pickup to delivery shipment
     * @param {Object} productItem - The product item to move
     * @param {string} targetShipmentId - The target shipment ID (optional)
     * @param {string} defaultInventoryId - The default inventory ID to use for delivery items (required)
     * @returns {Promise<Object>} The updated basket response
     */
    const moveItemToDeliveryShipment = useCallback(
        async (productItem, targetShipmentId = DEFAULT_SHIPMENT_ID, defaultInventoryId) => {
            if (!basketId || !productItem?.itemId) {
                throw new Error('Invalid basket or product item')
            }

            try {
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
                        basketId,
                        itemId: productItem.itemId
                    },
                    body: updateData
                })
            } catch (error) {
                handleError('Failed to move item to delivery shipment', error)
                throw error
            }
        },
        [basketId, updateItemInBasketMutation, handleError]
    )

    /**
     * Moves multiple product items from pickup to delivery shipment in parallel
     * @param {Array} productItems - Array of product items to move
     * @param {string} targetShipmentId - The target shipment ID (optional)
     * @param {string} defaultInventoryId - The default inventory ID to use for delivery items (required)
     * @returns {Promise<Object>} The updated basket response
     */
    const moveItemsToDeliveryShipment = useCallback(
        async (productItems, targetShipmentId = DEFAULT_SHIPMENT_ID, defaultInventoryId) => {
            if (!basketId || !Array.isArray(productItems) || productItems.length === 0) {
                throw new Error('Invalid basket or product items array')
            }

            try {
                // Prepare update data for all items
                const updateData = productItems.map((productItem) => ({
                    itemId: productItem.itemId,
                    productId: productItem.productId,
                    quantity: productItem.quantity,
                    shipmentId: targetShipmentId,
                    // Set inventoryId to default for delivery items (instead of null which doesn't work)
                    ...(productItem.inventoryId && {inventoryId: defaultInventoryId})
                }))

                return await updateItemsInBasketMutation.mutateAsync({
                    parameters: {
                        basketId
                    },
                    body: updateData
                })
            } catch (error) {
                handleError('Failed to move items to delivery shipment', error)
                throw error
            }
        },
        [basketId, updateItemsInBasketMutation, handleError]
    )

    /**
     * Moves multiple product items to pickup shipment in parallel
     * @param {Array} productItems - Array of product items to move
     * @param {string} targetShipmentId - The target shipment ID
     * @param {string} inventoryId - The inventory ID for the store
     * @returns {Promise<Object>} The updated basket response
     */
    const moveItemsToPickupShipment = useCallback(
        async (productItems, targetShipmentId, inventoryId) => {
            if (!basketId || !Array.isArray(productItems) || productItems.length === 0) {
                throw new Error('Invalid basket or product items array')
            }

            try {
                // Prepare update data for all items
                const updateData = productItems.map((productItem) => ({
                    itemId: productItem.itemId,
                    productId: productItem.productId,
                    quantity: productItem.quantity,
                    shipmentId: targetShipmentId,
                    inventoryId: inventoryId
                }))

                return await updateItemsInBasketMutation.mutateAsync({
                    parameters: {
                        basketId
                    },
                    body: updateData
                })
            } catch (error) {
                handleError('Failed to move items to pickup shipment', error)
                throw error
            }
        },
        [basketId, updateItemsInBasketMutation, handleError]
    )

    /**
     * Handles delivery option change for a product item
     * Note: this might leave empty shipments behind
     * @param {Object} productItem - The product item
     * @param {boolean} selectedPickup - Whether pickup is selected (true) or delivery is selected (false)
     * @param {Object} storeInfo - The selected store object (required for pickup)
     * @param {string} defaultInventoryId - The default inventory ID to use for delivery items (required)
     * @param {Function} findOrCreatePickupShipment - Function to find or create pickup shipment
     * @param {Function} findOrCreateDeliveryShipment - Function to find or create delivery shipment
     * @returns {Promise<void>}
     */
    const handleDeliveryOptionChange = useCallback(
        async (
            productItem,
            selectedPickup,
            storeInfo,
            defaultInventoryId,
            findOrCreatePickupShipment,
            findOrCreateDeliveryShipment
        ) => {
            if (!basketId || !productItem) {
                throw new Error('Invalid basket or product item')
            }

            try {
                if (selectedPickup) {
                    // Moving to pickup
                    if (!storeInfo?.id) {
                        throw new Error('No store selected for pickup')
                    }

                    if (!storeInfo.inventoryId) {
                        throw new Error('Selected store does not have an inventory ID')
                    }

                    const targetShipmentId = await findOrCreatePickupShipment(storeInfo)
                    if (!targetShipmentId) {
                        throw new Error('Failed to find or create shipment')
                    }

                    // Move the item to the pickup shipment
                    await moveItemToPickupShipment(
                        productItem,
                        targetShipmentId,
                        storeInfo.inventoryId
                    )
                } else {
                    // Moving to delivery
                    const targetShipmentId = await findOrCreateDeliveryShipment()
                    if (!targetShipmentId) {
                        throw new Error('Failed to find or create shipment')
                    }

                    // Move the item to the delivery shipment
                    await moveItemToDeliveryShipment(
                        productItem,
                        targetShipmentId,
                        defaultInventoryId
                    )
                }
            } catch (error) {
                handleError('Failed to handle delivery option change', error)
                throw error
            }
        },
        [basketId, moveItemToPickupShipment, moveItemToDeliveryShipment, handleError]
    )

    return {
        moveItemToPickupShipment,
        moveItemToDeliveryShipment,
        moveItemsToDeliveryShipment,
        moveItemsToPickupShipment,
        handleDeliveryOptionChange
    }
}
