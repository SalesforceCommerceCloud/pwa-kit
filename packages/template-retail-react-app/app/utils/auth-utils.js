/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {defineMessage} from 'react-intl'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {getEnvBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import {
    API_ERROR_MESSAGE,
    FEATURE_UNAVAILABLE_ERROR_MESSAGE,
    INVALID_TOKEN_ERROR,
    INVALID_TOKEN_ERROR_MESSAGE
} from '@salesforce/retail-react-app/app/constants'
import {isAbsoluteURL} from '@salesforce/retail-react-app/app/page-designer/utils'

export const TOO_MANY_LOGIN_ATTEMPTS_ERROR_MESSAGE = defineMessage({
    defaultMessage:
        'You reached the limit for login attempts. For your security, wait 10 minutes and try again.',
    id: 'global.error.too_many_login_attempts'
})

export const TOO_MANY_PASSWORD_RESET_ATTEMPTS_ERROR_MESSAGE = defineMessage({
    defaultMessage:
        'You reached the limit for password resets. For your security, wait 10 minutes and try again.',
    id: 'global.error.too_many_password_reset_requests'
})

// Shared error patterns for token-based auth features (passwordless login, password reset)
const TOKEN_BASED_AUTH_FEATURE_UNAVAILABLE_ERRORS = [
    /no callback_uri is registered/i,
    /callback_uri doesn't match/i,
    /monthly quota/i
]

const PASSWORDLESS_FEATURE_UNAVAILABLE_ERRORS = [
    ...TOKEN_BASED_AUTH_FEATURE_UNAVAILABLE_ERRORS,
    /passwordless permissions error/i,
    /client secret is not provided/i
]

const PASSWORD_RESET_FEATURE_UNAVAILABLE_ERRORS = TOKEN_BASED_AUTH_FEATURE_UNAVAILABLE_ERRORS

const TOO_MANY_REQUESTS_ERROR = /too many .* requests/i

/**
 * Returns the absolute URL for the passwordless login callback.
 * If the callback URI is already absolute, it is returned as-is; otherwise it is
 * resolved against the app origin and env base path.
 *
 * @param {string} [callbackURI] - The callback URI from config (relative or absolute)
 * @returns {string|undefined} - The full callback URL, or undefined if callbackURI is falsy
 */
export const getPasswordlessCallbackUrl = (callbackURI) => {
    if (!callbackURI) {
        return undefined
    }
    if (isAbsoluteURL(callbackURI)) {
        return callbackURI
    }
    return `${getAppOrigin()}${getEnvBasePath()}${callbackURI}`
}

/**
 * Maps error message from authorizePasswordless mutation to the appropriate user-friendly error message descriptor
 * for passwordless login feature errors.
 *
 * @param {string} errorMessage - The error message from the API
 * @returns {Object} - The message descriptor object (from defineMessage) that can be passed to formatMessage
 */
export const getAuthorizePasswordlessErrorMessage = (errorMessage) => {
    if (PASSWORDLESS_FEATURE_UNAVAILABLE_ERRORS.some((msg) => msg.test(errorMessage))) {
        return FEATURE_UNAVAILABLE_ERROR_MESSAGE
    }
    if (TOO_MANY_REQUESTS_ERROR.test(errorMessage)) {
        return TOO_MANY_LOGIN_ATTEMPTS_ERROR_MESSAGE
    }
    return API_ERROR_MESSAGE
}

/**
 * Maps error message from getPasswordResetToken mutation to the appropriate user-friendly error message descriptor
 * for password reset feature errors.
 *
 * @param {string} errorMessage - The error message from the API
 * @returns {Object} - The message descriptor object (from defineMessage) that can be passed to formatMessage
 */
export const getPasswordResetErrorMessage = (errorMessage) => {
    if (PASSWORD_RESET_FEATURE_UNAVAILABLE_ERRORS.some((msg) => msg.test(errorMessage))) {
        return FEATURE_UNAVAILABLE_ERROR_MESSAGE
    }
    if (TOO_MANY_REQUESTS_ERROR.test(errorMessage)) {
        return TOO_MANY_PASSWORD_RESET_ATTEMPTS_ERROR_MESSAGE
    }
    return API_ERROR_MESSAGE
}

/**
 * Maps error message from loginPasswordless mutation to the appropriate user-friendly error message descriptor
 * for OTP verification errors (passwordless login token verification).
 *
 * @param {string} errorMessage - The error message from the API
 * @returns {Object} - The message descriptor object (from defineMessage) that can be passed to formatMessage
 */
export const getLoginPasswordlessErrorMessage = (errorMessage) => {
    if (INVALID_TOKEN_ERROR.test(errorMessage)) {
        return INVALID_TOKEN_ERROR_MESSAGE
    }
    return API_ERROR_MESSAGE
}
