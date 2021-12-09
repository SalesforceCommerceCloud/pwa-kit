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
Allows valid international prefixes, followed by 9 or 10 digits, with any type or placing of delimeters (except between the last two digits)
Examples:-
+1-234-567-8901
+61-234-567-89-01
+46-234 5678901
+1 (234) 56 89 901
+1 (234) 56-89 901
+46.234.567.8901
+1/234/567/8901
 */
export const validatePhone = (value) => {
    const regex = /\+(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\W*\d\W*\d\W*\d\W*\d\W*\d\W*\d\W*\d\W*\d\W*(\d{1,2})$/
    return {
        isPhoneNumberValid: value && regex.test(value) ? true : false
    }
}
