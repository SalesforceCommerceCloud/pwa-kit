/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Checks whether a string is a valid email address.
 * Supports Unicode/international characters in the local part and domain.
 * @param {string} email - The email address to check
 * @returns {boolean} True if the email is valid
 */
export const isValidEmail = (email) => {
    const emailRegex =
        /^[\p{L}\p{N}._!#$%&'*+/=?^`{|}~-]+@(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+[\p{L}\p{N}][\p{L}\p{N}-]{0,61}[\p{L}\p{N}]$/u

    return emailRegex.test(email)
}

/**
 * Validates an email address, returning a structured result with an error code.
 * Uses isValidEmail internally.
 * @param {string} email - The email address to validate
 * @returns {{valid: boolean, error?: string}} Validation result ('required' | 'invalid_format')
 */
export const validateEmail = (email) => {
    if (!email || (typeof email === 'string' && email.trim() === '')) {
        return {valid: false, error: 'required'}
    }
    if (!isValidEmail(email)) {
        return {valid: false, error: 'invalid_format'}
    }
    return {valid: true}
}
