/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useCallback} from 'react'
import {cleanAddressForOrder} from '@salesforce/retail-react-app/app/utils/shipment-utils'

/**
 * Hook for basic shipment CRUD operations
 * Focused only on shipment management (API calls)
 * @param {string} basketId - The basket ID
 * @returns {Object} Object containing shipment operation functions
 */
export const useShipmentOperations = (basketId) => {
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
            if (!basketId) {
                throw new Error('Missing basketId')
            }

            const body = {}

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
                    basketId
                },
                body
            })

            // Find the newly created shipment
            const newShipment = response?.shipments?.find(
                (shipment) => !response.shipments.slice(0, -1).includes(shipment)
            )

            return newShipment
        },
        [basketId, createShipmentMutation]
    )

    /**
     * Removes a shipment from the basket
     * @param {string} shipmentId - The shipment ID to remove
     * @returns {Promise<void>}
     */
    const removeShipment = useCallback(
        async (shipmentId) => {
            if (!basketId || !shipmentId) {
                throw new Error('Missing basketId or shipmentId')
            }

            await removeShipmentMutation.mutateAsync({
                parameters: {
                    basketId,
                    shipmentId
                }
            })
        },
        [basketId, removeShipmentMutation]
    )

    /**
     * Updates the shipping address for a shipment
     * @param {string} shipmentId - The shipment ID to update
     * @param {Object} address - The new shipping address
     * @returns {Promise<Object>} The updated basket response
     */
    const updateShipmentAddress = useCallback(
        async (shipmentId, address) => {
            if (!basketId || !shipmentId || !address) {
                throw new Error('Missing basketId, shipmentId, or address')
            }

            const shippingAddress = cleanAddressForOrder(address)

            return await updateShipmentMutation.mutateAsync({
                parameters: {
                    basketId,
                    shipmentId
                },
                body: {
                    shippingAddress
                }
            })
        },
        [basketId, updateShipmentMutation]
    )

    /**
     * Updates the shipping method for a shipment
     * @param {string} shipmentId - The shipment ID to update
     * @param {string} shippingMethodId - The new shipping method ID
     * @returns {Promise<Object>} The updated basket response
     */
    const updateShippingMethod = useCallback(
        async (shipmentId, shippingMethodId) => {
            if (!basketId || !shipmentId || !shippingMethodId) {
                throw new Error('Missing basketId, shipmentId, or shippingMethodId')
            }

            return await updateShippingMethodMutation.mutateAsync({
                parameters: {
                    basketId,
                    shipmentId
                },
                body: {
                    id: shippingMethodId
                }
            })
        },
        [basketId, updateShippingMethodMutation]
    )

    return {
        createShipment,
        removeShipment,
        updateShipmentAddress,
        updateShippingMethod
    }
}
