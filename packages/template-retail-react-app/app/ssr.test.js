/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {rest} from 'msw'
import * as jose from 'jose'

// Mock the runtime to prevent server startup during tests
jest.mock('@salesforce/pwa-kit-runtime/ssr/server/express', () => ({
    getRuntime: jest.fn(() => ({
        createHandler: jest.fn(() => {
            return {handler: jest.fn()}
        }),
        serveStaticFile: jest.fn(),
        serveServiceWorker: jest.fn(),
        render: jest.fn()
    }))
}))

// Mock other dependencies
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn(() => ({
        app: {
            login: {
                passwordless: {
                    callbackURI: '/passwordless-login-callback',
                    landingPath: '/passwordless-login'
                },
                resetPassword: {
                    callbackURI: '/reset-password-callback',
                    landingPath: '/reset-password'
                }
            },
            commerceAPI: {
                parameters: {
                    shortCode: 'test-shortcode',
                    organizationId: 'f_ecom_test_001'
                }
            }
        }
    }))
}))

jest.mock('@salesforce/pwa-kit-react-sdk/utils/url', () => ({
    getAppOrigin: jest.fn(() => 'https://test-app.com')
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/middleware', () => ({
    defaultPwaKitSecurityHeaders: jest.fn()
}))

jest.mock('helmet', () => jest.fn(() => jest.fn()))
jest.mock('express', () => {
    const mockExpress = jest.fn(() => ({
        use: jest.fn(),
        get: jest.fn(),
        post: jest.fn()
    }))
    mockExpress.json = jest.fn()
    mockExpress.urlencoded = jest.fn()
    return mockExpress
})

jest.mock('jose', () => ({
    createRemoteJWKSet: jest.fn(() => {
        return jest.fn().mockResolvedValue({
            keys: [
                {
                    kty: 'RSA',
                    use: 'sig',
                    kid: 'test-key-id',
                    n: 'test-modulus',
                    e: 'AQAB'
                }
            ]
        })
    }),
    jwtVerify: jest.fn().mockResolvedValue({
        payload: {
            iss: 'prefix/prefix2/test_001/oauth2',
            aud: 'test-audience',
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000)
        },
        protectedHeader: {
            alg: 'RS256',
            kid: 'test-key-id'
        }
    }),
    decodeJwt: jest.fn().mockReturnValue({
        iss: 'prefix/prefix2/test_001/oauth2',
        aud: 'test-audience',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
    })
}))

// Import only the functions we need to test
import {
    validateSlasCallbackToken,
    handleCallback
} from '@salesforce/retail-react-app/app/ssr.js'

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
    process.env = {
        ...originalEnv,
        MARKETING_CLOUD_CLIENT_ID: 'test-client-id',
        MARKETING_CLOUD_CLIENT_SECRET: 'test-client-secret',
        MARKETING_CLOUD_SUBDOMAIN: 'test-subdomain',
        MARKETING_CLOUD_PASSWORDLESS_LOGIN_TEMPLATE: 'passwordless-template',
        MARKETING_CLOUD_RESET_PASSWORD_TEMPLATE: 'reset-password-template'
    }
    jest.clearAllMocks()
})

afterEach(() => {
    process.env = originalEnv
})

describe('validateSlasCallbackToken', () => {
    test('should successfully validate a valid token', async () => {
        const testToken = 'valid-jwt-token'

        const result = await validateSlasCallbackToken(testToken)

        expect(result).toBeDefined()
        expect(result.iss).toBe('prefix/prefix2/test_001/oauth2')

        expect(jose.decodeJwt).toHaveBeenCalledWith(testToken)
        expect(jose.jwtVerify).toHaveBeenCalled()
    })

    test('should throw error for invalid token', async () => {
        const invalidToken = 'invalid-token'

        jose.jwtVerify.mockRejectedValueOnce(new Error('Invalid token signature'))

        await expect(validateSlasCallbackToken(invalidToken)).rejects.toThrow(
            'SLAS Token Validation Error: Invalid token signature'
        )
    })

    test('should throw error for mismatched tenant ID', async () => {
        const testToken = 'token-with-wrong-tenant'

        jose.decodeJwt.mockReturnValueOnce({
            iss: 'prefix/prefix2/wrong_tenant/oauth2'
        })

        await expect(validateSlasCallbackToken(testToken)).rejects.toThrow(
            'The tenant ID in your PWA Kit configuration ("test_001") does not match the tenant ID in the SLAS callback token ("wrong_tenant")'
        )
    })

    test('should handle token with malformed issuer claim', async () => {
        const testToken = 'token-with-malformed-issuer'

        jose.decodeJwt.mockReturnValueOnce({
            iss: 'malformed-issuer'
        })

        // This should attempt to extract tenantId from tokens[2] which would be undefined
        await expect(validateSlasCallbackToken(testToken)).rejects.toThrow()
    })

    test('should handle JWT verification failure', async () => {
        const testToken = 'jwt-verification-failure-token'

        jose.jwtVerify.mockRejectedValueOnce(new Error('JWT verification failed'))

        await expect(validateSlasCallbackToken(testToken)).rejects.toThrow(
            'SLAS Token Validation Error: JWT verification failed'
        )
    })

    test('should handle missing issuer claim', async () => {
        const testToken = 'token-without-issuer'

        jose.decodeJwt.mockReturnValueOnce({
            aud: 'test-audience',
            exp: Math.floor(Date.now() / 1000) + 3600
        })

        await expect(validateSlasCallbackToken(testToken)).rejects.toThrow()
    })
})

describe('handleCallback', () => {
    const makeRes = () => ({
        set: jest.fn(),
        send: jest.fn()
    })

    test('falls through to the renderer for a trusted-agent redirect (code and state present)', () => {
        const req = {query: {code: 'auth_code', state: 'state_abc'}}
        const res = makeRes()
        const next = jest.fn()

        handleCallback(req, res, next)

        // Must reach the React renderer so the callback page can post the result back.
        expect(next).toHaveBeenCalled()
        // OAuth material must never be cached.
        expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store')
        expect(res.send).not.toHaveBeenCalled()
    })

    test('short-circuits with a cached empty response when no code or state is present', () => {
        const req = {query: {}}
        const res = makeRes()
        const next = jest.fn()

        handleCallback(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.set).toHaveBeenCalledWith('Cache-Control', 'max-age=31536000')
        expect(res.send).toHaveBeenCalled()
    })

    test('does not fall through for a standard login redirect that has a code but no state', () => {
        const req = {query: {code: 'auth_code', usid: 'usid_123'}}
        const res = makeRes()
        const next = jest.fn()

        handleCallback(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.set).toHaveBeenCalledWith('Cache-Control', 'max-age=31536000')
        expect(res.send).toHaveBeenCalled()
    })
})

