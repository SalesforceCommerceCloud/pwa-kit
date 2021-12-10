/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Formats the given phone number to add spaces and symbols
 * @param {string} - Phone number to be formatted
 * @returns {string}  - Formatted phone number
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
 * Validates given Phone Number
 * @param {string} - Phone number to be validated
 * @returns {boolean}  - Result of Validation
 Allows most International 10 digit number with country code. Allowed delimiters:- spaces, dashes, or periods:
 Valid Examples:-
 +24-0455-9034
 +21.3789.4512
 +23 1256 4587
 */
export const validatePhone = (value) => {
    const regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
    return {
        isPhoneNumberValid: value && regex.test(value) ? true : false
    }
}
