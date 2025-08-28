/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useCallback} from 'react'
import {cleanAddressForOrder} from '@salesforce/retail-react-app/app/utils/address-utils'
import {nanoid} from 'nanoid'

/**
 * Hook for basic shipment CRUD operations
 * Focused only on shipment management (API calls)
 * @param {Object} basket - The basket object
 * @returns {Object} Object containing shipment operation functions
 */
export const useShipmentOperations = (basket) => {
    const createShipmentMutation = useShopperBasketsMutation('createShipmentForBasket')
    const removeShipmentMutation = useShopperBasketsMutation('removeShipmentFromBasket')
    const updateShipmentMutation = useShopperBasketsMutation('updateShipmentForBasket')
    const updateShippingMethodMutation = useShopperBasketsMutation(
        'updateShippingMethodForShipment'
    )

    /**
     * Creates a new shipment
     * @param {Object} address - The shipping address for the shipment
     * @param {Object} options - Additional options for shipment creation
     * @param {string} options.shippingMethodId - The shipping method ID
     * @param {string} options.storeId - The store ID for pickup shipments
     * @returns {Promise<Object>} The created shipment object
     */
    const createShipment = useCallback(
        async (address, options = {}) => {
            if (!basket?.basketId) {
                throw new Error('Missing basket or basketId')
            }

            const body = {
                // For some instance configurations shipmentId is required.
                // Remove this line to use the server default ID generation
                shipmentId: `shipment_${nanoid()}`
            }

            if (address) {
                body.shippingAddress = cleanAddressForOrder(address)
            }

            if (options.shippingMethodId) {
                body.shippingMethod = {
                    id: options.shippingMethodId
                }
            }

            if (options.storeId) {
                body.c_fromStoreId = options.storeId
            }

            const response = await createShipmentMutation.mutateAsync({
                parameters: {
                    basketId: basket.basketId
                },
                body
            })

            // Find the newly created shipment by comparing with original basket
            if (!basket?.shipments || !response?.shipments) {
                throw new Error(
                    'Unable to identify new shipment: missing basket or response shipments'
                )
            }

            // Get existing shipment IDs from the original basket
            const existingShipmentIds = new Set(basket.shipments.map((s) => s.shipmentId))

            // Find the shipment that doesn't exist in the original basket
            const newShipment = response.shipments.find(
                (shipment) => !existingShipmentIds.has(shipment.shipmentId)
            )

            if (!newShipment) {
                throw new Error(
                    'Unable to identify new shipment: no new shipment found in response'
                )
            }

            return newShipment
        },
        [basket, createShipmentMutation]
    )

    /**
     * Removes a shipment from the basket
     * @param {string} shipmentId - The shipment ID to remove
     * @returns {Promise<void>}
     */
    const removeShipment = useCallback(
        async (shipmentId) => {
            if (!basket?.basketId || !shipmentId) {
                throw new Error('Missing basket or shipmentId')
            }

            await removeShipmentMutation.mutateAsync({
                parameters: {
                    basketId: basket.basketId,
                    shipmentId
                }
            })
        },
        [basket, removeShipmentMutation]
    )

    /**
     * Updates the shipping address for a shipment
     * @param {string} shipmentId - The shipment ID to update
     * @param {Object} address - The new shipping address
     * @returns {Promise<Object>} The updated basket response
     */
    const updateShipmentAddress = useCallback(
        async (shipmentId, address) => {
            if (!basket?.basketId || !shipmentId || !address) {
                throw new Error('Missing basket, shipmentId, or address')
            }

            const shippingAddress = cleanAddressForOrder(address)

            return await updateShipmentMutation.mutateAsync({
                parameters: {
                    basketId: basket.basketId,
                    shipmentId
                },
                body: {
                    shippingAddress
                }
            })
        },
        [basket, updateShipmentMutation]
    )

    /**
     * Updates the shipping method for a shipment
     * @param {string} shipmentId - The shipment ID to update
     * @param {string} shippingMethodId - The new shipping method ID
     * @returns {Promise<Object>} The updated basket response
     */
    const updateShippingMethod = useCallback(
        async (shipmentId, shippingMethodId) => {
            if (!basket?.basketId || !shipmentId || !shippingMethodId) {
                throw new Error('Missing basket, shipmentId, or shippingMethodId')
            }

            return await updateShippingMethodMutation.mutateAsync({
                parameters: {
                    basketId: basket.basketId,
                    shipmentId
                },
                body: {
                    id: shippingMethodId
                }
            })
        },
        [basket, updateShippingMethodMutation]
    )

    return {
        createShipment,
        removeShipment,
        updateShipmentAddress,
        updateShippingMethod
    }
}
