/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useCallback} from 'react'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'
import {cleanAddressForOrder} from '@salesforce/retail-react-app/app/utils/shipment-utils'

/**
 * Hook for basic shipment CRUD operations
 * Focused only on shipment management (API calls)
 * @param {string} basketId - The basket ID
 * @returns {Object} Object containing shipment operation functions
 */
export const useShipmentOperations = (basketId) => {
    const {showToast} = useToast()
    const createShipmentMutation = useShopperBasketsMutation('createShipmentForBasket')
    const removeShipmentMutation = useShopperBasketsMutation('removeShipmentFromBasket')
    const updateShipmentMutation = useShopperBasketsMutation('updateShipmentForBasket')
    const updateShippingMethodMutation = useShopperBasketsMutation(
        'updateShippingMethodForShipment'
    )

    const handleError = useCallback(
        (message, error) => {
            logger.warn(message, {
                namespace: 'useShipmentOperations.handleError',
                additionalProperties: {
                    error: error
                }
            })
            showToast({
                title: message,
                status: 'error'
            })
        },
        [showToast]
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

            try {
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
            } catch (error) {
                handleError('Failed to create shipment', error)
                throw error
            }
        },
        [basketId]
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

            try {
                await removeShipmentMutation.mutateAsync({
                    parameters: {
                        basketId,
                        shipmentId
                    }
                })
            } catch (error) {
                handleError('Failed to remove shipment', error)
                throw error
            }
        },
        [basketId]
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

            try {
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
            } catch (error) {
                handleError('Failed to update shipment address', error)
                throw error
            }
        },
        [basketId]
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

            try {
                return await updateShippingMethodMutation.mutateAsync({
                    parameters: {
                        basketId,
                        shipmentId
                    },
                    body: {
                        id: shippingMethodId
                    }
                })
            } catch (error) {
                handleError('Failed to update shipping method', error)
                throw error
            }
        },
        [basketId]
    )

    return {
        createShipment,
        removeShipment,
        updateShipmentAddress,
        updateShippingMethod
    }
}
