/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback} from 'react'
import {useMultiship} from './use-multiship'
import {useItemShipmentManagement} from './use-item-shipment-management'

/**
 * Hook for processing shipments in multi-shipping
 * creating shipments, moving items, and cleanup
 *
 * @param {Object} basket
 * @returns {Object}
 */
export const useShipmentManagement = (basket) => {
    const {
        findDeliveryShipmentWithSameAddress,
        findUnusedDeliveryShipment,
        createNewDeliveryShipmentWithAddress,
        updateDeliveryAddressForShipment,
        moveItemsToDeliveryShipment,
        removeEmptyShipments
    } = useMultiship(basket)

    const {updateItemsToDeliveryShipment} = useItemShipmentManagement(basket?.basketId)

    /**
     * Orchestrates shipment operations
     *
     * @param {Array} deliveryItems
     * @param {Object} selectedAddresses - Object mapping item IDs to selected address IDs
     * @param {Array} finalAddresses
     * @param {Object} productsMap - Product data for inventory information
     * @returns {Promise<Object>}
     */
    const orchestrateShipmentOperations = useCallback(
        async (deliveryItems, selectedAddresses, finalAddresses, productsMap) => {
            try {
                const addressToItemsMap = {}
                let basketAfterItemMoves = null

                deliveryItems.forEach((item) => {
                    // Use the unified selectedAddresses from useAddressProductManagement
                    const addressId = selectedAddresses[item.itemId] || finalAddresses[0]?.addressId
                    const address = finalAddresses.find((addr) => addr.addressId === addressId)

                    // If there is an existing shipment with the same address, use it in the next step
                    const shipmentWithSameAddress = findDeliveryShipmentWithSameAddress(basket, address)

                    if (!addressToItemsMap[addressId]) {
                        addressToItemsMap[addressId] = {
                            address: address,
                            items: [],
                            shipmentId: shipmentWithSameAddress?.shipmentId
                        }
                    }
                    addressToItemsMap[addressId].items.push(item)
                })

                // For each unique address, if there is no usable existing shipment, create a new one.
                for (const [addressId, data] of Object.entries(addressToItemsMap)) {
                    const {address, items, shipmentId: existingShipmentId} = data

                    let targetShipmentId = existingShipmentId
                    if (!targetShipmentId) {
                        const targetShipment = findUnusedDeliveryShipment(
                            basket,
                            Object.values(addressToItemsMap)
                                .map((d) => d.shipmentId)
                                .filter(Boolean) // Filter out undefined/null values
                        )
                        targetShipmentId = targetShipment?.shipmentId
                        if (targetShipmentId) {
                            await updateDeliveryAddressForShipment(targetShipmentId, address)
                        } else {
                            const newShipment = await createNewDeliveryShipmentWithAddress(
                                basket,
                                address
                            )
                            targetShipmentId = newShipment?.shipmentId
                        }
                    }
                    // Set the shipmentId for the unique address
                    addressToItemsMap[addressId].shipmentId = targetShipmentId
                    // Move items to the new shipment if needed.
                    const itemsToMove = items.filter((item) => item.shipmentId !== targetShipmentId)
                    if (itemsToMove.length > 0) {
                        // Get default inventory ID from the first item's product data
                        const firstItem = itemsToMove[0]
                        const productData = productsMap?.[firstItem.productId]
                        const defaultInventoryId = productData?.inventory?.id

                        if (!defaultInventoryId) {
                            throw new Error(`No inventory ID found for product ${firstItem.productId}`)
                        }

                        basketAfterItemMoves = await updateItemsToDeliveryShipment(
                            itemsToMove,
                            targetShipmentId,
                            defaultInventoryId
                        )
                    }
                }
                await removeEmptyShipments(basketAfterItemMoves || basket)

                return {success: true}
            } catch (error) {
                throw new Error(`Failed to process shipments: ${error.message}`)
            }
        },
        [
            basket,
            findDeliveryShipmentWithSameAddress,
            findUnusedDeliveryShipment,
            createNewDeliveryShipmentWithAddress,
            updateDeliveryAddressForShipment,
            updateItemsToDeliveryShipment,
            removeEmptyShipments
        ]
    )

    return {
        orchestrateShipmentOperations
    }
}
