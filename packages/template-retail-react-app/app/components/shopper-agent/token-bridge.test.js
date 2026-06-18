/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    callTokenBridge,
    handleTokenBridge,
    registerTokenBridgeRoute,
    resolveAncMyDomain,
    TOKEN_BRIDGE_PROXY_PATH
} from '@salesforce/retail-react-app/app/components/shopper-agent/token-bridge'

// Mock the httponly-cookie-config helpers
jest.mock('@salesforce/pwa-kit-runtime/ssr/server/httponly-cookie-config', () => ({
    getSiteId: (req) => req.headers?.['x-site-id'],
    getCookieName: (config, siteId) => `${config.key}_${siteId}`,
    SESSION_COOKIE_CONFIG: {
        accessToken: {key: 'cc-at'},
        refreshTokenRegistered: {key: 'cc-nx'},
        refreshTokenGuest: {key: 'cc-nx-g'}
    }
}))

const ORIGINAL_FETCH = global.fetch
const ORIGINAL_ANC_MYDOMAIN = process.env.ANC_MYDOMAIN
const ORIGINAL_HTTPONLY = process.env.MRT_ENABLE_HTTPONLY_SESSION_COOKIES

const buildRes = () => {
    const res = {
        statusCode: 200,
        body: undefined,
        status(code) {
            this.statusCode = code
            return this
        },
        json(payload) {
            this.body = payload
            return this
        }
    }
    return res
}

const buildReq = (body = {}, cookies = '', siteId = 'RefArch') => ({
    body,
    headers: {
        cookie: cookies,
        'x-site-id': siteId
    }
})

beforeEach(() => {
    global.fetch = jest.fn()
    delete process.env.MRT_ENABLE_HTTPONLY_SESSION_COOKIES
})

afterEach(() => {
    global.fetch = ORIGINAL_FETCH
    if (ORIGINAL_ANC_MYDOMAIN === undefined) {
        delete process.env.ANC_MYDOMAIN
    } else {
        process.env.ANC_MYDOMAIN = ORIGINAL_ANC_MYDOMAIN
    }
    if (ORIGINAL_HTTPONLY === undefined) {
        delete process.env.MRT_ENABLE_HTTPONLY_SESSION_COOKIES
    } else {
        process.env.MRT_ENABLE_HTTPONLY_SESSION_COOKIES = ORIGINAL_HTTPONLY
    }
    jest.restoreAllMocks()
})

