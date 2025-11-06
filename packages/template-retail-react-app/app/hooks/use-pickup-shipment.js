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
import {DEFAULT_SHIPMENT_ID} from '@salesforce/retail-react-app/app/constants'
import {getShippingAddressForStore} from '@salesforce/retail-react-app/app/utils/address-utils'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'

/**
 * Custom hook to handle pickup in store shipment configuration
 * @returns {Object} Object containing helper functions for pickup shipment management
 */
export const usePickupShipment = (basket) => {
    const updateShipmentForBasketMutation = useShopperBasketsMutation('updateShipmentForBasket')

    // Hook for shipping methods - we'll use refetch when needed
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
     * Gets the shipping method ID for pickup in store
     * @param {Object} shippingMethods - The shipping methods for the shipment
     * @returns {string|null} The shipping method ID for pickup in store, or null if not found
     */
    const getPickupShippingMethodId = (shippingMethods) => {
        if (!shippingMethods?.applicableShippingMethods) {
            return null
        }

        const pickupMethod = shippingMethods.applicableShippingMethods.find(
            (method) => method.c_storePickupEnabled === true
        )

        return pickupMethod?.id || null
    }

    /**
     * Gets the default shipping method ID (non-pickup)
     * @param {Object} shippingMethods - The shipping methods for the shipment
     * @returns {string|null} The default shipping method ID, or null if not found
     */
    const getDefaultShippingMethodId = (shippingMethods) => {
        return shippingMethods?.defaultShippingMethodId || null
    }

    /**
     * Configures pickup shipment for the basket
     * @param {string} basketId - The basket ID
     * @param {Object} storeInfo - Store information object
     * @param {Object} options - Options object
     * @param {string} options.pickupShippingMethodId - Shipping method ID for pickup (default: '005')
     * @returns {Promise<Object>} The updated shipment response
     */
    const updatePickupShipment = async (basketId, storeInfo, options = {}) => {
        const defaultPickupShippingMethodId = '005'
        const {pickupShippingMethodId = defaultPickupShippingMethodId} = options

        if (!storeInfo?.inventoryId) {
            return
        }

        // Update shipment to ensure pickup configuration
        return await updateShipmentForBasketMutation.mutateAsync({
            parameters: {
                basketId,
                shipmentId: DEFAULT_SHIPMENT_ID
            },
            body: {
                shippingMethod: {
                    id: pickupShippingMethodId
                },
                c_fromStoreId: storeInfo.id,
                shippingAddress: getShippingAddressForStore(storeInfo)
            }
        })
    }

    /**
     * Configures regular shipping method for the basket
     * @param {string} basketId - The basket ID
     * @param {string} shippingMethodId - The shipping method ID to set
     * @returns {Promise<Object>} The updated shipment response
     */
    const updateDeliveryShipment = async (basketId, shippingMethodId) => {
        return await updateShipmentForBasketMutation.mutateAsync({
            parameters: {
                basketId,
                shipmentId: DEFAULT_SHIPMENT_ID
            },
            body: {
                shippingMethod: {
                    id: shippingMethodId
                },
                c_fromStoreId: null,
                // Clear shipping address if any. This will be set correctly during checkout
                shippingAddress: {}
            }
        })
    }

    /**
     * Checks if any items in the selection require pickup configuration
     * @param {Array} productSelectionValues - Array of product selection values
     * @param {Object} pickupInStoreMap - Map of product IDs to pickup flags
     * @param {Object} mainProduct - Main product object (for fallback)
     * @returns {boolean} True if any items are pickup items
     */
    const hasPickupItems = (productSelectionValues, pickupInStoreMap, mainProduct) => {
        return productSelectionValues.some((item) => {
            const prodKey =
                (item.variant || item.product || mainProduct).productId ||
                (item.variant || item.product || mainProduct).id

            // Check if the variant product ID is in the pickup map
            if (pickupInStoreMap[prodKey]) {
                return true
            }

            // If not found, also check the master product ID
            return pickupInStoreMap[mainProduct?.id]
        })
    }

    /**
     * Adds inventory ID to product items that have pickup selected
     * @param {Array} productItems - Array of product items
     * @param {Object} pickupInStoreMap - Map of product IDs to pickup flags
     * @param {Object} storeInfo - Store information object containing inventoryId
     * @returns {Array} Updated product items with inventory IDs
     */
    const addInventoryIdsToPickupItems = (productItems, pickupInStoreMap, storeInfo) => {
        if (!storeInfo?.inventoryId) return productItems

        return productItems.map((item) => {
            const prodKey = item.productId || item.id
            if (pickupInStoreMap[prodKey]) {
                return {
                    ...item,
                    inventoryId: storeInfo.inventoryId
                }
            }
            return item
        })
    }

    /**
     * Configure shipping method based on pickup selection for default shipment
     * @param {Object} basket - The basket object
     * @param {string} targetShipmentId - The target shipment ID
     * @param {boolean} selectedPickup - Whether pickup is selected (true) or delivery is selected (false)
     * @param {Object} selectedStore - The selected store information. Required when selectedPickup
     * @returns {Promise<Object>} The updated shipment response
     */
    const updateDefaultShipmentIfNeeded = async (
        basketResponse,
        targetShipmentId,
        selectedPickup,
        selectedStore
    ) => {
        // Only needed for reconfiguring default shipment
        if (
            !basketResponse?.basketId ||
            !basketResponse?.shipments?.length ||
            targetShipmentId !== DEFAULT_SHIPMENT_ID
        ) {
            return
        }

        const currentShipment =
            basketResponse.shipments.find((shipment) => shipment.shipmentId === targetShipmentId) ||
            basketResponse.shipments[0]
        const isCurrentlyPickup = isPickupShipment(currentShipment)
        const currentStoreId = currentShipment.c_fromStoreId

        // Only configure if there's a mismatch between pickup selection and current method
        if (
            selectedPickup !== isCurrentlyPickup ||
            (isCurrentlyPickup && currentStoreId !== selectedStore.id)
        ) {
            // Fetch shipping methods to get available options
            const {data: fetchedShippingMethods} = await refetchShippingMethods()

            if (selectedPickup) {
                // Configure pickup shipment if pickup is selected but current method is not pickup
                const pickupShippingMethodId = getPickupShippingMethodId(fetchedShippingMethods)
                return await updatePickupShipment(basketResponse.basketId, selectedStore, {
                    pickupShippingMethodId
                })
            } else {
                // Configure regular shipping if pickup is not selected but current method is pickup
                const defaultShippingMethodId = getDefaultShippingMethodId(fetchedShippingMethods)
                return await updateDeliveryShipment(
                    basketResponse.basketId,
                    defaultShippingMethodId
                )
            }
        }
    }

    return {
        updatePickupShipment,
        updateDeliveryShipment,
        updateDefaultShipmentIfNeeded,
        hasPickupItems,
        addInventoryIdsToPickupItems,
        getPickupShippingMethodId,
        getDefaultShippingMethodId,
        updateShipmentForBasketMutation
    }
}

export default usePickupShipment
