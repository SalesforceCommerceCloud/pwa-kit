/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useCallback} from 'react'
import {DEFAULT_SHIPMENT_ID} from '@salesforce/retail-react-app/app/constants'

/**
 * Hook for item shipment management operations
 * Focused only on moving items between shipments (basket data manipulation)
 * @param {string} basketId - The basket ID
 * @returns {Object} Object containing item shipment management functions
 */
export const useItemShipmentManagement = (basketId) => {
    const updateItemInBasketMutation = useShopperBasketsMutation('updateItemInBasket')
    const updateItemsInBasketMutation = useShopperBasketsMutation('updateItemsInBasket')

    /**
     * Updates a product item to a pickup shipment
     * @param {Object} productItem - The product item to update
     * @param {string} targetShipmentId - The target shipment ID
     * @param {string} inventoryId - The inventory ID for the store
     * @returns {Promise<Object>} The updated basket response
     */
    const updateItemToPickupShipment = useCallback(
        async (productItem, targetShipmentId, inventoryId) => {
            if (!basketId || !productItem?.itemId) {
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
                    basketId,
                    itemId: productItem.itemId
                },
                body: updateData
            })
        },
        [basketId, updateItemInBasketMutation]
    )

    /**
     * Updates a product item from pickup to delivery shipment
     * @param {Object} productItem - The product item to update
     * @param {string} targetShipmentId - The target shipment ID (optional)
     * @param {string} defaultInventoryId - The default inventory ID to use for delivery items (required)
     * @returns {Promise<Object>} The updated basket response
     */
    const updateItemToDeliveryShipment = useCallback(
        async (productItem, targetShipmentId = DEFAULT_SHIPMENT_ID, defaultInventoryId) => {
            if (!basketId || !productItem?.itemId) {
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
                    basketId,
                    itemId: productItem.itemId
                },
                body: updateData
            })
        },
        [basketId, updateItemInBasketMutation]
    )

    /**
     * Updates multiple product items from pickup to delivery shipment in parallel
     * @param {Array} productItems - Array of product items to update
     * @param {string} targetShipmentId - The target shipment ID (optional)
     * @param {string} defaultInventoryId - The default inventory ID to use for delivery items (required)
     * @returns {Promise<Object>} The updated basket response
     */
    const updateItemsToDeliveryShipment = useCallback(
        async (productItems, targetShipmentId = DEFAULT_SHIPMENT_ID, defaultInventoryId) => {
            if (!basketId || !Array.isArray(productItems)) {
                throw new Error('Invalid basket or product items array')
            }

            if (productItems.length === 0) {
                return {updated: true}
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

            return await updateItemsInBasketMutation.mutateAsync({
                parameters: {
                    basketId
                },
                body: updateData
            })
        },
        [basketId, updateItemsInBasketMutation]
    )

    /**
     * Updates multiple product items to pickup shipment in parallel
     * @param {Array} productItems - Array of product items to update
     * @param {string} targetShipmentId - The target shipment ID
     * @param {string} inventoryId - The inventory ID for the store
     * @returns {Promise<Object>} The updated basket response
     */
    const updateItemsToPickupShipment = useCallback(
        async (productItems, targetShipmentId, inventoryId) => {
            if (!basketId || !Array.isArray(productItems)) {
                throw new Error('Invalid basket or product items array')
            }

            if (productItems.length === 0) {
                return {updated: true}
            }

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
        },
        [basketId, updateItemsInBasketMutation]
    )

    /**
     * Updates delivery option for a product item
     * Note: this might leave empty shipments behind
     * @param {Object} productItem - The product item
     * @param {boolean} selectedPickup - Whether pickup is selected (true) or delivery is selected (false)
     * @param {Object} storeInfo - The selected store object (required for pickup)
     * @param {string} defaultInventoryId - The default inventory ID to use for delivery items (required)
     * @param {Function} findOrCreatePickupShipment - Function to find or create pickup shipment
     * @param {Function} findOrCreateDeliveryShipment - Function to find or create delivery shipment
     * @returns {Promise<void>}
     */
    const updateDeliveryOption = useCallback(
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

            if (selectedPickup) {
                // Moving to pickup
                if (!storeInfo?.id) {
                    throw new Error('No store selected for pickup')
                }

                if (!storeInfo.inventoryId) {
                    throw new Error('Selected store does not have an inventory ID')
                }

                const targetShipmentId = (await findOrCreatePickupShipment(storeInfo))?.shipmentId
                if (!targetShipmentId) {
                    throw new Error('Failed to find or create shipment')
                }

                // Update the item to the pickup shipment
                await updateItemToPickupShipment(
                    productItem,
                    targetShipmentId,
                    storeInfo.inventoryId
                )
            } else {
                // Moving to delivery
                const targetShipmentId = (await findOrCreateDeliveryShipment())?.shipmentId
                if (!targetShipmentId) {
                    throw new Error('Failed to find or create shipment')
                }

                // Update the item to the delivery shipment
                await updateItemToDeliveryShipment(
                    productItem,
                    targetShipmentId,
                    defaultInventoryId
                )
            }
        },
        [basketId, updateItemToPickupShipment, updateItemToDeliveryShipment]
    )

    return {
        updateItemToPickupShipment,
        updateItemToDeliveryShipment,
        updateItemsToDeliveryShipment,
        updateItemsToPickupShipment,
        updateDeliveryOption
    }
}
