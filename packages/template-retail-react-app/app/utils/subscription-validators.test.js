/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    validateEmail,
    validatePhone,
    createValidator,
    EMAIL_REGEX,
    PHONE_REGEX
} from '@salesforce/retail-react-app/app/utils/subscription-validators'

describe('subscription-validators', () => {
    describe('EMAIL_REGEX', () => {
        test('matches valid email addresses', () => {
            expect(EMAIL_REGEX.test('user@example.com')).toBe(true)
            expect(EMAIL_REGEX.test('test.user@example.com')).toBe(true)
            expect(EMAIL_REGEX.test('user+tag@example.co.uk')).toBe(true)
            expect(EMAIL_REGEX.test('user123@subdomain.example.com')).toBe(true)
            expect(EMAIL_REGEX.test('user_name@exampledomain.com')).toBe(true)
        })

        test('rejects invalid email addresses', () => {
            expect(EMAIL_REGEX.test('invalid')).toBe(false)
            expect(EMAIL_REGEX.test('invalid@')).toBe(false)
            expect(EMAIL_REGEX.test('@example.com')).toBe(false)
            expect(EMAIL_REGEX.test('invalid@.com')).toBe(false)
            expect(EMAIL_REGEX.test('invalid@domain')).toBe(false)
            expect(EMAIL_REGEX.test('invalid @example.com')).toBe(false)
            expect(EMAIL_REGEX.test('')).toBe(false)
        })
    })

    describe('PHONE_REGEX', () => {
        test('matches valid phone numbers in E.164 format', () => {
            expect(PHONE_REGEX.test('+15551234567')).toBe(true)
            expect(PHONE_REGEX.test('+442071234567')).toBe(true)
            expect(PHONE_REGEX.test('+61412345678')).toBe(true)
            expect(PHONE_REGEX.test('15551234567')).toBe(true) // Optional +
        })

        test('rejects invalid phone numbers', () => {
            expect(PHONE_REGEX.test('+0123456789')).toBe(false) // Starts with 0
            expect(PHONE_REGEX.test('+1')).toBe(false) // Too short (only 1 digit)
            expect(PHONE_REGEX.test('1')).toBe(false) // Too short (only 1 digit)
            expect(PHONE_REGEX.test('+1234567890123456')).toBe(false) // Too long
            expect(PHONE_REGEX.test('abc123456789')).toBe(false) // Contains letters
            expect(PHONE_REGEX.test('')).toBe(false)
        })
    })

    describe('validateEmail', () => {
        describe('valid emails', () => {
            test('returns valid: true for standard email', () => {
                const result = validateEmail('user@example.com')
                expect(result).toEqual({valid: true})
            })

            test('returns valid: true for email with subdomain', () => {
                const result = validateEmail('user@mail.example.com')
                expect(result).toEqual({valid: true})
            })

            test('returns valid: true for email with plus addressing', () => {
                const result = validateEmail('user+tag@example.com')
                expect(result).toEqual({valid: true})
            })

            test('returns valid: true for email with dots', () => {
                const result = validateEmail('first.last@example.com')
                expect(result).toEqual({valid: true})
            })

            test('returns valid: true for email with numbers', () => {
                const result = validateEmail('user123@example456.com')
                expect(result).toEqual({valid: true})
            })
        })

        describe('invalid emails', () => {
            test('returns error "required" for empty string', () => {
                const result = validateEmail('')
                expect(result).toEqual({valid: false, error: 'required'})
            })

            test('returns error "required" for whitespace only', () => {
                const result = validateEmail('   ')
                expect(result).toEqual({valid: false, error: 'required'})
            })

            test('returns error "required" for undefined', () => {
                const result = validateEmail(undefined)
                expect(result).toEqual({valid: false, error: 'required'})
            })

            test('returns error "required" for null', () => {
                const result = validateEmail(null)
                expect(result).toEqual({valid: false, error: 'required'})
            })

            test('returns error "invalid_format" for missing @', () => {
                const result = validateEmail('userexample.com')
                expect(result).toEqual({valid: false, error: 'invalid_format'})
            })

            test('returns error "invalid_format" for missing domain', () => {
                const result = validateEmail('user@')
                expect(result).toEqual({valid: false, error: 'invalid_format'})
            })

            test('returns error "invalid_format" for missing TLD', () => {
                const result = validateEmail('user@example')
                expect(result).toEqual({valid: false, error: 'invalid_format'})
            })

            test('returns error "invalid_format" for missing username', () => {
                const result = validateEmail('@example.com')
                expect(result).toEqual({valid: false, error: 'invalid_format'})
            })

            test('returns error "invalid_format" for spaces in email', () => {
                const result = validateEmail('user name@example.com')
                expect(result).toEqual({valid: false, error: 'invalid_format'})
            })

            test('returns error "invalid_format" for invalid characters', () => {
                const result = validateEmail('user@exam ple.com')
                expect(result).toEqual({valid: false, error: 'invalid_format'})
            })
        })
    })

    describe('validatePhone', () => {
        describe('valid phone numbers', () => {
            test('returns valid: true for US number with +', () => {
                const result = validatePhone('+15551234567')
                expect(result).toEqual({valid: true})
            })

            test('returns valid: true for US number without +', () => {
                const result = validatePhone('15551234567')
                expect(result).toEqual({valid: true})
            })

            test('returns valid: true for UK number', () => {
                const result = validatePhone('+442071234567')
                expect(result).toEqual({valid: true})
            })

            test('returns valid: true for Australian number', () => {
                const result = validatePhone('+61412345678')
                expect(result).toEqual({valid: true})
            })

            test('returns valid: true for German number', () => {
                const result = validatePhone('+4915112345678')
                expect(result).toEqual({valid: true})
            })
        })

        describe('invalid phone numbers', () => {
            test('returns error "required" for empty string', () => {
                const result = validatePhone('')
                expect(result).toEqual({valid: false, error: 'required'})
            })

            test('returns error "required" for whitespace only', () => {
                const result = validatePhone('   ')
                expect(result).toEqual({valid: false, error: 'required'})
            })

            test('returns error "required" for undefined', () => {
                const result = validatePhone(undefined)
                expect(result).toEqual({valid: false, error: 'required'})
            })

            test('returns error "required" for null', () => {
                const result = validatePhone(null)
                expect(result).toEqual({valid: false, error: 'required'})
            })

            test('returns error "invalid_format" for number starting with 0', () => {
                const result = validatePhone('+01234567890')
                expect(result).toEqual({valid: false, error: 'invalid_format'})
            })

            test('returns error "invalid_format" for too short number', () => {
                const result = validatePhone('+1') // Only 1 digit
                expect(result).toEqual({valid: false, error: 'invalid_format'})
            })

            test('returns error "invalid_format" for too long number', () => {
                const result = validatePhone('+12345678901234567')
                expect(result).toEqual({valid: false, error: 'invalid_format'})
            })

            test('returns error "invalid_format" for number with letters', () => {
                const result = validatePhone('+1555ABC1234')
                expect(result).toEqual({valid: false, error: 'invalid_format'})
            })

            test('returns error "invalid_format" for number with spaces', () => {
                const result = validatePhone('+1 555 123 4567')
                expect(result).toEqual({valid: false, error: 'invalid_format'})
            })

            test('returns error "invalid_format" for number with dashes', () => {
                const result = validatePhone('+1-555-123-4567')
                expect(result).toEqual({valid: false, error: 'invalid_format'})
            })
        })
    })

    describe('createValidator', () => {
        test('creates a validator function that validates against custom regex', () => {
            const zipCodeRegex = /^\d{5}$/
            const validateZipCode = createValidator(zipCodeRegex)

            expect(validateZipCode('12345')).toEqual({valid: true})
            expect(validateZipCode('ABCDE')).toEqual({valid: false, error: 'invalid_format'})
            expect(validateZipCode('123')).toEqual({valid: false, error: 'invalid_format'})
        })

        test('created validator returns error "required" for empty value', () => {
            const customValidator = createValidator(/^test$/)

            expect(customValidator('')).toEqual({valid: false, error: 'required'})
            expect(customValidator('   ')).toEqual({valid: false, error: 'required'})
        })

        test('created validator returns error "invalid_format" for mismatched value', () => {
            const customValidator = createValidator(/^ABC\d{3}$/)

            expect(customValidator('XYZ123')).toEqual({valid: false, error: 'invalid_format'})
            expect(customValidator('ABC12')).toEqual({valid: false, error: 'invalid_format'})
        })

        test('created validator returns valid: true for matched value', () => {
            const customValidator = createValidator(/^[A-Z]{3}\d{3}$/)

            expect(customValidator('ABC123')).toEqual({valid: true})
            expect(customValidator('XYZ789')).toEqual({valid: true})
        })

        test('creates independent validators that do not interfere', () => {
            const validator1 = createValidator(/^\d{5}$/)
            const validator2 = createValidator(/^[A-Z]{3}$/)

            expect(validator1('12345')).toEqual({valid: true})
            expect(validator1('ABC')).toEqual({valid: false, error: 'invalid_format'})

            expect(validator2('ABC')).toEqual({valid: true})
            expect(validator2('12345')).toEqual({valid: false, error: 'invalid_format'})
        })
    })
})
