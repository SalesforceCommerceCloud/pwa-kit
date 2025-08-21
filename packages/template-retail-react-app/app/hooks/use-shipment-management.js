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

    /**
     * Orchestrates shipment operations
     *
     * @param {Array} deliveryItems
     * @param {Object} selectedAddresses - Object mapping item IDs to selected address IDs
     * @param {Array} finalAddresses
     * @returns {Promise<Object>}
     */
    const orchestrateShipmentOperations = useCallback(
        async (deliveryItems, selectedAddresses, finalAddresses) => {
            try {
                const addressToItemsMap = {}
                let basketAfterItemMoves = null

                deliveryItems.forEach((item) => {
                    // Defaults to first address if no address is selected
                    const addressId = selectedAddresses[item.itemId] || finalAddresses[0]?.addressId
                    const address = finalAddresses.find((addr) => addr.addressId === addressId)

                    // If there is an existing shipment with the same address, use it in the next step
                    const shipmentIdWithSameAddress = findDeliveryShipmentWithSameAddress(
                        basket,
                        address
                    )

                    if (!addressToItemsMap[addressId]) {
                        addressToItemsMap[addressId] = {
                            address: address,
                            items: [],
                            shipmentId: shipmentIdWithSameAddress
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
                            Object.values(addressToItemsMap).map((d) => d.shipmentId)
                        )
                        targetShipmentId = targetShipment?.shipmentId
                        if (targetShipmentId) {
                            await updateDeliveryAddressForShipment(targetShipmentId, address)
                        } else {
                            targetShipmentId = await createNewDeliveryShipmentWithAddress(
                                basket,
                                address
                            )
                        }
                    }
                    // Set the shipmentId for the unique address
                    addressToItemsMap[addressId].shipmentId = targetShipmentId
                    // Move items to the new shipment if needed.
                    const itemsToMove = items.filter((item) => item.shipmentId !== targetShipmentId)
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
        },
        [
            basket,
            findDeliveryShipmentWithSameAddress,
            findUnusedDeliveryShipment,
            createNewDeliveryShipmentWithAddress,
            updateDeliveryAddressForShipment,
            moveItemsToDeliveryShipment,
            removeEmptyShipments
        ]
    )

    return {
        orchestrateShipmentOperations
    }
}
