/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Regular expression for email validation
 * Validates standard email format with domain and TLD
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/

/**
 * Regular expression for phone number validation (E.164 format)
 * Supports international phone numbers with optional + prefix
 * Example: +15551234567
 */
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/

/**
 * Validation result type
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the value is valid
 * @property {string} [error] - Error code if validation failed ('required' | 'invalid_format')
 */

/**
 * Validates an email address
 * @param {string} email - The email address to validate
 * @returns {ValidationResult} Validation result with error code if invalid
 */
export const validateEmail = (email) => {
    if (!email || email.trim() === '') {
        return {valid: false, error: 'required'}
    }
    if (!EMAIL_REGEX.test(email)) {
        return {valid: false, error: 'invalid_format'}
    }
    return {valid: true}
}

/**
 * Validates a phone number (E.164 international format)
 * @param {string} phone - The phone number to validate
 * @returns {ValidationResult} Validation result with error code if invalid
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

/**
 * Generic validator factory for custom validation logic
 * @param {RegExp} regex - Regular expression for format validation
 * @returns {Function} Validator function that returns ValidationResult
 */
export const createValidator = (regex) => {
    return (value) => {
        if (!value || value.trim() === '') {
            return {valid: false, error: 'required'}
        }
        if (!regex.test(value)) {
            return {valid: false, error: 'invalid_format'}
        }
        return {valid: true}
    }
}
