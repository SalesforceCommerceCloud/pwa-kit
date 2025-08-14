/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const formatAddressInAdyenFormat = (address) => {
    return {
        city: address?.city || '',
        country: address?.countryCode || '',
        houseNumberOrName: address?.address2 || '',
        postalCode: address?.postalCode || '',
        stateOrProvince: address?.stateCode || '',
        street: address?.address1 || ''
    }
}
