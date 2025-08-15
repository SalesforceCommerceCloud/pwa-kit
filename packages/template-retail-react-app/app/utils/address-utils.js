/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Checks if an address has no meaningful content (all fields are falsey)
 * @param {Object} address
 * @returns {boolean}
 */
export const isAddressEmpty = (address) => {
    if (!address) return true
    return !(
        address.address1 ||
        address.city ||
        address.countryCode ||
        address.firstName ||
        address.lastName ||
        address.phone ||
        address.postalCode ||
        address.stateCode
    )
}
