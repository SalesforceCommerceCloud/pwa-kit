/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {isAddressEmpty} from '@salesforce/retail-react-app/app/utils/address-utils'

describe('address-utils', () => {
    describe('isAddressEmpty', () => {
        test('should return true for null address', () => {
            expect(isAddressEmpty(null)).toBe(true)
        })

        test('should return true for undefined address', () => {
            expect(isAddressEmpty(undefined)).toBe(true)
        })

        test('should return true for address with all falsey values', () => {
            const emptyAddress = {
                address1: '',
                city: null,
                countryCode: undefined,
                firstName: '',
                lastName: null,
                phone: undefined,
                postalCode: '',
                stateCode: null
            }
            expect(isAddressEmpty(emptyAddress)).toBe(true)
        })

        test('should return false for address with some truthy values', () => {
            const partialAddress = {
                address1: '123 Main St',
                city: '',
                countryCode: 'US',
                firstName: '',
                lastName: 'Doe',
                phone: '',
                postalCode: '',
                stateCode: ''
            }
            expect(isAddressEmpty(partialAddress)).toBe(false)
        })

        test('should return false for complete address', () => {
            const completeAddress = {
                address1: '123 Main St',
                city: 'New York',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                phone: '555-1234',
                postalCode: '10001',
                stateCode: 'NY'
            }
            expect(isAddressEmpty(completeAddress)).toBe(false)
        })
    })
})
