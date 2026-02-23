/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {isValidEmail, validateEmail} from '@salesforce/retail-react-app/app/utils/email-utils'

describe('isValidEmail', () => {
    describe('valid email addresses', () => {
        test('should return true for basic email format', () => {
            expect(isValidEmail('test@example.com')).toBe(true)
        })

        test('should return true for email with subdomain', () => {
            expect(isValidEmail('user@mail.example.com')).toBe(true)
        })

        test('should return true for email with numbers', () => {
            expect(isValidEmail('user123@example123.com')).toBe(true)
        })

        test('should return true for email with special characters', () => {
            expect(isValidEmail('user.name+tag@example-domain.co.uk')).toBe(true)
        })

        test('should return true for email with international characters', () => {
            expect(isValidEmail('tëst@éxämplé.com')).toBe(true)
        })

        test('should return true for email with various special characters', () => {
            expect(isValidEmail("user!#$%&'*+/=?^`{|}~-@example.com")).toBe(true)
        })

        test('should return true for email with long domain', () => {
            expect(isValidEmail('test@very-long-domain-name-that-is-still-valid.com')).toBe(true)
        })

        test('should return true for email with single character local part', () => {
            expect(isValidEmail('a@example.com')).toBe(true)
        })

        test('should return true for email with single character domain', () => {
            expect(isValidEmail('test@a.com')).toBe(true)
        })

        test('should return true for very long email addresses', () => {
            const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com'
            expect(isValidEmail(longEmail)).toBe(true)
        })

        test('should return true for email with maximum valid length', () => {
            const maxLengthEmail = 'a'.repeat(64) + '@' + 'b'.repeat(63) + '.com'
            expect(isValidEmail(maxLengthEmail)).toBe(true)
        })

        test('should return true for email with mixed case', () => {
            expect(isValidEmail('Test.User@Example.COM')).toBe(true)
        })

        test('should return true for email with numbers in domain', () => {
            expect(isValidEmail('test@example123.com')).toBe(true)
        })

        test('should return true for email with hyphen in domain', () => {
            expect(isValidEmail('test@example-domain.com')).toBe(true)
        })

        test('should return true for email with consecutive dots (regex allows this)', () => {
            expect(isValidEmail('test..user@example.com')).toBe(true)
        })

        test('should return true for email starting with dot (regex allows this)', () => {
            expect(isValidEmail('.test@example.com')).toBe(true)
        })

        test('should return true for email ending with dot (regex allows this)', () => {
            expect(isValidEmail('test.@example.com')).toBe(true)
        })
    })

    describe('invalid email addresses', () => {
        test('should return false for empty string', () => {
            expect(isValidEmail('')).toBe(false)
        })

        test('should return false for null', () => {
            expect(isValidEmail(null)).toBe(false)
        })

        test('should return false for undefined', () => {
            expect(isValidEmail(undefined)).toBe(false)
        })

        test('should return false for email without @ symbol', () => {
            expect(isValidEmail('testexample.com')).toBe(false)
        })

        test('should return false for email with multiple @ symbols', () => {
            expect(isValidEmail('test@@example.com')).toBe(false)
        })

        test('should return false for email without domain', () => {
            expect(isValidEmail('test@')).toBe(false)
        })

        test('should return false for email without local part', () => {
            expect(isValidEmail('@example.com')).toBe(false)
        })

        test('should return false for email with spaces', () => {
            expect(isValidEmail('test @example.com')).toBe(false)
        })

        test('should return false for email with invalid characters', () => {
            expect(isValidEmail('test()@example.com')).toBe(false)
        })

        test('should return false for domain without TLD', () => {
            expect(isValidEmail('test@example')).toBe(false)
        })

        test('should return false for domain with invalid TLD', () => {
            expect(isValidEmail('test@example.')).toBe(false)
        })

        test('should return false for domain with consecutive dots', () => {
            expect(isValidEmail('test@example..com')).toBe(false)
        })

        test('should return false for domain starting with dot', () => {
            expect(isValidEmail('test@.example.com')).toBe(false)
        })

        test('should return false for domain ending with dot', () => {
            expect(isValidEmail('test@example.com.')).toBe(false)
        })

        test('should return false for non-string input', () => {
            expect(isValidEmail(123)).toBe(false)
            expect(isValidEmail({})).toBe(false)
            expect(isValidEmail([])).toBe(false)
        })

        test('should return false for email with hyphen at start of domain part', () => {
            expect(isValidEmail('test@-example.com')).toBe(false)
        })

        test('should return false for email with hyphen at end of domain part', () => {
            expect(isValidEmail('test@example-.com')).toBe(false)
        })

        test('should return false for single-character TLD', () => {
            expect(isValidEmail('test@example.o')).toBe(false)
            expect(isValidEmail('test@example.c')).toBe(false)
        })
    })

    describe('TLD length', () => {
        test('should accept two-character TLDs', () => {
            expect(isValidEmail('test@example.co')).toBe(true)
            expect(isValidEmail('test@example.uk')).toBe(true)
        })

        test('should accept longer TLDs', () => {
            expect(isValidEmail('test@example.com')).toBe(true)
            expect(isValidEmail('test@example.museum')).toBe(true)
            expect(isValidEmail('test@example.travel')).toBe(true)
        })
    })
})

describe('validateEmail', () => {
    describe('valid emails', () => {
        test('returns valid: true for standard email', () => {
            expect(validateEmail('user@example.com')).toEqual({valid: true})
        })

        test('returns valid: true for email with subdomain', () => {
            expect(validateEmail('user@mail.example.com')).toEqual({valid: true})
        })

        test('returns valid: true for email with plus addressing', () => {
            expect(validateEmail('user+tag@example.com')).toEqual({valid: true})
        })

        test('returns valid: true for email with dots', () => {
            expect(validateEmail('first.last@example.com')).toEqual({valid: true})
        })

        test('returns valid: true for email with numbers', () => {
            expect(validateEmail('user123@example456.com')).toEqual({valid: true})
        })
    })

    describe('invalid emails', () => {
        test('returns error "required" for empty string', () => {
            expect(validateEmail('')).toEqual({valid: false, error: 'required'})
        })

        test('returns error "required" for whitespace only', () => {
            expect(validateEmail('   ')).toEqual({valid: false, error: 'required'})
        })

        test('returns error "required" for undefined', () => {
            expect(validateEmail(undefined)).toEqual({valid: false, error: 'required'})
        })

        test('returns error "required" for null', () => {
            expect(validateEmail(null)).toEqual({valid: false, error: 'required'})
        })

        test('returns error "invalid_format" for missing @', () => {
            expect(validateEmail('userexample.com')).toEqual({
                valid: false,
                error: 'invalid_format'
            })
        })

        test('returns error "invalid_format" for missing domain', () => {
            expect(validateEmail('user@')).toEqual({valid: false, error: 'invalid_format'})
        })

        test('returns error "invalid_format" for missing TLD', () => {
            expect(validateEmail('user@example')).toEqual({valid: false, error: 'invalid_format'})
        })

        test('returns error "invalid_format" for missing username', () => {
            expect(validateEmail('@example.com')).toEqual({valid: false, error: 'invalid_format'})
        })

        test('returns error "invalid_format" for spaces in email', () => {
            expect(validateEmail('user name@example.com')).toEqual({
                valid: false,
                error: 'invalid_format'
            })
        })
    })
})
