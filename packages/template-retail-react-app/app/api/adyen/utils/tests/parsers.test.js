/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getCurrencyValueForApi} from '@salesforce/retail-react-app/app/api/adyen/utils/parsers'

describe('getCurrencyValueForApi', () => {
    it('should correctly convert amount to API currency value for a valid currency', () => {
        const amount = 10
        const currencyCode = 'USD'
        const expectedValue = 1000
        const result = getCurrencyValueForApi(amount, currencyCode)
        expect(result).toBe(expectedValue)
    })

    it('should throw an error for an invalid currency code', () => {
        const amount = 20
        const currencyCode = 'INVALID'
        expect(() => {
            getCurrencyValueForApi(amount, currencyCode)
        }).toThrow('invalid currency!')
    })

    it('should handle decimal conversion for different currency decimals', () => {
        const amount = 15
        const currencyCode = 'EUR'
        const expectedValue = 1500
        const result = getCurrencyValueForApi(amount, currencyCode)
        expect(result).toBe(expectedValue)
    })

    it('should handle zero amount correctly', () => {
        const amount = 0
        const currencyCode = 'USD'
        const expectedValue = 0
        const result = getCurrencyValueForApi(amount, currencyCode)
        expect(result).toBe(expectedValue)
    })
})
