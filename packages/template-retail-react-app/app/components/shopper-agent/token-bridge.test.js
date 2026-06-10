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

beforeEach(() => {
    global.fetch = jest.fn()
})

afterEach(() => {
    global.fetch = ORIGINAL_FETCH
    if (ORIGINAL_ANC_MYDOMAIN === undefined) {
        delete process.env.ANC_MYDOMAIN
    } else {
        process.env.ANC_MYDOMAIN = ORIGINAL_ANC_MYDOMAIN
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

describe('handleTokenBridge', () => {
    test('returns 400 MISSING_AUTH_LINK_KEY when auth_link_key is missing', async () => {
        const req = {
            body: {
                slas_access_token: 'a',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
            }
        }
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({error: 'MISSING_AUTH_LINK_KEY'})
        expect(global.fetch).not.toHaveBeenCalled()
    })

    test('returns 400 MISSING_AUTH_LINK_KEY when auth_link_key is not a string', async () => {
        const req = {
            body: {
                auth_link_key: 123,
                slas_access_token: 'a',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
            }
        }
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({error: 'MISSING_AUTH_LINK_KEY'})
    })

    test('returns 401 INVALID_SLAS_TOKEN when slas_access_token is missing', async () => {
        const req = {
            body: {
                auth_link_key: 'k',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
            }
        }
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(401)
        expect(res.body).toEqual({error: 'INVALID_SLAS_TOKEN'})
        expect(global.fetch).not.toHaveBeenCalled()
    })

    test('returns 500 MYDOMAIN_NOT_CONFIGURED when my_domain is not provided', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const req = {body: {auth_link_key: 'k', slas_access_token: 'a'}}
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(500)
        expect(res.body).toEqual({error: 'MYDOMAIN_NOT_CONFIGURED'})
        expect(errorSpy).toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    test('returns 500 MYDOMAIN_NOT_CONFIGURED when my_domain is empty', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const req = {body: {auth_link_key: 'k', slas_access_token: 'a', my_domain: '   '}}
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(500)
        expect(res.body).toEqual({error: 'MYDOMAIN_NOT_CONFIGURED'})
        expect(errorSpy).toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    test('forwards to Core with refresh_token in body when provided', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = {
            body: {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token',
                slas_refresh_token: 'refresh-token',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
            }
        }
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

    test('forwards to Core without refresh_token when not provided and warns', async () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({result: 'ok'})
        })
        const req = {
            body: {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
            }
        }
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(global.fetch).toHaveBeenCalledTimes(1)
        const init = global.fetch.mock.calls[0][1]
        expect(JSON.parse(init.body)).toEqual({auth_link_key: 'auth-key'})
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('No SLAS refresh token in request body')
        )
        warnSpy.mockRestore()
    })

    test('forwards Core status and body verbatim on non-200 responses', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 401,
            json: jest.fn().mockResolvedValue({error: 'INVALID_SLAS_TOKEN'})
        })
        const req = {
            body: {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token',
                slas_refresh_token: 'refresh-token',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
            }
        }
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
        const req = {
            body: {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token',
                slas_refresh_token: 'refresh-token',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
            }
        }
        const res = buildRes()
        await handleTokenBridge(req, res)

        expect(res.statusCode).toBe(502)
        expect(res.body).toBeNull()
    })

    test('returns 500 SLAS_INTERNAL_ERROR when fetch throws', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        global.fetch.mockRejectedValueOnce(new Error('connection refused'))
        const req = {
            body: {
                auth_link_key: 'auth-key',
                slas_access_token: 'access-token',
                slas_refresh_token: 'refresh-token',
                my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
            }
        }
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
        const req = {}
        const res = buildRes()
        await handleTokenBridge(req, res)
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({error: 'MISSING_AUTH_LINK_KEY'})
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
    test('POSTs auth link key, access token, refresh token, and myDomain to the proxy path', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({ok: true})
        })

        const result = await callTokenBridge({
            authLinkKey: 'auth-key',
            slasAccessToken: 'access-token',
            slasRefreshToken: 'refresh-token',
            myDomain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        })

        expect(global.fetch).toHaveBeenCalledTimes(1)
        const [url, init] = global.fetch.mock.calls[0]
        expect(url).toBe(TOKEN_BRIDGE_PROXY_PATH)
        expect(init.method).toBe('POST')
        expect(init.headers).toEqual({'Content-Type': 'application/json'})
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            slas_access_token: 'access-token',
            slas_refresh_token: 'refresh-token',
            my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        })
        expect(result).toEqual({status: 200, body: {ok: true}})
    })

    test('omits slas_refresh_token when not provided', async () => {
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

    test('omits slas_refresh_token when null', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({ok: true})
        })

        await callTokenBridge({
            authLinkKey: 'auth-key',
            slasAccessToken: 'access-token',
            slasRefreshToken: null,
            myDomain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        })

        const init = global.fetch.mock.calls[0][1]
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            slas_access_token: 'access-token',
            my_domain: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
        })
    })

    test('omits my_domain when not provided', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({ok: true})
        })

        await callTokenBridge({
            authLinkKey: 'auth-key',
            slasAccessToken: 'access-token',
            slasRefreshToken: 'refresh-token'
        })

        const init = global.fetch.mock.calls[0][1]
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            slas_access_token: 'access-token',
            slas_refresh_token: 'refresh-token'
        })
    })

    test('omits my_domain when null', async () => {
        global.fetch.mockResolvedValueOnce({
            status: 200,
            json: jest.fn().mockResolvedValue({ok: true})
        })

        await callTokenBridge({
            authLinkKey: 'auth-key',
            slasAccessToken: 'access-token',
            slasRefreshToken: 'refresh-token',
            myDomain: null
        })

        const init = global.fetch.mock.calls[0][1]
        expect(JSON.parse(init.body)).toEqual({
            auth_link_key: 'auth-key',
            slas_access_token: 'access-token',
            slas_refresh_token: 'refresh-token'
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
