/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    isAddressEmpty,
    areAddressesEqual,
    cleanAddressForOrder,
    sanitizedCustomerAddress,
    getShippingAddressForStore
} from '@salesforce/retail-react-app/app/utils/address-utils'

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

        test('should handle edge cases with 0 and false values', () => {
            // normalize preserves 0 and false as meaningful values
            // Since they don't equal '', the address is NOT considered empty
            const addressWithZero = {
                address1: 0,
                city: '',
                countryCode: '',
                firstName: '',
                lastName: '',
                phone: '',
                postalCode: '',
                stateCode: ''
            }
            expect(isAddressEmpty(addressWithZero)).toBe(false)

            const addressWithFalse = {
                address1: false,
                city: '',
                countryCode: '',
                firstName: '',
                lastName: '',
                phone: '',
                postalCode: '',
                stateCode: ''
            }
            expect(isAddressEmpty(addressWithFalse)).toBe(false)

            // Test that only null, undefined, and empty string values result in empty address
            const addressWithOnlyNullUndefinedEmpty = {
                address1: null,
                city: undefined,
                countryCode: '',
                firstName: null,
                lastName: undefined,
                phone: '',
                postalCode: null,
                stateCode: ''
            }
            expect(isAddressEmpty(addressWithOnlyNullUndefinedEmpty)).toBe(true)
        })
    })

    describe('areAddressesEqual', () => {
        test('should return true for identical addresses', () => {
            const address1 = {
                address1: '123 Main St',
                city: 'New York',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                postalCode: '10001',
                stateCode: 'NY'
            }
            const address2 = {
                address1: '123 Main St',
                city: 'New York',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                postalCode: '10001',
                stateCode: 'NY'
            }
            expect(areAddressesEqual(address1, address2)).toBe(true)
        })

        test('should return false for different addresses', () => {
            const address1 = {
                address1: '123 Main St',
                city: 'New York',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                postalCode: '10001',
                stateCode: 'NY'
            }
            const address2 = {
                address1: '456 Oak Ave',
                city: 'New York',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                postalCode: '10001',
                stateCode: 'NY'
            }
            expect(areAddressesEqual(address1, address2)).toBe(false)
        })

        test('should handle null and undefined addresses', () => {
            const address = {
                address1: '123 Main St',
                city: 'New York',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                postalCode: '10001',
                stateCode: 'NY'
            }
            expect(areAddressesEqual(null, address)).toBe(false)
            expect(areAddressesEqual(address, null)).toBe(false)
            expect(areAddressesEqual(null, null)).toBe(true)
            expect(areAddressesEqual(undefined, undefined)).toBe(true)
        })

        test('should normalize falsey values correctly', () => {
            const address1 = {
                address1: '123 Main St',
                city: null,
                countryCode: 'US',
                firstName: '',
                lastName: undefined,
                postalCode: '10001',
                stateCode: 'NY'
            }
            const address2 = {
                address1: '123 Main St',
                city: '',
                countryCode: 'US',
                firstName: '',
                lastName: '',
                postalCode: '10001',
                stateCode: 'NY'
            }
            expect(areAddressesEqual(address1, address2)).toBe(true)
        })

        test('should handle 0 and false values correctly', () => {
            const address1 = {
                address1: 0,
                city: 'New York',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                postalCode: '10001',
                stateCode: 'NY'
            }
            const address2 = {
                address1: 0,
                city: 'New York',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                postalCode: '10001',
                stateCode: 'NY'
            }
            expect(areAddressesEqual(address1, address2)).toBe(true)

            const address3 = {
                address1: false,
                city: 'New York',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                postalCode: '10001',
                stateCode: 'NY'
            }
            const address4 = {
                address1: false,
                city: 'New York',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                postalCode: '10001',
                stateCode: 'NY'
            }
            expect(areAddressesEqual(address3, address4)).toBe(true)
        })
    })

    describe('cleanAddressForOrder', () => {
        test('should return null for null address', () => {
            expect(cleanAddressForOrder(null)).toBeNull()
        })

        test('should return null for undefined address', () => {
            expect(cleanAddressForOrder(undefined)).toBeNull()
        })

        test('should extract only valid OrderAddress fields', () => {
            const customerAddress = {
                address1: '123 Main St',
                city: 'New York',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                phone: '555-1234',
                postalCode: '10001',
                stateCode: 'NY',
                // Extra fields that should be filtered out
                id: 'customer-address-123',
                customerId: 'customer-456',
                preferred: true,
                addressId: 'addr-789'
            }

            const result = cleanAddressForOrder(customerAddress)

            expect(result).toEqual({
                address1: '123 Main St',
                city: 'New York',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                phone: '555-1234',
                postalCode: '10001',
                stateCode: 'NY'
            })

            // Ensure extra fields are not included
            expect(result.id).toBeUndefined()
            expect(result.customerId).toBeUndefined()
            expect(result.preferred).toBeUndefined()
            expect(result.addressId).toBeUndefined()
        })

        test('should handle partial address data', () => {
            const partialAddress = {
                address1: '123 Main St',
                city: 'New York',
                countryCode: 'US'
                // Missing other fields
            }

            const result = cleanAddressForOrder(partialAddress)

            expect(result).toEqual({
                address1: '123 Main St',
                city: 'New York',
                countryCode: 'US',
                firstName: undefined,
                lastName: undefined,
                phone: undefined,
                postalCode: undefined,
                stateCode: undefined
            })
        })
    })

    describe('sanitizedCustomerAddress', () => {
        test('should return null for null address', () => {
            expect(sanitizedCustomerAddress(null)).toBeNull()
        })

        test('should return null for undefined address', () => {
            expect(sanitizedCustomerAddress(undefined)).toBeNull()
        })

        test('should extract valid CustomerAddress fields and default optional ones', () => {
            const input = {
                address1: '500 Terry Francois St',
                city: 'San Francisco',
                countryCode: 'US',
                firstName: 'Ada',
                lastName: 'Lovelace',
                phone: '415-555-1234',
                postalCode: '94158',
                stateCode: 'CA',
                // Extra fields to be ignored
                id: 'abc123',
                customerId: 'cust-1'
            }

            const result = sanitizedCustomerAddress(input)

            expect(result).toEqual({
                address1: '500 Terry Francois St',
                address2: '',
                companyName: '',
                city: 'San Francisco',
                countryCode: 'US',
                firstName: 'Ada',
                lastName: 'Lovelace',
                phone: '415-555-1234',
                postalCode: '94158',
                preferred: false,
                stateCode: 'CA'
            })

            expect(result.id).toBeUndefined()
            expect(result.customerId).toBeUndefined()
        })

        test('should preserve provided optional fields', () => {
            const input = {
                address1: '1 Infinite Loop',
                address2: 'Suite 100',
                companyName: 'Apple',
                city: 'Cupertino',
                countryCode: 'US',
                firstName: 'Steve',
                lastName: 'Jobs',
                phone: '408-555-0000',
                postalCode: '95014',
                preferred: true,
                stateCode: 'CA'
            }

            const result = sanitizedCustomerAddress(input)

            expect(result).toEqual({
                address1: '1 Infinite Loop',
                address2: 'Suite 100',
                companyName: 'Apple',
                city: 'Cupertino',
                countryCode: 'US',
                firstName: 'Steve',
                lastName: 'Jobs',
                phone: '408-555-0000',
                postalCode: '95014',
                preferred: true,
                stateCode: 'CA'
            })
        })

        test('should handle partial data and default address2/companyName/preferred', () => {
            const input = {
                address1: '221B Baker Street',
                city: 'London',
                countryCode: 'GB'
                // other fields missing
            }

            const result = sanitizedCustomerAddress(input)

            expect(result).toEqual({
                address1: '221B Baker Street',
                address2: '',
                companyName: '',
                city: 'London',
                countryCode: 'GB',
                firstName: undefined,
                lastName: undefined,
                phone: undefined,
                postalCode: undefined,
                preferred: false,
                stateCode: undefined
            })
        })
    })

    describe('getShippingAddressForStore', () => {
        test('should create shipping address from store info', () => {
            const storeInfo = {
                name: 'Downtown Store',
                address1: '456 Store St',
                city: 'Los Angeles',
                countryCode: 'US',
                phone: '555-9876',
                postalCode: '90210',
                stateCode: 'CA'
            }

            const result = getShippingAddressForStore(storeInfo)

            expect(result).toEqual({
                address1: '456 Store St',
                city: 'Los Angeles',
                countryCode: 'US',
                firstName: 'Downtown Store',
                lastName: 'pickup',
                phone: '555-9876',
                postalCode: '90210',
                stateCode: 'CA'
            })
        })

        test('should handle store info with missing fields', () => {
            const partialStoreInfo = {
                name: 'Partial Store',
                address1: '789 Incomplete Ave'
                // Missing other fields
            }

            const result = getShippingAddressForStore(partialStoreInfo)

            expect(result).toEqual({
                address1: '789 Incomplete Ave',
                city: undefined,
                countryCode: undefined,
                firstName: 'Partial Store',
                lastName: 'pickup',
                phone: undefined,
                postalCode: undefined,
                stateCode: undefined
            })
        })

        test('should handle null store info', () => {
            const result = getShippingAddressForStore(null)

            expect(result).toEqual({
                address1: undefined,
                city: undefined,
                countryCode: undefined,
                firstName: undefined,
                lastName: 'pickup',
                phone: undefined,
                postalCode: undefined,
                stateCode: undefined
            })
        })

        test('should handle undefined store info', () => {
            const result = getShippingAddressForStore(undefined)

            expect(result).toEqual({
                address1: undefined,
                city: undefined,
                countryCode: undefined,
                firstName: undefined,
                lastName: 'pickup',
                phone: undefined,
                postalCode: undefined,
                stateCode: undefined
            })
        })
    })
})
