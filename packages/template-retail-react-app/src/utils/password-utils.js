/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Provides mapping of password requirements that have/haven't been met
 * @param {string} value - The password to validate
 * @returns {Object} - True/false for each password validation rule
 */
export const validatePassword = (value) => {
    return {
        hasMinChars: value && value.length >= 8 ? true : false,
        hasUppercase: value && /[A-Z]/.test(value) ? true : false,
        hasLowercase: value && /[a-z]/.test(value) ? true : false,
        hasNumber: value && /\d/.test(value) ? true : false,
        hasSpecialChar: value && /[!@#$%^&*(),.?":{}|<>]/.test(value) ? true : false
    }
}
