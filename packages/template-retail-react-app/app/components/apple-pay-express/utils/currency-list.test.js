/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import CurrencyList from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/currency-list'

describe('currencyList', () => {
    it('should be an array', () => {
        expect(Array.isArray(CurrencyList)).toBe(true)
    })

    it('should not be empty', () => {
        expect(CurrencyList.length).toBeGreaterThan(0)
    })

    it('should contain currency objects with required properties', () => {
        const firstCurrency = CurrencyList[0]
        expect(firstCurrency).toHaveProperty('Code')
        expect(firstCurrency).toHaveProperty('Currency')
        expect(firstCurrency).toHaveProperty('Decimals')
    })

    it('should have valid currency codes', () => {
        CurrencyList.forEach((currency) => {
            expect(typeof currency.Code).toBe('string')
            expect(currency.Code).toHaveLength(3)
            expect(currency.Code).toMatch(/^[A-Z]{3}$/)
        })
    })

    it('should have valid currency names', () => {
        CurrencyList.forEach((currency) => {
            expect(typeof currency.Currency).toBe('string')
            expect(currency.Currency.length).toBeGreaterThan(0)
        })
    })

    it('should have valid decimal values', () => {
        CurrencyList.forEach((currency) => {
            expect(typeof currency.Decimals).toBe('string')
            const decimals = parseInt(currency.Decimals, 10)
            expect(decimals).toBeGreaterThanOrEqual(0)
            expect(decimals).toBeLessThanOrEqual(4)
        })
    })

    it('should contain common currencies', () => {
        const codes = CurrencyList.map((c) => c.Code)
        expect(codes).toContain('USD')
        expect(codes).toContain('EUR')
        expect(codes).toContain('GBP')
        expect(codes).toContain('JPY')
        expect(codes).toContain('CAD')
    })

    it('should have unique currency codes', () => {
        const codes = CurrencyList.map((c) => c.Code)
        const uniqueCodes = [...new Set(codes)]
        expect(uniqueCodes).toHaveLength(codes.length)
    })

    it('should have USD with 2 decimals', () => {
        const usd = CurrencyList.find((c) => c.Code === 'USD')
        expect(usd).toBeDefined()
        expect(usd.Decimals).toBe('2')
    })

    it('should have JPY with 0 decimals', () => {
        const jpy = CurrencyList.find((c) => c.Code === 'JPY')
        expect(jpy).toBeDefined()
        expect(jpy.Decimals).toBe('0')
    })

    it('should have BHD with 3 decimals', () => {
        const bhd = CurrencyList.find((c) => c.Code === 'BHD')
        expect(bhd).toBeDefined()
        expect(bhd.Decimals).toBe('3')
    })
})
