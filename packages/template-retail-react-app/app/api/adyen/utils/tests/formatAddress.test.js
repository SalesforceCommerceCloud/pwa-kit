/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {formatAddressInAdyenFormat} from '@salesforce/retail-react-app/app/api/adyen/utils/formatAddress'

describe('formatAddressInAdyenFormat', () => {
    it('should format address in Adyen format with provided address object', () => {
        const address = {
            city: 'New York',
            countryCode: 'US',
            address2: 'Apt 123',
            postalCode: '10001',
            stateCode: 'NY',
            address1: '123 Main St'
        }

        const formattedAddress = formatAddressInAdyenFormat(address)

        expect(formattedAddress).toEqual({
            city: 'New York',
            country: 'US',
            houseNumberOrName: 'Apt 123',
            postalCode: '10001',
            stateOrProvince: 'NY',
            street: '123 Main St'
        })
    })

    it('should format address in Adyen format with missing or empty fields', () => {
        const address = {
            city: 'Los Angeles'
        }

        const formattedAddress = formatAddressInAdyenFormat(address)

        expect(formattedAddress).toEqual({
            city: 'Los Angeles',
            country: '',
            houseNumberOrName: '',
            postalCode: '',
            stateOrProvince: '',
            street: ''
        })
    })

    it('should return empty fields when provided address object is null or undefined', () => {
        const formattedAddressNull = formatAddressInAdyenFormat(null)
        const formattedAddressUndefined = formatAddressInAdyenFormat(undefined)

        expect(formattedAddressNull).toEqual({
            city: '',
            country: '',
            houseNumberOrName: '',
            postalCode: '',
            stateOrProvince: '',
            street: ''
        })

        expect(formattedAddressUndefined).toEqual({
            city: '',
            country: '',
            houseNumberOrName: '',
            postalCode: '',
            stateOrProvince: '',
            street: ''
        })
    })
})
