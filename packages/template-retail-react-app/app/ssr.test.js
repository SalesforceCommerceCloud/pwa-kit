/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

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
                },
                registrationVerification: {
                    callbackURI: '/registration-verification-callback'
                }
            },
            commerceAPI: {
                proxyPath: '/mobify/proxy/api',
                parameters: {
                    clientId: 'test-client-id',
                    shortCode: 'test-shortcode',
                    organizationId: 'f_ecom_test_001',
                    siteId: 'RefArch'
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

jest.mock('commerce-sdk-isomorphic', () => {
    const mockShopperLogin = jest.fn()
    const mockHelpers = {
        loginGuestUser: jest.fn(),
        loginGuestUserPrivate: jest.fn()
    }
    return {ShopperLogin: mockShopperLogin, helpers: mockHelpers}
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
    handleCallback,
    getNotifyToken,
    sendViaB2cCartridge,
    _resetNotifyTokenCacheForTest,
    extractLocaleFromUrl
} from '@salesforce/retail-react-app/app/ssr.js'
import {helpers} from 'commerce-sdk-isomorphic'

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

const TEST_API_PARAMS = {
    clientId: 'test-client-id',
    organizationId: 'f_ecom_test_001',
    shortCode: 'test-shortcode',
    siteId: 'RefArch'
}

describe('getNotifyToken', () => {
    beforeEach(() => {
        _resetNotifyTokenCacheForTest()
        delete process.env.PWA_KIT_SLAS_CLIENT_SECRET
    })

    test('fetches a new token via public client (no secret)', async () => {
        helpers.loginGuestUser.mockResolvedValueOnce({access_token: 'guest-token-abc'})

        const token = await getNotifyToken(TEST_API_PARAMS)

        expect(token).toBe('guest-token-abc')
        expect(helpers.loginGuestUser).toHaveBeenCalledTimes(1)
        expect(helpers.loginGuestUserPrivate).not.toHaveBeenCalled()
    })

    test('fetches a new token via private client when secret is set', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'super-secret'
        helpers.loginGuestUserPrivate.mockResolvedValueOnce({access_token: 'private-token-xyz'})

        const token = await getNotifyToken(TEST_API_PARAMS)

        expect(token).toBe('private-token-xyz')
        expect(helpers.loginGuestUserPrivate).toHaveBeenCalledTimes(1)
        expect(helpers.loginGuestUser).not.toHaveBeenCalled()
    })

    test('returns cached token without making a new SLAS call', async () => {
        helpers.loginGuestUser.mockResolvedValue({access_token: 'cached-token'})

        const first = await getNotifyToken(TEST_API_PARAMS)
        const second = await getNotifyToken(TEST_API_PARAMS)

        expect(first).toBe('cached-token')
        expect(second).toBe('cached-token')
        expect(helpers.loginGuestUser).toHaveBeenCalledTimes(1)
    })
})

describe('sendViaB2cCartridge', () => {
    let fetchSpy

    beforeEach(() => {
        _resetNotifyTokenCacheForTest()
        delete process.env.PWA_KIT_SLAS_CLIENT_SECRET
        helpers.loginGuestUser.mockResolvedValue({access_token: 'notify-token'})
        fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: jest.fn().mockResolvedValue({success: true}),
                text: jest.fn().mockResolvedValue('')
            })
        )
    })

    afterEach(() => {
        fetchSpy.mockRestore()
    })

    const mockFetchOk = (body = {success: true}) => {
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue(body),
            text: jest.fn().mockResolvedValue(JSON.stringify(body))
        })
    }

    const mockFetchError = (status, body = '') => {
        fetchSpy.mockResolvedValueOnce({
            ok: false,
            status,
            text: jest.fn().mockResolvedValue(body)
        })
    }

    test('sends passwordless-magic-link with correct payload', async () => {
        mockFetchOk({success: true, data: {magicLink: 'https://example.com/magic'}})

        const result = await sendViaB2cCartridge(
            'passwordless-magic-link',
            'user@example.com',
            {magicLinkPath: '/en-US/passwordless?token=abc'},
            TEST_API_PARAMS
        )

        expect(result).toEqual({success: true, data: {magicLink: 'https://example.com/magic'}})
        const [url, opts] = fetchSpy.mock.calls[0]
        expect(url).toContain('/f_ecom_test_001/notify')
        const sentBody = JSON.parse(opts.body)
        expect(sentBody.type).toBe('passwordless-magic-link')
        expect(sentBody.recipient).toBe('user@example.com')
        expect(sentBody.data.magicLinkPath).toBe('/en-US/passwordless?token=abc')
        expect(opts.headers['Authorization']).toBe('Bearer notify-token')
    })

    test('sends password-reset with correct payload', async () => {
        mockFetchOk()

        await sendViaB2cCartridge(
            'password-reset',
            'user@example.com',
            {magicLinkPath: '/en-US/reset-password?token=xyz'},
            TEST_API_PARAMS
        )

        const sentBody = JSON.parse(fetchSpy.mock.calls[0][1].body)
        expect(sentBody.type).toBe('password-reset')
    })

    test('sends otp with correct payload', async () => {
        mockFetchOk()

        await sendViaB2cCartridge('otp', 'user@example.com', {token: '123456'}, TEST_API_PARAMS)

        const sentBody = JSON.parse(fetchSpy.mock.calls[0][1].body)
        expect(sentBody.type).toBe('otp')
        expect(sentBody.data.token).toBe('123456')
    })

    test('sends glo-access-code with correct payload', async () => {
        mockFetchOk()

        await sendViaB2cCartridge(
            'glo-access-code',
            'user@example.com',
            {orderNo: 'ORDER123', accessCode: 'ABCD1234'},
            TEST_API_PARAMS
        )

        const sentBody = JSON.parse(fetchSpy.mock.calls[0][1].body)
        expect(sentBody.type).toBe('glo-access-code')
        expect(sentBody.data.orderNo).toBe('ORDER123')
        expect(sentBody.data.accessCode).toBe('ABCD1234')
    })

    test('retries with a fresh token on 401 and succeeds', async () => {
        helpers.loginGuestUser
            .mockResolvedValueOnce({access_token: 'stale-token'})
            .mockResolvedValueOnce({access_token: 'fresh-token'})
        // First fetch: 401 with stale token; second fetch: 200 with fresh token
        fetchSpy
            .mockResolvedValueOnce({ok: false, status: 401, text: jest.fn().mockResolvedValue('')})
            .mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({success: true}),
                text: jest.fn().mockResolvedValue('')
            })

        const result = await sendViaB2cCartridge(
            'otp',
            'user@example.com',
            {token: '654321'},
            TEST_API_PARAMS
        )

        expect(result).toEqual({success: true})
        expect(fetchSpy).toHaveBeenCalledTimes(2)
        const [, retryOpts] = fetchSpy.mock.calls[1]
        expect(retryOpts.headers['Authorization']).toBe('Bearer fresh-token')
    })

    test('throws on 5xx without clearing token cache', async () => {
        mockFetchError(503, 'Service Unavailable')

        await expect(
            sendViaB2cCartridge('otp', 'user@example.com', {token: '999'}, TEST_API_PARAMS)
        ).rejects.toThrow('pwakit-notify returned 503')

        // Token should still be cached (503 is not 401)
        helpers.loginGuestUser.mockClear()
        mockFetchOk()
        await sendViaB2cCartridge('otp', 'user@example.com', {token: '111'}, TEST_API_PARAMS)
        expect(helpers.loginGuestUser).not.toHaveBeenCalled()
    })

    test('appends locale to URL when provided in apiParams', async () => {
        mockFetchOk()

        await sendViaB2cCartridge(
            'otp',
            'user@example.com',
            {token: '123'},
            {
                ...TEST_API_PARAMS,
                locale: 'fr-FR'
            }
        )

        const [url] = fetchSpy.mock.calls[0]
        expect(url).toContain('&locale=fr-FR')
    })

    test('omits locale from URL when not provided', async () => {
        mockFetchOk()

        await sendViaB2cCartridge('otp', 'user@example.com', {token: '123'}, TEST_API_PARAMS)

        const [url] = fetchSpy.mock.calls[0]
        expect(url).not.toContain('locale')
    })
})

describe('extractLocaleFromUrl', () => {
    test('extracts locale from absolute URL', () => {
        expect(extractLocaleFromUrl('https://mystore.com/en-US/account')).toBe('en-US')
    })

    test('extracts locale from relative path', () => {
        expect(extractLocaleFromUrl('/fr-FR/login')).toBe('fr-FR')
    })

    test('extracts locale from root locale path', () => {
        expect(extractLocaleFromUrl('/en-US')).toBe('en-US')
    })

    test('returns null for path without locale', () => {
        expect(extractLocaleFromUrl('/account')).toBeNull()
    })

    test('returns null for null input', () => {
        expect(extractLocaleFromUrl(null)).toBeNull()
    })

    test('returns null for empty string', () => {
        expect(extractLocaleFromUrl('')).toBeNull()
    })
})
