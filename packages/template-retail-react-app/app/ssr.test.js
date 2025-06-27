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
import {validateSlasCallbackToken, emailLink} from '@salesforce/retail-react-app/app/ssr.js'

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

describe('emailLink function', () => {
    beforeEach(() => {
        // Set up MSW handlers for Marketing Cloud API
        global.server.use(
            rest.post(
                'https://test-subdomain.auth.marketingcloudapis.com/v2/token',
                (req, res, ctx) => {
                    return res(
                        ctx.delay(0),
                        ctx.status(200),
                        ctx.json({access_token: 'mc-access-token'})
                    )
                }
            ),
            rest.post(
                'https://test-subdomain.rest.marketingcloudapis.com/messaging/v1/email/messages/:messageId',
                (req, res, ctx) => {
                    return res(
                        ctx.delay(0),
                        ctx.status(200),
                        ctx.json({requestId: 'email-request-id', status: 'sent'})
                    )
                }
            )
        )
    })

    test('should send email via Marketing Cloud successfully', async () => {
        const result = await emailLink(
            'test@example.com',
            'test-template',
            'https://example.com/magic-link'
        )

        expect(result).toBeDefined()
        expect(result.requestId).toBe('email-request-id')
        expect(result.status).toBe('sent')
    })

    test('should handle Marketing Cloud token fetch failure', async () => {
        // Reset all handlers and only add the failing token endpoint
        global.server.resetHandlers(
            rest.post(
                'https://test-subdomain.auth.marketingcloudapis.com/v2/token',
                (req, res, ctx) => {
                    return res(ctx.delay(0), ctx.status(401), ctx.json({error: 'Unauthorized'}))
                }
            )
        )

        await expect(
            emailLink('test@example.com', 'test-template', 'https://example.com/magic-link')
        ).rejects.toThrow()
    }, 10000)

    test('should handle Marketing Cloud email send failure', async () => {
        global.server.use(
            rest.post(
                'https://test-subdomain.auth.marketingcloudapis.com/v2/token',
                (req, res, ctx) => {
                    return res(
                        ctx.delay(0),
                        ctx.status(200),
                        ctx.json({access_token: 'mc-access-token'})
                    )
                }
            ),
            rest.post(
                'https://test-subdomain.rest.marketingcloudapis.com/messaging/v1/email/messages/:messageId',
                (req, res, ctx) => {
                    return res(ctx.delay(0), ctx.status(400), ctx.json({error: 'Bad Request'}))
                }
            )
        )

        await expect(
            emailLink('test@example.com', 'test-template', 'https://example.com/magic-link')
        ).rejects.toThrow('Failed to send email to Marketing Cloud')
    })

    test('should warn when Marketing Cloud environment variables are missing', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

        // Store current env vars
        const originalClientId = process.env.MARKETING_CLOUD_CLIENT_ID
        const originalClientSecret = process.env.MARKETING_CLOUD_CLIENT_SECRET
        const originalSubdomain = process.env.MARKETING_CLOUD_SUBDOMAIN

        // Temporarily remove env vars
        delete process.env.MARKETING_CLOUD_CLIENT_ID
        delete process.env.MARKETING_CLOUD_CLIENT_SECRET
        delete process.env.MARKETING_CLOUD_SUBDOMAIN

        // Call the function to trigger the warnings (but don't await it)
        emailLink('test@example.com', 'test-template', 'https://example.com/magic-link').catch(
            () => {}
        )

        expect(consoleSpy).toHaveBeenCalledWith(
            'MARKETING_CLOUD_CLIENT_ID is not set in the environment variables.'
        )
        expect(consoleSpy).toHaveBeenCalledWith(
            ' MARKETING_CLOUD_CLIENT_SECRET is not set in the environment variables.'
        )
        expect(consoleSpy).toHaveBeenCalledWith(
            'MARKETING_CLOUD_SUBDOMAIN is not set in the environment variables.'
        )

        // Restore env vars
        if (originalClientId) process.env.MARKETING_CLOUD_CLIENT_ID = originalClientId
        if (originalClientSecret) process.env.MARKETING_CLOUD_CLIENT_SECRET = originalClientSecret
        if (originalSubdomain) process.env.MARKETING_CLOUD_SUBDOMAIN = originalSubdomain

        consoleSpy.mockRestore()
    })
})
