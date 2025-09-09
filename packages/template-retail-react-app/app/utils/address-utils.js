/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Normalizes a string value to an empty string if it is falsey but not false or 0
 * @param {any} value - The value to normalize
 * @returns {any} The normalized value
 */
const normalize = (value) => (!value && value !== 0 && value !== false ? '' : value)

/**
 * Checks if an address has no meaningful content (all fields are falsey)
 * @param {Object} address
 * @returns {boolean}
 */
export const isAddressEmpty = (address) => {
    if (!address) return true
    return (
        normalize(address.address1) === '' &&
        normalize(address.city) === '' &&
        normalize(address.countryCode) === '' &&
        normalize(address.firstName) === '' &&
        normalize(address.lastName) === '' &&
        normalize(address.phone) === '' &&
        normalize(address.postalCode) === '' &&
        normalize(address.stateCode) === ''
    )
}

/**
 * Compares two addresses to determine if they are the same when the ID is unreliable
 * @param {Object} address1 - First address object
 * @param {Object} address2 - Second address object
 * @returns {boolean} True if addresses match
 */
export const areAddressesEqual = (address1, address2) => {
    return (
        normalize(address1?.address1) === normalize(address2?.address1) &&
        normalize(address1?.city) === normalize(address2?.city) &&
        normalize(address1?.countryCode) === normalize(address2?.countryCode) &&
        normalize(address1?.firstName) === normalize(address2?.firstName) &&
        normalize(address1?.lastName) === normalize(address2?.lastName) &&
        normalize(address1?.postalCode) === normalize(address2?.postalCode) &&
        normalize(address1?.stateCode) === normalize(address2?.stateCode)
    )
}

/**
 * Extracts valid OrderAddress fields from an address object
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
 * Extracts valid CustomerAddress fields from an address object
 * @param {Object} address - The address object (may contain extra fields from customer address)
 * @returns {Object} Clean address object with only OrderAddress fields
 */
export const sanitizedCustomerAddress = (address) => {
    if (!address) return null

    return {
        address1: address.address1,
        address2: address.address2 || '',
        companyName: address.companyName || '',
        city: address.city,
        countryCode: address.countryCode,
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone,
        postalCode: address.postalCode,
        preferred: address.preferred || false,
        stateCode: address.stateCode
    }
}

/**
 * Creates a shipping address object from store information
 * @param {Object} storeInfo - Store information object
 * @returns {Object} Shipping address object formatted for the basket
 */
export const getShippingAddressForStore = (storeInfo) => {
    return {
        address1: storeInfo?.address1,
        city: storeInfo?.city,
        countryCode: storeInfo?.countryCode,
        firstName: storeInfo?.name,
        // note: lastName is required by the API. We don't use it for pick up in the UI.
        lastName: 'pickup',
        phone: storeInfo?.phone,
        postalCode: storeInfo?.postalCode,
        stateCode: storeInfo?.stateCode
    }
}
