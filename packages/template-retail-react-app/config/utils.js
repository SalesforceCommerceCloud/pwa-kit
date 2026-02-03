/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Valid OTP token lengths supported by the authentication system.
 * These values are enforced to ensure compatibility with the OTP verification flow.
 */
const VALID_OTP_TOKEN_LENGTHS = [6, 8]
const DEFAULT_OTP_TOKEN_LENGTH = 8

/**
 * Validates and normalizes the OTP token length configuration.
 * Throws an error if the token length is invalid.
 *
 * @param {string|number|undefined} tokenLength - The token length from config or env var
 * @returns {number} Validated token length (6 or 8)
 * @throws {Error} If tokenLength is invalid (not 6 or 8)
 */
function validateOtpTokenLength(tokenLength) {
    // If undefined, return default
    if (tokenLength === undefined) {
        return DEFAULT_OTP_TOKEN_LENGTH
    }

    // Parse to number (handles string numbers like "6" or "8")
    const parsedLength = Number(tokenLength)

    // Check if it's one of the allowed values (includes() will return false for NaN or invalid numbers)
    if (!VALID_OTP_TOKEN_LENGTHS.includes(parsedLength)) {
        throw new Error(
            `Invalid OTP token length: ${tokenLength}. Valid values are ${VALID_OTP_TOKEN_LENGTHS.join(
                ' or '
            )}. `
        )
    }

    return parsedLength
}

/**
 * Safely parses settings from either a JSON string or object
 * @param {string|object} settings - The settings
 * @returns {object} Parsed settings object
 */
function parseSettings(settings) {
    // If settings is already an object, return it
    if (typeof settings === 'object' && settings !== null) {
        return settings
    }

    // If settings is a string, try to parse it
    if (typeof settings === 'string') {
        try {
            return JSON.parse(settings)
        } catch (error) {
            console.warn('Invalid json format:', error.message)
            return
        }
    }

    return
}

module.exports = {
    parseSettings,
    validateOtpTokenLength,
    DEFAULT_OTP_TOKEN_LENGTH,
    VALID_OTP_TOKEN_LENGTHS
}
