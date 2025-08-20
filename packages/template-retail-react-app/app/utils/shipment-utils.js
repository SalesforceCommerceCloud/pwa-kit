/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {isAddressEmpty} from '@salesforce/retail-react-app/app/utils/address-utils'
import {DEFAULT_SHIPMENT_ID} from '@salesforce/retail-react-app/app/constants'

/**
 * Pure utility functions for shipment operations
 * No side effects, easily testable
 */

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
 * @param {Function} isPickupMethod - Function to check if a shipping method is pickup
 * @returns {Object|null} The delivery shipment object or null if not found
 */
export const findExistingDeliveryShipment = (basket, isPickupMethod) => {
    if (!basket?.shipments) return null

    return basket.shipments.find((shipment) => !isPickupMethod(shipment.shippingMethod)) || null
}

/**
 * Finds the first existing pickup shipment for a specific store
 * @param {Object} basket - The basket object
 * @param {string} storeId - The store ID to search for
 * @param {Function} isPickupMethod - Function to check if a shipping method is pickup
 * @returns {Object|null} The pickup shipment object or null if not found
 */
export const findExistingPickupShipment = (basket, storeId, isPickupMethod) => {
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
 * @param {Function} isPickupMethod - Function to check if a shipping method is pickup
 * @returns {Object|null} The unused delivery shipment object or null if not found
 */
export const findUnusedDeliveryShipment = (basket, usedShipmentIds = [], isPickupMethod) => {
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
 * Compares two addresses to determine if they are the same
 * @param {Object} address1 - First address object
 * @param {Object} address2 - Second address object
 * @returns {boolean} True if addresses match
 */
export const areAddressesEqual = (address1, address2) => {
    // Normalize falsey values (null, undefined, empty string)
    const normalize = (value) => (!value ? '' : value)

    return (
        normalize(address1?.firstName) === normalize(address2?.firstName) &&
        normalize(address1?.lastName) === normalize(address2?.lastName) &&
        normalize(address1?.address1) === normalize(address2?.address1) &&
        normalize(address1?.city) === normalize(address2?.city) &&
        normalize(address1?.stateCode) === normalize(address2?.stateCode) &&
        normalize(address1?.postalCode) === normalize(address2?.postalCode) &&
        normalize(address1?.countryCode) === normalize(address2?.countryCode)
    )
}

/**
 * Extracts only valid OrderAddress fields from an address object
 * @param {Object} address - The address object (may contain extra fields from customer address)
 * @returns {Object} Clean address object with only OrderAddress fields
 */
export const cleanAddressForOrder = (address) => {
    if (!address) return null

    return {
        address1: address.address1,
        city: address.city,
        countryCode: address.countryCode,
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone,
        postalCode: address.postalCode,
        stateCode: address.stateCode
    }
}

/**
 * Finds the first existing delivery shipment with matching address
 * @param {Object} basket - The basket object
 * @param {Object} address - The address to match
 * @param {Function} isPickupMethod - Function to check if a shipping method is pickup
 * @returns {Object|null} The shipment object with matching address or null if not found
 */
export const findDeliveryShipmentWithSameAddress = (basket, address, isPickupMethod) => {
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
 * Finds the first existing delivery shipment that has no address or an empty address
 * @param {Object} basket - The basket object
 * @param {Function} isPickupMethod - Function to check if a shipping method is pickup
 * @returns {Object|null} The shipment object without address or null if not found
 */
export const findDeliveryShipmentWithoutAddress = (basket, isPickupMethod) => {
    if (!basket?.shipments) return null

    const foundShipment = basket.shipments.find((shipment) => {
        // Must be a delivery shipment (not pickup)
        if (isPickupMethod(shipment.shippingMethod)) {
            return false
        }

        // Check if shipment has no address or empty address
        const address = shipment.shippingAddress
        if (!address) {
            return true
        }

        // Check if all address fields are falsey (empty address)
        return isAddressEmpty(address)
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
