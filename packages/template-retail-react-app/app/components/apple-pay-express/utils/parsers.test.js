/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getCurrencyValueForApi} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/parsers'
import CurrencyList from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/currency-list'

describe('parsers', () => {
    describe('getCurrencyValueForApi', () => {
        describe('valid currency conversions', () => {
            it('should convert USD amount correctly (2 decimals)', () => {
                const result = getCurrencyValueForApi(10.99, 'USD')
                expect(result).toBe(1099) // 10.99 * 10^2 = 1099
            })

            it('should convert EUR amount correctly (2 decimals)', () => {
                const result = getCurrencyValueForApi(25.5, 'EUR')
                expect(result).toBe(2550) // 25.50 * 10^2 = 2550
            })

            it('should convert JPY amount correctly (0 decimals)', () => {
                const result = getCurrencyValueForApi(1000, 'JPY')
                expect(result).toBe(1000) // 1000 * 10^0 = 1000
            })

            it('should convert BHD amount correctly (3 decimals)', () => {
                const result = getCurrencyValueForApi(5.123, 'BHD')
                expect(result).toBe(5123) // 5.123 * 10^3 = 5123
            })

            it('should handle zero amount', () => {
                const result = getCurrencyValueForApi(0, 'USD')
                expect(result).toBe(0)
            })

            it('should handle integer amounts', () => {
                const result = getCurrencyValueForApi(100, 'USD')
                expect(result).toBe(10000) // 100 * 10^2 = 10000
            })

            it('should round decimal amounts correctly', () => {
                const result = getCurrencyValueForApi(10.999, 'USD')
                expect(result).toBe(1100) // 10.999 * 10^2 = 1099.9, rounded to 1100
            })

            it('should handle very small amounts', () => {
                const result = getCurrencyValueForApi(0.01, 'USD')
                expect(result).toBe(1) // 0.01 * 10^2 = 1
            })

            it('should handle large amounts', () => {
                const result = getCurrencyValueForApi(999999.99, 'USD')
                expect(result).toBe(99999999) // 999999.99 * 10^2 = 99999999
            })
        })

        describe('edge cases', () => {
            it('should handle negative amounts', () => {
                const result = getCurrencyValueForApi(-10.5, 'USD')
                expect(result).toBe(-1050) // -10.50 * 10^2 = -1050
            })

            it('should handle very long decimal places', () => {
                const result = getCurrencyValueForApi(10.123456789, 'USD')
                expect(result).toBe(1012) // 10.123456789 * 10^2 = 1012.3456789, rounded to 1012
            })

            it('should handle scientific notation', () => {
                const result = getCurrencyValueForApi(1e-2, 'USD') // 0.01
                expect(result).toBe(1) // 0.01 * 10^2 = 1
            })
        })

        describe('invalid currency codes', () => {
            it('should throw error for invalid currency code', () => {
                expect(() => getCurrencyValueForApi(100, 'INVALID')).toThrow(
                    'Invalid currency code: INVALID'
                )
            })

            it('should throw error for empty currency code', () => {
                expect(() => getCurrencyValueForApi(100, '')).toThrow('Invalid currency code: ')
            })

            it('should throw error for null currency code', () => {
                expect(() => getCurrencyValueForApi(100, null)).toThrow(
                    'Invalid currency code: null'
                )
            })

            it('should throw error for undefined currency code', () => {
                expect(() => getCurrencyValueForApi(100, undefined)).toThrow(
                    'Invalid currency code: undefined'
                )
            })

            it('should throw error for non-existent currency code', () => {
                expect(() => getCurrencyValueForApi(100, 'XYZ')).toThrow(
                    'Invalid currency code: XYZ'
                )
            })
        })

        describe('currency-specific tests', () => {
            it('should work with all currencies in CurrencyList', () => {
                // Test a few currencies from the list to ensure they all work
                const testCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']

                testCurrencies.forEach((currencyCode) => {
                    const result = getCurrencyValueForApi(10, currencyCode)
                    expect(typeof result).toBe('number')
                    expect(Number.isInteger(result)).toBe(true)
                })
            })

            it('should handle currencies with different decimal places', () => {
                // Test currencies with 0, 2, and 3 decimal places
                const testCases = [
                    {currency: 'JPY', decimals: 0, amount: 1000, expected: 1000},
                    {currency: 'USD', decimals: 2, amount: 10.99, expected: 1099},
                    {currency: 'BHD', decimals: 3, amount: 5.123, expected: 5123}
                ]

                testCases.forEach(({currency, decimals, amount, expected}) => {
                    const result = getCurrencyValueForApi(amount, currency)
                    expect(result).toBe(expected)
                })
            })
        })

        describe('mathematical accuracy', () => {
            it('should maintain precision for small amounts', () => {
                const result = getCurrencyValueForApi(0.001, 'BHD') // 3 decimals
                expect(result).toBe(1) // 0.001 * 10^3 = 1
            })

            it('should handle rounding correctly for edge cases', () => {
                const result = getCurrencyValueForApi(10.555, 'USD')
                expect(result).toBe(1056) // 10.555 * 10^2 = 1055.5, rounded to 1056
            })

            it('should handle maximum safe integer amounts', () => {
                const maxSafeAmount = Number.MAX_SAFE_INTEGER / Math.pow(10, 2)
                const result = getCurrencyValueForApi(maxSafeAmount, 'USD')
                expect(result).toBe(Number.MAX_SAFE_INTEGER)
            })
        })
    })
})
