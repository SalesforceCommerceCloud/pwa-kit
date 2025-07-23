/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getCurrencyValueForApi, getGPShippingOptionParameters} from './parsers'

// Mock the currency list
jest.mock('./currency-list', () => [
    {Code: 'USD', Decimals: 2},
    {Code: 'EUR', Decimals: 2},
    {Code: 'JPY', Decimals: 0}
])

describe('getCurrencyValueForApi', () => {
    it('should convert USD amount correctly', () => {
        const result = getCurrencyValueForApi(100.50, 'USD')
        expect(result).toBe(10050) // 100.50 * 10^2
    })

    it('should convert EUR amount correctly', () => {
        const result = getCurrencyValueForApi(25.99, 'EUR')
        expect(result).toBe(2599) // 25.99 * 10^2
    })

    it('should convert JPY amount correctly (no decimals)', () => {
        const result = getCurrencyValueForApi(1000, 'JPY')
        expect(result).toBe(1000) // 1000 * 10^0
    })

    it('should handle zero amount', () => {
        const result = getCurrencyValueForApi(0, 'USD')
        expect(result).toBe(0)
    })

    it('should throw error for invalid currency', () => {
        expect(() => {
            getCurrencyValueForApi(100, 'INVALID')
        }).toThrow('Invalid currency code: INVALID')
    })

    it('should handle decimal amounts correctly', () => {
        const result = getCurrencyValueForApi(0.01, 'USD')
        expect(result).toBe(1) // 0.01 * 10^2
    })
})

describe('getShippingOptionParameters', () => {
    it('should convert shipping methods to shipping option parameters with prices', () => {
        const shippingMethods = {
            applicableShippingMethods: [
                {
                    id: 'shipping-1',
                    name: 'Standard Shipping',
                    description: '5-7 business days',
                    price: 5.99
                },
                {
                    id: 'shipping-2', 
                    name: 'Express Shipping',
                    description: '2-3 business days',
                    price: 12.99
                }
            ],
            defaultShippingMethodId: 'shipping-1'
        }

        const result = getGPShippingOptionParameters(shippingMethods)

        expect(result).toEqual({
            defaultSelectedOptionId: 'shipping-1',
            shippingOptions: [
                {
                    id: 'shipping-1',
                    label: '$5.99: Standard Shipping',
                    description: '5-7 business days'
                },
                {
                    id: 'shipping-2',
                    label: '$12.99: Express Shipping', 
                    description: '2-3 business days'
                }
            ]
        })
    })

    it('should handle shipping methods without prices', () => {
        const shippingMethods = {
            applicableShippingMethods: [
                {
                    id: 'shipping-1',
                    name: 'Free Shipping',
                    description: 'Free standard shipping'
                },
                {
                    id: 'shipping-2',
                    name: 'Premium Shipping',
                    description: 'Fast delivery',
                    price: 15.00
                }
            ],
            defaultShippingMethodId: 'shipping-1'
        }

        const result = getGPShippingOptionParameters(shippingMethods)

        expect(result).toEqual({
            defaultSelectedOptionId: 'shipping-1',
            shippingOptions: [
                {
                    id: 'shipping-1',
                    label: 'Free Shipping',
                    description: 'Free standard shipping'
                },
                {
                    id: 'shipping-2',
                    label: '$15.00: Premium Shipping',
                    description: 'Fast delivery'
                }
            ]
        })
    })

    it('should handle empty applicable shipping methods', () => {
        const shippingMethods = {
            defaultShippingMethodId: 'method-1',
            applicableShippingMethods: []
        }

        const result = getGPShippingOptionParameters(shippingMethods)

        expect(result).toBeUndefined()
    })

    it('should handle null/undefined shipping methods', () => {
        const result = getGPShippingOptionParameters(null)
        expect(result).toBeUndefined()
    })

    it('should handle undefined shipping methods', () => {
        const result = getGPShippingOptionParameters(undefined)
        expect(result).toBeUndefined()
    })
}) 