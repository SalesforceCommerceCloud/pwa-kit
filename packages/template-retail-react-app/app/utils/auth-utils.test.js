/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    API_ERROR_MESSAGE,
    FEATURE_UNAVAILABLE_ERROR_MESSAGE,
    INVALID_TOKEN_ERROR_MESSAGE
} from '@salesforce/retail-react-app/app/constants'
import {
    getPasswordlessCallbackUrl,
    getAuthorizePasswordlessErrorMessage,
    getPasswordResetErrorMessage,
    getLoginPasswordlessErrorMessage,
    TOO_MANY_LOGIN_ATTEMPTS_ERROR_MESSAGE,
    TOO_MANY_PASSWORD_RESET_ATTEMPTS_ERROR_MESSAGE
} from '@salesforce/retail-react-app/app/utils/auth-utils'

afterEach(() => {
    jest.clearAllMocks()
})

jest.mock('@salesforce/pwa-kit-react-sdk/utils/url', () => {
    const original = jest.requireActual('@salesforce/pwa-kit-react-sdk/utils/url')
    return {
        ...original,
        getAppOrigin: jest.fn(() => 'https://www.example.com')
    }
})
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths', () => {
    const original = jest.requireActual('@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths')
    return {
        ...original,
        getEnvBasePath: jest.fn(() => '/test')
    }
})

describe('getPasswordlessCallbackUrl', function () {
    test.each([undefined, null, ''])('return undefined when callbackURI is %s', (callbackURI) => {
        expect(getPasswordlessCallbackUrl(callbackURI)).toBeUndefined()
    })

    test('return callbackURI as-is when it is an absolute URL', () => {
        const absoluteUrl = 'https://callback.example.com/passwordless'
        expect(getPasswordlessCallbackUrl(absoluteUrl)).toBe(absoluteUrl)
    })

    test('return full URL with origin and base path when callbackURI is relative', () => {
        expect(getPasswordlessCallbackUrl('/passwordless-login-callback')).toBe(
            'https://www.example.com/test/passwordless-login-callback'
        )
    })
})

describe('getAuthorizePasswordlessErrorMessage', () => {
    test.each([
        ['no callback_uri is registered for client', FEATURE_UNAVAILABLE_ERROR_MESSAGE],
        ["callback_uri doesn't match the registered callbacks", FEATURE_UNAVAILABLE_ERROR_MESSAGE],
        [
            'Monthly quota for passwordless login mode email has been exceeded',
            FEATURE_UNAVAILABLE_ERROR_MESSAGE
        ],
        [
            'PasswordLess Permissions Error for clientId:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            FEATURE_UNAVAILABLE_ERROR_MESSAGE
        ],
        ['client secret is not provided', FEATURE_UNAVAILABLE_ERROR_MESSAGE],
        [
            'Too many login requests were made. Please try again later.',
            TOO_MANY_LOGIN_ATTEMPTS_ERROR_MESSAGE
        ],
        ['unexpected error message', API_ERROR_MESSAGE],
        [null, API_ERROR_MESSAGE]
    ])(
        'maps passwordless error "%s" to the correct message descriptor',
        (errorMessage, expectedMessage) => {
            expect(getAuthorizePasswordlessErrorMessage(errorMessage)).toBe(expectedMessage)
        }
    )
})

describe('getPasswordResetErrorMessage', () => {
    test.each([
        ['no callback_uri is registered for client', FEATURE_UNAVAILABLE_ERROR_MESSAGE],
        ["callback_uri doesn't match the registered callbacks", FEATURE_UNAVAILABLE_ERROR_MESSAGE],
        [
            'Monthly quota for passwordless login mode email has been exceeded',
            FEATURE_UNAVAILABLE_ERROR_MESSAGE
        ],
        [
            'Too many password reset requests were made. Please try again later.',
            TOO_MANY_PASSWORD_RESET_ATTEMPTS_ERROR_MESSAGE
        ],
        ['unexpected error message', API_ERROR_MESSAGE],
        [null, API_ERROR_MESSAGE]
    ])(
        'maps password reset error "%s" to the correct message descriptor',
        (errorMessage, expectedMessage) => {
            expect(getPasswordResetErrorMessage(errorMessage)).toBe(expectedMessage)
        }
    )
})

describe('getLoginPasswordlessErrorMessage', () => {
    test.each([
        ['invalid token', INVALID_TOKEN_ERROR_MESSAGE],
        ['unexpected error message', API_ERROR_MESSAGE],
        [null, API_ERROR_MESSAGE]
    ])(
        'maps login passwordless error "%s" to the correct message descriptor',
        (errorMessage, expectedMessage) => {
            expect(getLoginPasswordlessErrorMessage(errorMessage)).toBe(expectedMessage)
        }
    )
})
