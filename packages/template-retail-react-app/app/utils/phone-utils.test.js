/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    formatPhoneNumber,
    validatePhone,
    PHONE_REGEX
} from '@salesforce/retail-react-app/app/utils/phone-utils'

describe('formatPhoneNumber (display formatting)', () => {
    test('formats a phone number for display', () => {
        expect(formatPhoneNumber()).toBeUndefined()
        expect(formatPhoneNumber('')).toBe('')
        expect(formatPhoneNumber('727')).toBe('727')
        expect(formatPhoneNumber('727555')).toBe('(727) 555')
        expect(formatPhoneNumber('7275551234')).toBe('(727) 555-1234')
    })
})

describe('PHONE_REGEX (E.164 validation)', () => {
    test('matches valid phone numbers in E.164 format', () => {
        expect(PHONE_REGEX.test('+15551234567')).toBe(true)
        expect(PHONE_REGEX.test('+442071234567')).toBe(true)
        expect(PHONE_REGEX.test('+61412345678')).toBe(true)
        expect(PHONE_REGEX.test('15551234567')).toBe(true) // Optional +
    })

    test('rejects invalid phone numbers', () => {
        expect(PHONE_REGEX.test('+0123456789')).toBe(false) // Starts with 0
        expect(PHONE_REGEX.test('+1')).toBe(false) // Too short
        expect(PHONE_REGEX.test('1')).toBe(false) // Too short
        expect(PHONE_REGEX.test('+1234567890123456')).toBe(false) // Too long
        expect(PHONE_REGEX.test('abc123456789')).toBe(false) // Contains letters
        expect(PHONE_REGEX.test('')).toBe(false)
    })
})

describe('validatePhone', () => {
    describe('valid phone numbers', () => {
        test('returns valid: true for US number with +', () => {
            expect(validatePhone('+15551234567')).toEqual({valid: true})
        })

        test('returns valid: true for US number without +', () => {
            expect(validatePhone('15551234567')).toEqual({valid: true})
        })

        test('returns valid: true for UK number', () => {
            expect(validatePhone('+442071234567')).toEqual({valid: true})
        })

        test('returns valid: true for Australian number', () => {
            expect(validatePhone('+61412345678')).toEqual({valid: true})
        })

        test('returns valid: true for German number', () => {
            expect(validatePhone('+4915112345678')).toEqual({valid: true})
        })
    })

    describe('invalid phone numbers', () => {
        test('returns error "required" for empty string', () => {
            expect(validatePhone('')).toEqual({valid: false, error: 'required'})
        })

        test('returns error "required" for whitespace only', () => {
            expect(validatePhone('   ')).toEqual({valid: false, error: 'required'})
        })

        test('returns error "required" for undefined', () => {
            expect(validatePhone(undefined)).toEqual({valid: false, error: 'required'})
        })

        test('returns error "required" for null', () => {
            expect(validatePhone(null)).toEqual({valid: false, error: 'required'})
        })

        test('returns error "invalid_format" for number starting with 0', () => {
            expect(validatePhone('+01234567890')).toEqual({valid: false, error: 'invalid_format'})
        })

        test('returns error "invalid_format" for too short number', () => {
            expect(validatePhone('+1')).toEqual({valid: false, error: 'invalid_format'})
        })

        test('returns error "invalid_format" for too long number', () => {
            expect(validatePhone('+12345678901234567')).toEqual({
                valid: false,
                error: 'invalid_format'
            })
        })

        test('returns error "invalid_format" for number with letters', () => {
            expect(validatePhone('+1555ABC1234')).toEqual({valid: false, error: 'invalid_format'})
        })

        test('returns error "invalid_format" for number with spaces', () => {
            expect(validatePhone('+1 555 123 4567')).toEqual({
                valid: false,
                error: 'invalid_format'
            })
        })

        test('returns error "invalid_format" for number with dashes', () => {
            expect(validatePhone('+1-555-123-4567')).toEqual({
                valid: false,
                error: 'invalid_format'
            })
        })
    })
})
