/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    cleanAddressForOrder,
    areAddressesEqual
} from '@salesforce/retail-react-app/app/utils/address-utils'
import {DEFAULT_SHIPMENT_ID} from '@salesforce/retail-react-app/app/constants'

/**
 * Pure utility functions for shipment operations
 * No side effects, easily testable
 */

/**
 * Checks if a shipping method is a pickup method
 * @param {Object} shippingMethod - The shipping method object
 * @returns {boolean} True if the shipping method is a pickup method
 */
export const isPickupMethod = (shippingMethod) => {
    return shippingMethod?.c_storePickupEnabled === true
}

/**
 * Checks if a shipment is configured for pickup-in-store
 * @param {object} shipment the shipment to check. can be null.
 * @returns {boolean} true if the shipment is configured for pickup-in-store.
 */
export const isPickupShipment = (shipment) => {
    return isPickupMethod(shipment?.shippingMethod)
}

/**
 * Gets items that belong to a specific shipment
 * @param {Object} basket - The basket object
 * @param {string} shipmentId - The shipment ID
 * @returns {Array} Array of product items
 */
export const getItemsForShipment = (basket, shipmentId) => {
    if (!basket?.productItems || !shipmentId) return []
    return basket.productItems.filter((item) => item.shipmentId === shipmentId)
}

/**
 * Finds shipments that have no items assigned to them
 * @param {Object} basket - The basket object
 * @returns {Array} Array of empty shipments
 */
export const findEmptyShipments = (basket) => {
    if (!basket?.shipments?.length) {
        return []
    }

    return basket.shipments.filter((shipment) => {
        const hasItems = basket.productItems?.some(
            (item) => item.shipmentId === shipment.shipmentId
        )
        return !hasItems
    })
}

/**
 * Groups items by their address using a provided function to get the address for each item
 * @param {Array} items - Array of items to group
 * @param {Function} getAddressForItem - Function that returns the address for a given item
 * @returns {Object} Object with addresses as keys and arrays of items as values
 */
export const groupItemsByAddress = (items, getAddressForItem) => {
    if (!items?.length || typeof getAddressForItem !== 'function') {
        return {}
    }

    return items.reduce((groups, item) => {
        const address = getAddressForItem(item)
        if (!address) return groups

        // Create a key for the address
        const addressKey = JSON.stringify(cleanAddressForOrder(address))

        if (!groups[addressKey]) {
            groups[addressKey] = []
        }
        groups[addressKey].push(item)

        return groups
    }, {})
}

/**
 * Finds the first existing delivery shipment (not pickup)
 * @param {Object} basket - The basket object
 * @returns {Object|null} The delivery shipment object or null if not found
 */
export const findExistingDeliveryShipment = (basket) => {
    if (!basket?.shipments) return null

    return basket.shipments.find((shipment) => !isPickupMethod(shipment.shippingMethod)) || null
}

/**
 * Finds the first existing pickup shipment for a specific store
 * @param {Object} basket - The basket object
 * @param {string} storeId - The store ID to search for
 * @returns {Object|null} The pickup shipment object or null if not found
 */
export const findExistingPickupShipment = (basket, storeId) => {
    if (!basket?.shipments || !storeId) return null

    return (
        basket.shipments.find(
            (shipment) =>
                isPickupMethod(shipment.shippingMethod) && shipment.c_fromStoreId === storeId
        ) || null
    )
}

/**
 * Finds the first delivery shipment that is not in the provided list of shipment IDs
 * @param {Object} basket - The basket object
 * @param {Array} usedShipmentIds - Array of shipment IDs to exclude from search
 * @returns {Object|null} The unused delivery shipment object or null if not found
 */
export const findUnusedDeliveryShipment = (basket, usedShipmentIds = []) => {
    if (!basket?.shipments) return null

    return (
        basket.shipments.find(
            (shipment) =>
                !isPickupMethod(shipment.shippingMethod) &&
                !usedShipmentIds.includes(shipment.shipmentId)
        ) || null
    )
}

/**
 * Finds the first existing delivery shipment with matching address
 * @param {Object} basket - The basket object
 * @param {Object} address - The address to match
 * @returns {Object|null} The shipment object with matching address or null if not found
 */
export const findDeliveryShipmentWithSameAddress = (basket, address) => {
    if (!basket?.shipments || !address) return null

    const foundShipment = basket.shipments.find((shipment) => {
        // Must be a delivery shipment (not pickup)
        if (isPickupMethod(shipment.shippingMethod)) {
            return false
        }

        // Check if shipment has a shipping address that matches
        return shipment.shippingAddress && areAddressesEqual(shipment.shippingAddress, address)
    })
    return foundShipment || null
}

/**
 * Finds the best non-empty shipment to consolidate into the default shipment
 * @param {Object} basket - The basket object
 * @returns {Object|null} The shipment to consolidate or null if none found
 */
export const findShipmentToConsolidate = (basket) => {
    if (!basket?.shipments?.length) {
        return null
    }

    return (
        basket.shipments.find((shipment) => {
            const hasItems = basket.productItems?.some(
                (item) => item.shipmentId === shipment.shipmentId
            )
            return hasItems && shipment.shipmentId !== DEFAULT_SHIPMENT_ID
        }) || null
    )
}

/**
 * Checks if the default shipment is empty
 * @param {Object} basket - The basket object
 * @returns {boolean} True if the default shipment is empty
 */
export const isDefaultShipmentEmpty = (basket) => {
    if (!basket?.shipments) return true

    const defaultShipment = basket.shipments.find(
        (shipment) => shipment.shipmentId === DEFAULT_SHIPMENT_ID
    )

    if (!defaultShipment) return true

    return !basket.productItems?.some((item) => item.shipmentId === DEFAULT_SHIPMENT_ID)
}

/**
 * Groups shipments into pickup and delivery arrays
 * @param {Object} order - The order or basket object containing shipments
 * @returns {Object} Object with pickup and delivery arrays of shipments
 */
export const groupShipmentsByDeliveryOption = (order) => {
    const pickupShipments = []
    const deliveryShipments = []

    order?.shipments?.forEach((shipment) => {
        const isPickup = isPickupShipment(shipment)
        if (isPickup) {
            pickupShipments.push(shipment)
        } else {
            deliveryShipments.push(shipment)
        }
    })

    return {pickupShipments, deliveryShipments}
}