describe('resolveAncMyDomain', () => {
    test('returns null when myDomain is undefined', () => {
        expect(resolveAncMyDomain()).toBeNull()
    })

    test('returns null when myDomain is null', () => {
        expect(resolveAncMyDomain(null)).toBeNull()
    })

    test('returns null when myDomain is not a string', () => {
        expect(resolveAncMyDomain(123)).toBeNull()
    })

    test('returns null when myDomain is empty after trim', () => {
        expect(resolveAncMyDomain('   ')).toBeNull()
    })

    test('prepends https:// when scheme is missing', () => {
        expect(resolveAncMyDomain('orgfarm-1234.test1.my.pc-rnd.salesforce.com')).toBe(
            'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        )
    })

    test('preserves https:// when already present', () => {
        expect(resolveAncMyDomain('https://orgfarm-1234.test1.my.pc-rnd.salesforce.com')).toBe(
            'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        )
    })

    test('preserves http:// when already present (for local testing)', () => {
        expect(resolveAncMyDomain('http://localhost:8080')).toBe('http://localhost:8080')
    })

    test('strips trailing slashes', () => {
        expect(resolveAncMyDomain('https://orgfarm-1234.test1.my.pc-rnd.salesforce.com///')).toBe(
            'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        )
    })
})

describe('handleTokenBridge - Non-HttpOnly Mode', () => {
    test('returns 400 MISSING_AUTH_LINK_KEY when auth_link_key is missing', async () => {
        const req = buildReq({
            slas_access_token: 'a'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({error: 'MISSING_AUTH_LINK_KEY'})
        expect(global.fetch).not.toHaveBeenCalled()
    })

    test('returns 400 MISSING_AUTH_LINK_KEY when auth_link_key is not a string', async () => {
        const req = buildReq({
            auth_link_key: 123,
            slas_access_token: 'a'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({error: 'MISSING_AUTH_LINK_KEY'})
    })

    test('returns 403 FORBIDDEN_ORIGIN when Origin is untrusted', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a'
        })
        req.headers.origin = 'https://attacker.com'
        req.headers.host = 'mystore.com'
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(403)
        expect(res.body).toEqual({error: 'FORBIDDEN_ORIGIN'})
        expect(global.fetch).not.toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    test('returns 400 INVALID_ORIGIN when Origin header is malformed', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a'
        })
        req.headers.origin = 'not-a-valid-url'
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({error: 'INVALID_ORIGIN'})
        expect(global.fetch).not.toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    test('allows same-origin requests', async () => {
        process.env.ANC_MYDOMAIN = 'https://test.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a'
        })
        req.headers.origin = 'https://mystore.com'
        req.headers.host = 'mystore.com'
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(200)
        expect(global.fetch).toHaveBeenCalled()
    })

    test('allows trusted Salesforce Origin (Storefront Preview)', async () => {
        process.env.ANC_MYDOMAIN = 'https://test.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a'
        })
        req.headers.origin = 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        req.headers.host = 'mystore.com'
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(200)
        expect(global.fetch).toHaveBeenCalled()
    })

    test('allows requests with no Origin header (some browsers/tools)', async () => {
        process.env.ANC_MYDOMAIN = 'https://test.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a'
        })
        // No origin header set
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(200)
        expect(global.fetch).toHaveBeenCalled()
    })

    test('returns 401 INVALID_SLAS_TOKEN when slas_access_token is missing (non-HttpOnly)', async () => {
        const req = buildReq({
            auth_link_key: 'k'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(401)
        expect(res.body).toEqual({error: 'INVALID_SLAS_TOKEN'})
        expect(global.fetch).not.toHaveBeenCalled()
    })

    test('returns 500 MYDOMAIN_NOT_CONFIGURED when ANC_MYDOMAIN is not set', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        delete process.env.ANC_MYDOMAIN
        const req = buildReq({auth_link_key: 'k', slas_access_token: 'a'})
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(500)
        expect(res.body).toEqual({error: 'MYDOMAIN_NOT_CONFIGURED'})
        expect(errorSpy).toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    test('returns 500 MYDOMAIN_NOT_CONFIGURED when ANC_MYDOMAIN is empty', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = '   '
        const req = buildReq({auth_link_key: 'k', slas_access_token: 'a'})
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(500)
        expect(res.body).toEqual({error: 'MYDOMAIN_NOT_CONFIGURED'})
        expect(errorSpy).toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    test('returns 400 UNTRUSTED_MYDOMAIN when host is not Salesforce domain', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://attacker.com'
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({error: 'UNTRUSTED_MYDOMAIN'})
        expect(global.fetch).not.toHaveBeenCalled()
        errorSpy.mockRestore()
        logSpy.mockRestore()
    })

    test('returns 400 UNTRUSTED_MYDOMAIN for AWS IMDS', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'http://169.254.169.254'
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({error: 'UNTRUSTED_MYDOMAIN'})
        expect(global.fetch).not.toHaveBeenCalled()
        errorSpy.mockRestore()
        logSpy.mockRestore()
    })

    test('accepts valid .salesforce.com domain', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://test.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(200)
        expect(global.fetch).toHaveBeenCalled()
        logSpy.mockRestore()
    })

    test('accepts valid .my.salesforce.com domain', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://org.my.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(200)
        expect(global.fetch).toHaveBeenCalled()
        logSpy.mockRestore()
    })

    test('accepts valid .pc-rnd.salesforce.com domain', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://orgfarm-1234.test1.pc-rnd.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(200)
        expect(global.fetch).toHaveBeenCalled()
        logSpy.mockRestore()
    })

    test('forwards to Core with refresh_token from cookie when provided', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token'
            },
            'cc-nx_RefArch=refresh-token'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(global.fetch).toHaveBeenCalledTimes(1)
        const [url, init] = global.fetch.mock.calls[0]
        expect(url).toBe(
            'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com/agent/identity/bridge'
        )
        expect(init.method).toBe('POST')
        expect(init.headers).toEqual({
            'Content-Type': 'application/json',
            Authorization: 'SLAS access-token'
        })
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            refresh_token: 'refresh-token'
        })
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({result: 'ok'})
        logSpy.mockRestore()
    })

    test('forwards to Core without refresh_token when cookie not present and logs debug', async () => {
        const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq({
            auth_link_key: 'auth-key',
            slas_access_token: 'access-token'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(global.fetch).toHaveBeenCalledTimes(1)
        const init = global.fetch.mock.calls[0][1]
        expect(JSON.parse(init.body)).toEqual({auth_link_key: 'auth-key'})
        expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('No SLAS refresh token'))
        debugSpy.mockRestore()
        logSpy.mockRestore()
    })

    test('forwards Core status and body verbatim on non-200 responses', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 401,
            json: jest.fn().mockResolvedValue({error: 'INVALID_SLAS_TOKEN'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token'
            },
            'cc-nx_RefArch=refresh-token'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(401)
        expect(res.body).toEqual({error: 'INVALID_SLAS_TOKEN'})
        logSpy.mockRestore()
    })

    test('returns null body when Core response is not JSON', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 502,
            json: jest.fn().mockRejectedValue(new Error('not json'))
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token'
            },
            'cc-nx_RefArch=refresh-token'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(502)
        expect(res.body).toBeNull()
        logSpy.mockRestore()
    })

    test('returns 500 INTERNAL_ERROR when fetch throws', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        global.fetch.mockRejectedValueOnce(new Error('connection refused'))
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token'
            },
            'cc-nx_RefArch=refresh-token'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(500)
        expect(res.body).toEqual({
            error: 'INTERNAL_ERROR'
        })
        expect(errorSpy).toHaveBeenCalledWith('[token-bridge] Unexpected error:', expect.any(Error))
        errorSpy.mockRestore()
        logSpy.mockRestore()
    })

    test('handles missing req.body without throwing', async () => {
        const req = buildReq()
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({error: 'MISSING_AUTH_LINK_KEY'})
    })

    test('reads refresh token from cc-nx-g cookie for guest users', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token'
            },
            'cc-nx-g_RefArch=guest-refresh-token'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(200)
        const init = global.fetch.mock.calls[0][1]
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            refresh_token: 'guest-refresh-token'
        })
        logSpy.mockRestore()
    })
})

