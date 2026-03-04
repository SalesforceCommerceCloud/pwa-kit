/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Formats a phone number for display by adding parentheses and dashes (US-style).
 * This is purely cosmetic formatting and does NOT validate or normalize the number.
 * @param {string} value - Raw phone number string
 * @returns {string} Display-formatted phone number, e.g. "(727) 555-1234"
 */
export const formatPhoneNumber = (value) => {
    if (!value) return value
    const phoneNumber = value.replace(/[^\d]/g, '')
    const phoneNumberLength = phoneNumber.length
    if (phoneNumberLength < 4) return phoneNumber
    if (phoneNumberLength < 7) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
}

/**
 * Regular expression for E.164 international phone number validation.
 *
 * E.164 format requirements:
 * - Prefix: Must start with a + (optional in this regex for flexibility).
 * - Digits only: No spaces, dashes, or parentheses after the plus sign.
 * - Digits must start with the country code.
 * - Length: Minimum of 7 digits (practical minimum) and a strict maximum of 15 digits.
 * - No leading zero: The first digit after the + cannot be 0 because no country code starts with zero.
 */
export const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/

/**
 * Validates a phone number against E.164 format.
 * @param {string} phone - The phone number to validate
 * @returns {{valid: boolean, error?: string}} Validation result ('required' | 'invalid_format')
 */
export const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') {
        return {valid: false, error: 'required'}
    }
    if (!PHONE_REGEX.test(phone)) {
        return {valid: false, error: 'invalid_format'}
    }
    return {valid: true}
}
