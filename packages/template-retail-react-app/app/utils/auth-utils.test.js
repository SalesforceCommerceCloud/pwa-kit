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
    getResetPasswordActionErrorMessage,
    readErrorResponseMessage,
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

const mockResponseError = ({status, body, jsonThrows = false}) => {
    const error = new Error('request failed')
    error.response = {
        status,
        json: jsonThrows
            ? jest.fn().mockRejectedValue(new SyntaxError('Unexpected end of JSON input'))
            : jest.fn().mockResolvedValue(body)
    }
    return error
}

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
        ['login_id does not match stored login_id', INVALID_TOKEN_ERROR_MESSAGE],
        ['login_id is required', INVALID_TOKEN_ERROR_MESSAGE],
        [
            'login id is required for Passwordless Login authentication',
            INVALID_TOKEN_ERROR_MESSAGE
        ],
        [
            'Too many login requests were made. Please try again later.',
            TOO_MANY_LOGIN_ATTEMPTS_ERROR_MESSAGE
        ],
        ['unexpected error message', API_ERROR_MESSAGE],
        [null, API_ERROR_MESSAGE]
    ])(
        'maps login passwordless error "%s" to the correct message descriptor',
        (errorMessage, expectedMessage) => {
            expect(getLoginPasswordlessErrorMessage(errorMessage)).toBe(expectedMessage)
        }
    )
})

describe('getResetPasswordActionErrorMessage', () => {
    test.each([
        ['invalid token', INVALID_TOKEN_ERROR_MESSAGE],
        [
            'Too many password reset requests were made. Please try again later.',
            INVALID_TOKEN_ERROR_MESSAGE
        ],
        ['login_id does not match stored login_id', INVALID_TOKEN_ERROR_MESSAGE],
        ['login_id is required', INVALID_TOKEN_ERROR_MESSAGE],
        ['unexpected error message', API_ERROR_MESSAGE],
        [null, API_ERROR_MESSAGE]
    ])(
        'maps reset password action error "%s" to the correct message descriptor',
        (errorMessage, expectedMessage) => {
            expect(getResetPasswordActionErrorMessage(errorMessage)).toBe(expectedMessage)
        }
    )
})

describe('readErrorResponseMessage', () => {
    test('reads message from JSON body', async () => {
        const error = mockResponseError({
            status: 400,
            body: {message: 'invalid token'}
        })
        await expect(readErrorResponseMessage(error)).resolves.toBe('invalid token')
    })

    test('falls back to error.message when JSON parse fails', async () => {
        const error = mockResponseError({status: 500, body: null, jsonThrows: true})
        error.message = 'request failed'
        await expect(readErrorResponseMessage(error)).resolves.toBe('request failed')
    })

    test('falls back to error.message when response.json is missing', async () => {
        const error = new Error('network error')
        await expect(readErrorResponseMessage(error)).resolves.toBe('network error')
    })
})