describe('handleTokenBridge - HttpOnly Mode', () => {
    beforeEach(() => {
        process.env.MRT_ENABLE_HTTPONLY_SESSION_COOKIES = 'true'
    })

    test('returns 401 INVALID_SLAS_TOKEN when access token cookie is missing', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://test.salesforce.com'
        const req = buildReq({
            auth_link_key: 'k'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(401)
        expect(res.body).toEqual({error: 'INVALID_SLAS_TOKEN'})
        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('HttpOnly mode: Access token cookie not found')
        )
        errorSpy.mockRestore()
    })

    test('reads access token from cc-at cookie in HttpOnly mode', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key'
            },
            'cc-at_RefArch=httponly-access-token; cc-nx_RefArch=httponly-refresh-token',
            'RefArch'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(200)
        const [url, init] = global.fetch.mock.calls[0]
        expect(url).toBe(
            'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com/agent/identity/bridge'
        )
        expect(init.headers.Authorization).toBe('SLAS httponly-access-token')
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            refresh_token: 'httponly-refresh-token'
        })
        logSpy.mockRestore()
    })

    test('reads refresh token from cc-nx-g cookie for guest users in HttpOnly mode', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key'
            },
            'cc-at_RefArch=httponly-access-token; cc-nx-g_RefArch=guest-refresh-token',
            'RefArch'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(200)
        const init = global.fetch.mock.calls[0][1]
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            refresh_token: 'guest-refresh-token'
        })
        logSpy.mockRestore()
    })

    test('works without refresh token cookie in HttpOnly mode (logs debug)', async () => {
        const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key'
            },
            'cc-at_RefArch=httponly-access-token',
            'RefArch'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(200)
        expect(debugSpy).toHaveBeenCalled()
        debugSpy.mockRestore()
        logSpy.mockRestore()
    })

    test('ignores slas_access_token from body in HttpOnly mode (uses cookie)', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                slas_access_token: 'body-token-should-be-ignored'
            },
            'cc-at_RefArch=httponly-cookie-token; cc-nx_RefArch=refresh-token',
            'RefArch'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(200)
        const init = global.fetch.mock.calls[0][1]
        // Should use cookie token, not body token
        expect(init.headers.Authorization).toBe('SLAS httponly-cookie-token')
        logSpy.mockRestore()
    })

    test('uses custom siteId from x-site-id header for cookie name resolution', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        process.env.ANC_MYDOMAIN = 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key'
            },
            'cc-at_CustomSite=custom-access-token; cc-nx_CustomSite=custom-refresh-token',
            'CustomSite'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(200)
        const init = global.fetch.mock.calls[0][1]
        expect(init.headers.Authorization).toBe('SLAS custom-access-token')
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            refresh_token: 'custom-refresh-token'
        })
        logSpy.mockRestore()
    })
})

