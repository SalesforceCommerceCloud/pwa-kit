/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback} from 'react'
import {useMultiship} from './use-multiship'

/**
 * Hook for processing shipments in multi-shipping
 * Handle shipment operations: creating, moving items, and cleanup
 * 
 * @param {Object} basket
 * @returns {Object}
 */
export const useShipmentProcessing = (basket) => {
    const {
        findDeliveryShipmentWithSameAddress,
        findUnusedDeliveryShipment,
        createNewDeliveryShipmentWithAddress,
        updateDeliveryAddressForShipment,
        moveItemsToDeliveryShipment,
        removeEmptyShipments
    } = useMultiship(basket)

    /**
     * Processes shipments from item-address mapping
     * 
     * @param {Object} groupedItemsByAddress
     * @returns {Promise<Object>}
     */
    const processShipments = useCallback(async (groupedItemsByAddress) => {
        try {
            let basketAfterItemMoves = null

            // Process each address group
            for (const [addressKey, {address, items}] of Object.entries(groupedItemsByAddress)) {
                // Find existing shipment with same address or create new one
                let targetShipmentId = findDeliveryShipmentWithSameAddress(basket, address)
                
                if (!targetShipmentId) {
                    // Find unused shipment or create new one
                    const unusedShipment = findUnusedDeliveryShipment(basket, [])
                    if (unusedShipment) {
                        targetShipmentId = unusedShipment.shipmentId
                        await updateDeliveryAddressForShipment(targetShipmentId, address)
                    } else {
                        targetShipmentId = await createNewDeliveryShipmentWithAddress(basket, address)
                    }
                }

                // Move items to the target shipment
                const itemsToMove = items.filter(itemId => {
                    const item = basket.productItems?.find(i => i.itemId === itemId)
                    return item && item.shipmentId !== targetShipmentId
                })

                if (itemsToMove.length > 0) {
                    basketAfterItemMoves = await moveItemsToDeliveryShipment(
                        itemsToMove,
                        targetShipmentId
                    )
                }
            }

            await removeEmptyShipments(basketAfterItemMoves || basket)

            return {success: true}
        } catch (error) {
            throw new Error(`Failed to process shipments: ${error.message}`)
        }
    }, [
        basket,
        findDeliveryShipmentWithSameAddress,
        findUnusedDeliveryShipment,
        createNewDeliveryShipmentWithAddress,
        updateDeliveryAddressForShipment,
        moveItemsToDeliveryShipment,
        removeEmptyShipments
    ])

    return {
        processShipments
    }
}
