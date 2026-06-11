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

const buildReq = (body = {}, cookies = '') => ({
    body,
    headers: {cookie: cookies}
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

    test('returns 500 MYDOMAIN_NOT_CONFIGURED when my_domain is not provided', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const req = buildReq({auth_link_key: 'k', slas_access_token: 'a'})
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(500)
        expect(res.body).toEqual({error: 'MYDOMAIN_NOT_CONFIGURED'})
        expect(errorSpy).toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    test('returns 500 MYDOMAIN_NOT_CONFIGURED when my_domain is empty', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const req = buildReq({auth_link_key: 'k', slas_access_token: 'a', my_domain: '   '})
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(500)
        expect(res.body).toEqual({error: 'MYDOMAIN_NOT_CONFIGURED'})
        expect(errorSpy).toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    test('returns 400 UNTRUSTED_MYDOMAIN when host is not Salesforce domain', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a',
            my_domain: 'https://attacker.com'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({error: 'UNTRUSTED_MYDOMAIN'})
        expect(global.fetch).not.toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    test('returns 400 UNTRUSTED_MYDOMAIN for AWS IMDS', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a',
            my_domain: 'http://169.254.169.254'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({error: 'UNTRUSTED_MYDOMAIN'})
        expect(global.fetch).not.toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    test('accepts valid .salesforce.com domain', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a',
            my_domain: 'https://test.salesforce.com'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(200)
        expect(global.fetch).toHaveBeenCalled()
    })

    test('accepts valid .my.salesforce.com domain', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a',
            my_domain: 'https://org.my.salesforce.com'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(200)
        expect(global.fetch).toHaveBeenCalled()
    })

    test('accepts valid .pc-rnd.salesforce.com domain', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq({
            auth_link_key: 'k',
            slas_access_token: 'a',
            my_domain: 'https://orgfarm-1234.test1.pc-rnd.salesforce.com'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(200)
        expect(global.fetch).toHaveBeenCalled()
    })

    test('forwards to Core with refresh_token from cookie when provided', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
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
    })

    test('forwards to Core without refresh_token when cookie not present and warns', async () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq({
            auth_link_key: 'auth-key',
            slas_access_token: 'access-token',
            my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        })
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(global.fetch).toHaveBeenCalledTimes(1)
        const init = global.fetch.mock.calls[0][1]
        expect(JSON.parse(init.body)).toEqual({auth_link_key: 'auth-key'})
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('No SLAS refresh token')
        )
        warnSpy.mockRestore()
    })

    test('forwards Core status and body verbatim on non-200 responses', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 401,
            json: jest.fn().mockResolvedValue({error: 'INVALID_SLAS_TOKEN'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
            },
            'cc-nx_RefArch=refresh-token'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(401)
        expect(res.body).toEqual({error: 'INVALID_SLAS_TOKEN'})
    })

    test('returns null body when Core response is not JSON', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 502,
            json: jest.fn().mockRejectedValue(new Error('not json'))
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
            },
            'cc-nx_RefArch=refresh-token'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(502)
        expect(res.body).toBeNull()
    })

    test('returns 500 SLAS_INTERNAL_ERROR when fetch throws', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        global.fetch.mockRejectedValueOnce(new Error('connection refused'))
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
            },
            'cc-nx_RefArch=refresh-token'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(500)
        expect(res.body).toEqual({
            error: 'SLAS_INTERNAL_ERROR',
            details: 'connection refused'
        })
        expect(errorSpy).toHaveBeenCalledWith('[token-bridge] Unexpected error:', expect.any(Error))
        errorSpy.mockRestore()
    })

    test('handles missing req.body without throwing', async () => {
        const req = buildReq()
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({error: 'MISSING_AUTH_LINK_KEY'})
    })

    test('reads refresh token from cc-nx-g cookie for guest users', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
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
    })
})

describe('handleTokenBridge - HttpOnly Mode', () => {
    beforeEach(() => {
        process.env.MRT_ENABLE_HTTPONLY_SESSION_COOKIES = 'true'
    })

    test('returns 401 INVALID_SLAS_TOKEN when access token cookie is missing', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const req = buildReq({
            auth_link_key: 'k',
            my_domain: 'https://test.salesforce.com'
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
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com',
                site_id: 'RefArch'
            },
            'cc-at_RefArch=httponly-access-token; cc-nx_RefArch=httponly-refresh-token'
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
    })

    test('reads refresh token from cc-nx-g cookie for guest users in HttpOnly mode', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com',
                site_id: 'RefArch'
            },
            'cc-at_RefArch=httponly-access-token; cc-nx-g_RefArch=guest-refresh-token'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(200)
        const init = global.fetch.mock.calls[0][1]
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            refresh_token: 'guest-refresh-token'
        })
    })

    test('works without refresh token cookie in HttpOnly mode (warns)', async () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com',
                site_id: 'RefArch'
            },
            'cc-at_RefArch=httponly-access-token'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(200)
        expect(warnSpy).toHaveBeenCalled()
        warnSpy.mockRestore()
    })

    test('ignores slas_access_token from body in HttpOnly mode (uses cookie)', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                slas_access_token: 'body-token-should-be-ignored',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com',
                site_id: 'RefArch'
            },
            'cc-at_RefArch=httponly-cookie-token; cc-nx_RefArch=refresh-token'
        )
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(200)
        const init = global.fetch.mock.calls[0][1]
        // Should use cookie token, not body token
        expect(init.headers.Authorization).toBe('SLAS httponly-cookie-token')
    })

    test('uses custom siteId for cookie name resolution', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = buildReq(
            {
                auth_link_key: 'auth-key',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com',
                site_id: 'CustomSite'
            },
            'cc-at_CustomSite=custom-access-token; cc-nx_CustomSite=custom-refresh-token'
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
    test('POSTs auth link key, access token, myDomain, and siteId (non-HttpOnly mode)', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({ok: true})
        })

        const result = await callTokenBridge({
            authLinkKey: 'auth-key',
            slasAccessToken: 'access-token',
            myDomain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com',
            siteId: 'RefArch'
        })

        expect(global.fetch).toHaveBeenCalledTimes(1)
        const [url, init] = global.fetch.mock.calls[0]
        expect(url).toBe(TOKEN_BRIDGE_PROXY_PATH)
        expect(init.method).toBe('POST')
        expect(init.headers).toEqual({'Content-Type': 'application/json'})
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            slas_access_token: 'access-token',
            my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com',
            site_id: 'RefArch'
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
            myDomain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com',
            siteId: 'RefArch'
        })

        const init = global.fetch.mock.calls[0][1]
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com',
            site_id: 'RefArch'
        })
    })

    test('omits myDomain when not provided', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({ok: true})
        })

        await callTokenBridge({
            authLinkKey: 'auth-key',
            slasAccessToken: 'access-token',
            siteId: 'RefArch'
        })

        const init = global.fetch.mock.calls[0][1]
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            slas_access_token: 'access-token',
            site_id: 'RefArch'
        })
    })

    test('omits siteId when not provided', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({ok: true})
        })

        await callTokenBridge({
            authLinkKey: 'auth-key',
            slasAccessToken: 'access-token',
            myDomain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        })

        const init = global.fetch.mock.calls[0][1]
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            slas_access_token: 'access-token',
            my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
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
