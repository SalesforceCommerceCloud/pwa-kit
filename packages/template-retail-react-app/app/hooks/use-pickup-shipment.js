/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

/**
 * Custom hook to handle pickup in store shipment configuration
 * @returns {Object} Object containing helper functions for pickup shipment management
 */
export const usePickupShipment = () => {
    const {site} = useMultiSite()
    const updateShipmentForBasketMutation = useShopperBasketsMutation('updateShipmentForBasket')

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
     * Ensures pickup shipment is properly configured for the basket
     * @param {string} basketId - The basket ID
     * @param {Array} productItems - Array of product items being added
     * @param {Object} options - Configuration options
     * @param {string} options.pickupShippingMethodId - Shipping method ID for pickup (default: '005')
     * @param {boolean} options.throwOnError - Whether to throw on error (default: false)
     */
    const configurePickupShipment = async (basketId, productItems, options = {}) => {
        const {pickupShippingMethodId = '005', throwOnError = false} = options

        try {
            const pickupItems = productItems.filter((item) => item.inventoryId)
            if (pickupItems.length === 0) return

            // Get store information for the pickup shipment
            const siteId = site?.id
            const storeInfoKey = `store_${siteId}`
            let storeInfo = null

            try {
                storeInfo = JSON.parse(window.localStorage.getItem(storeInfoKey))
            } catch (e) {
                if (throwOnError) throw new Error('Failed to retrieve store information')
                return
            }

            if (!storeInfo?.inventoryId) {
                if (throwOnError) throw new Error('No store inventory ID found')
                return
            }

            // Update shipment to ensure pickup configuration
            await updateShipmentForBasketMutation.mutateAsync({
                parameters: {
                    basketId,
                    shipmentId: 'me'
                },
                body: {
                    shippingMethod: {
                        id: pickupShippingMethodId
                    },
                    c_fromStoreId: storeInfo.id
                }
            })
        } catch (error) {
            if (throwOnError) {
                throw error
            } else {
                // Log error but don't block the add to cart flow
                console.warn('Failed to configure pickup shipment:', error)
            }
        }
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
            return pickupInStoreMap[prodKey]
        })
    }

    /**
     * Gets store information from localStorage
     * @returns {Object|null} Store information object or null if not found
     */
    const getStoreInfo = () => {
        try {
            const siteId = site?.id
            const storeInfoKey = `store_${siteId}`
            return JSON.parse(window.localStorage.getItem(storeInfoKey))
        } catch (e) {
            return null
        }
    }

    /**
     * Adds inventory ID to product items that have pickup selected
     * @param {Array} productItems - Array of product items
     * @param {Object} pickupInStoreMap - Map of product IDs to pickup flags
     * @returns {Array} Updated product items with inventory IDs
     */
    const addInventoryIdsToPickupItems = (productItems, pickupInStoreMap) => {
        const storeInfo = getStoreInfo()
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

    return {
        configurePickupShipment,
        hasPickupItems,
        getStoreInfo,
        addInventoryIdsToPickupItems,
        getPickupShippingMethodId,
        isLoading: updateShipmentForBasketMutation.isLoading
    }
}

export default usePickupShipment
