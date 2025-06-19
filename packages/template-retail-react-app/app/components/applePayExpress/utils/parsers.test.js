import {getCurrencyValueForApi} from './parsers'

describe('parsers', () => {
    describe('getCurrencyValueForApi', () => {
        it('should convert USD amount correctly', () => {
            const result = getCurrencyValueForApi(100.50, 'USD')
            expect(result).toBe(10050) // 100.50 * 10^2 = 10050 cents
        })

        it('should convert EUR amount correctly', () => {
            const result = getCurrencyValueForApi(25.99, 'EUR')
            expect(result).toBe(2599) // 25.99 * 10^2 = 2599 cents
        })

        it('should handle JPY correctly (0 decimals)', () => {
            const result = getCurrencyValueForApi(1000, 'JPY')
            expect(result).toBe(1000) // 1000 * 10^0 = 1000 yen
        })

        it('should handle BHD correctly (3 decimals)', () => {
            const result = getCurrencyValueForApi(10.500, 'BHD')
            expect(result).toBe(10500) // 10.500 * 10^3 = 10500
        })

        it('should handle zero amount', () => {
            const result = getCurrencyValueForApi(0, 'USD')
            expect(result).toBe(0)
        })

        it('should handle integer amounts', () => {
            const result = getCurrencyValueForApi(100, 'USD')
            expect(result).toBe(10000) // 100 * 10^2 = 10000 cents
        })

        it('should throw error for invalid amount', () => {
            expect(() => getCurrencyValueForApi('invalid', 'USD')).toThrow('Invalid amount: invalid')
        })

        it('should throw error for NaN amount', () => {
            expect(() => getCurrencyValueForApi(NaN, 'USD')).toThrow('Invalid amount: NaN')
        })

        it('should throw error for unsupported currency', () => {
            expect(() => getCurrencyValueForApi(100, 'INVALID')).toThrow('Unsupported or unknown currency code: INVALID')
        })

        it('should throw error for null amount', () => {
            expect(() => getCurrencyValueForApi(null, 'USD')).toThrow('Invalid amount: null')
        })

        it('should throw error for undefined amount', () => {
            expect(() => getCurrencyValueForApi(undefined, 'USD')).toThrow('Invalid amount: undefined')
        })
    })
}) 