describe('registerTokenBridgeRoute', () => {
    test('mounts handleTokenBridge as a POST route on TOKEN_BRIDGE_PROXY_PATH', () => {
        const app = {post: jest.fn()}
        registerTokenBridgeRoute(app)
        expect(app.post).toHaveBeenCalledTimes(1)
        const [path, handler] = app.post.mock.calls[0]
        expect(path).toBe(TOKEN_BRIDGE_PROXY_PATH)
        expect(typeof handler).toBe('function')
    })
})

describe('callTokenBridge (browser helper)', () => {
    test('POSTs auth link key, access token and sends siteId as header (non-HttpOnly mode)', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({ok: true})
        })

        const result = await callTokenBridge({
            authLinkKey: 'auth-key',
            slasAccessToken: 'access-token',
            siteId: 'RefArch'
        })

        expect(global.fetch).toHaveBeenCalledTimes(1)
        const [url, init] = global.fetch.mock.calls[0]
        expect(url).toBe(TOKEN_BRIDGE_PROXY_PATH)
        expect(init.method).toBe('POST')
        expect(init.headers).toEqual({
            'Content-Type': 'application/json',
            'x-site-id': 'RefArch'
        })
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            slas_access_token: 'access-token'
        })
        expect(result).toEqual({status: 200, body: {ok: true}})
    })

    test('omits slas_access_token when not provided (HttpOnly mode)', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({ok: true})
        })

        await callTokenBridge({
            authLinkKey: 'auth-key',
            siteId: 'RefArch'
        })

        const init = global.fetch.mock.calls[0][1]
        expect(init.headers).toEqual({
            'Content-Type': 'application/json',
            'x-site-id': 'RefArch'
        })
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key'
        })
    })

    test('omits x-site-id header when siteId not provided', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({ok: true})
        })

        await callTokenBridge({
            authLinkKey: 'auth-key',
            slasAccessToken: 'access-token'
        })

        const init = global.fetch.mock.calls[0][1]
        expect(init.headers).toEqual({
            'Content-Type': 'application/json'
        })
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            slas_access_token: 'access-token'
        })
    })

    test('returns null body when proxy response is not JSON', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 500,
            json: jest.fn().mockRejectedValue(new Error('not json'))
        })

        const result = await callTokenBridge({
            authLinkKey: 'auth-key',
            slasAccessToken: 'access-token'
        })

        expect(result).toEqual({status: 500, body: null})
    })

    test('exposes the proxy path constant', () => {
        expect(TOKEN_BRIDGE_PROXY_PATH).toBe('/api/agent/identity/bridge')
    })
})
