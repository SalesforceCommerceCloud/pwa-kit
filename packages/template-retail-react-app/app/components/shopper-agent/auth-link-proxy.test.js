/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    handleAuthLinkProxy,
    extractScrt2UrlFromEnv,
    extractApiVersionFromJWT,
    isTrustedSalesforceDomain,
    callAuthLinkProxy,
    AUTH_LINK_PROXY_PATH
} from './auth-link-proxy'

// The module only consumes getSiteId from the runtime cookie-config helper.
jest.mock('@salesforce/pwa-kit-runtime/ssr/server/httponly-cookie-config', () => ({
    getSiteId: jest.fn((req) => req.headers['x-site-id'])
}))

// --- Test helpers -----------------------------------------------------------
// Commerce Client JWTs are `header.payload.signature`, each segment base64url.
// The proxy never verifies the signature (SCRT does) — it only base64url-decodes
// the payload to read the `apiVersion` claim, so a dummy signature is fine here.
const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
const makeJWT = (payload, header = {alg: 'RS256', typ: 'JWT'}) =>
    `${encode(header)}.${encode(payload)}.signature`

// A JWT minted for v2 (the version Commerce Client currently issues).
const V2_JWT = makeJWT({apiVersion: 'v2', sub: 'v2/iamessage/abc', iss: 'orgJwt'})
// A JWT minted for v1 (proves the path version is derived, not hardcoded).
const V1_JWT = makeJWT({apiVersion: 'v1', sub: 'v1/iamessage/abc', iss: 'orgJwt'})

const TRUSTED_SCRT2_URL = 'https://orgfarm-123.test1.my.pc-rnd.salesforce-scrt.com'

describe('auth-link-proxy', () => {
    let originalEnv
    let mockFetch

    beforeEach(() => {
        originalEnv = {...process.env}
        mockFetch = jest.fn()
        global.fetch = mockFetch
    })

    afterEach(() => {
        process.env = originalEnv
        jest.clearAllMocks()
    })

    // ------------------------------------------------------------------------
    describe('extractApiVersionFromJWT', () => {
        it('returns the apiVersion claim (v2)', () => {
            expect(extractApiVersionFromJWT(V2_JWT)).toBe('v2')
        })

        it('returns the apiVersion claim (v1)', () => {
            expect(extractApiVersionFromJWT(V1_JWT)).toBe('v1')
        })

        it('supports multi-digit versions (v10)', () => {
            expect(extractApiVersionFromJWT(makeJWT({apiVersion: 'v10'}))).toBe('v10')
        })

        it('returns null when the apiVersion claim is absent', () => {
            expect(extractApiVersionFromJWT(makeJWT({iss: 'orgJwt'}))).toBeNull()
        })

        it('returns null (rejects) a path-traversal apiVersion claim', () => {
            expect(extractApiVersionFromJWT(makeJWT({apiVersion: '../../evil'}))).toBeNull()
        })

        it('returns null for an apiVersion missing the v prefix', () => {
            expect(extractApiVersionFromJWT(makeJWT({apiVersion: '2'}))).toBeNull()
        })

        it('is case-sensitive (rejects uppercase V2)', () => {
            expect(extractApiVersionFromJWT(makeJWT({apiVersion: 'V2'}))).toBeNull()
        })

        it('returns null for null / undefined / non-string input', () => {
            expect(extractApiVersionFromJWT(null)).toBeNull()
            expect(extractApiVersionFromJWT(undefined)).toBeNull()
            expect(extractApiVersionFromJWT(12345)).toBeNull()
        })

        it('returns null for a malformed JWT (fewer than 2 segments)', () => {
            expect(extractApiVersionFromJWT('only-one-segment')).toBeNull()
        })

        it('returns null when the payload segment is not valid JSON', () => {
            const badPayload = Buffer.from('not-json').toString('base64url')
            expect(extractApiVersionFromJWT(`${encode({alg: 'none'})}.${badPayload}.sig`)).toBeNull()
        })
    })

    // ------------------------------------------------------------------------
    describe('extractScrt2UrlFromEnv', () => {
        it('returns scrt2Url from COMMERCE_AGENT_SETTINGS', () => {
            process.env.COMMERCE_AGENT_SETTINGS = JSON.stringify({scrt2Url: TRUSTED_SCRT2_URL})
            expect(extractScrt2UrlFromEnv()).toBe(TRUSTED_SCRT2_URL)
        })

        it('strips a trailing slash', () => {
            process.env.COMMERCE_AGENT_SETTINGS = JSON.stringify({
                scrt2Url: `${TRUSTED_SCRT2_URL}/`
            })
            expect(extractScrt2UrlFromEnv()).toBe(TRUSTED_SCRT2_URL)
        })

        it('trims surrounding whitespace', () => {
            process.env.COMMERCE_AGENT_SETTINGS = JSON.stringify({
                scrt2Url: `  ${TRUSTED_SCRT2_URL}  `
            })
            expect(extractScrt2UrlFromEnv()).toBe(TRUSTED_SCRT2_URL)
        })

        it('returns null and logs when COMMERCE_AGENT_SETTINGS is not set', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
            delete process.env.COMMERCE_AGENT_SETTINGS
            expect(extractScrt2UrlFromEnv()).toBeNull()
            expect(consoleSpy).toHaveBeenCalledWith(
                '[auth-link-proxy] COMMERCE_AGENT_SETTINGS environment variable not set'
            )
            consoleSpy.mockRestore()
        })

        it('returns null and logs when COMMERCE_AGENT_SETTINGS is not valid JSON', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
            process.env.COMMERCE_AGENT_SETTINGS = '{not valid json'
            expect(extractScrt2UrlFromEnv()).toBeNull()
            expect(consoleSpy).toHaveBeenCalledWith(
                '[auth-link-proxy] COMMERCE_AGENT_SETTINGS is not valid JSON',
                expect.objectContaining({message: expect.any(String)})
            )
            consoleSpy.mockRestore()
        })

        it('returns null and logs when scrt2Url is absent from the settings', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
            process.env.COMMERCE_AGENT_SETTINGS = JSON.stringify({someOtherField: 'x'})
            expect(extractScrt2UrlFromEnv()).toBeNull()
            expect(consoleSpy).toHaveBeenCalledWith(
                '[auth-link-proxy] scrt2Url not present in COMMERCE_AGENT_SETTINGS'
            )
            consoleSpy.mockRestore()
        })

        it('returns null when scrt2Url is an empty / whitespace string', () => {
            process.env.COMMERCE_AGENT_SETTINGS = JSON.stringify({scrt2Url: '   '})
            expect(extractScrt2UrlFromEnv()).toBeNull()
        })
    })

    // ------------------------------------------------------------------------
    describe('isTrustedSalesforceDomain', () => {
        it('accepts .salesforce.com domains', () => {
            expect(isTrustedSalesforceDomain('https://org.salesforce.com')).toBe(true)
        })

        it('accepts .my.salesforce.com domains', () => {
            expect(isTrustedSalesforceDomain('https://org.my.salesforce.com')).toBe(true)
        })

        it('accepts .pc-rnd.salesforce.com domains', () => {
            expect(
                isTrustedSalesforceDomain('https://orgfarm-123.test1.my.pc-rnd.salesforce.com')
            ).toBe(true)
        })

        it('accepts .salesforce-scrt.com domains', () => {
            expect(isTrustedSalesforceDomain('https://org.salesforce-scrt.com')).toBe(true)
        })

        it('accepts .my.salesforce-scrt.com domains', () => {
            expect(
                isTrustedSalesforceDomain('https://orgfarm-123.test1.my.salesforce-scrt.com')
            ).toBe(true)
        })

        it('accepts .pc-rnd.salesforce-scrt.com domains', () => {
            expect(isTrustedSalesforceDomain(TRUSTED_SCRT2_URL)).toBe(true)
        })

        it('rejects non-Salesforce domains', () => {
            expect(isTrustedSalesforceDomain('https://evil.com')).toBe(false)
        })

        it('rejects domains that only contain salesforce in a subdomain', () => {
            expect(isTrustedSalesforceDomain('https://salesforce.evil.com')).toBe(false)
        })

        it('rejects invalid URLs', () => {
            expect(isTrustedSalesforceDomain('not-a-url')).toBe(false)
        })

        it('is case-insensitive', () => {
            expect(isTrustedSalesforceDomain('https://ORG.SALESFORCE.COM')).toBe(true)
        })
    })

    // ------------------------------------------------------------------------
    describe('handleAuthLinkProxy', () => {
        let req, res

        beforeEach(() => {
            process.env.COMMERCE_AGENT_SETTINGS = JSON.stringify({scrt2Url: TRUSTED_SCRT2_URL})

            req = {
                headers: {
                    'x-site-id': 'RefArch',
                    origin: 'https://localhost:3000',
                    host: 'localhost:3000'
                },
                body: {commerce_client_jwt: V2_JWT}
            }

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            }
        })

        it('retrieves the auth link key, calling SCRT at the fixed v1 authlink path', async () => {
            // authlink is v1-internal only; the path is fixed regardless of the
            // JWT (this beforeEach presents a v2 JWT — SCRT would 401 it in real
            // life, but the proxy must still target the v1 path, never a v2 one).
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({auth_link_key: 'test-auth-link-key'})
            })

            await handleAuthLinkProxy(req, res)

            expect(mockFetch).toHaveBeenCalledWith(
                `${TRUSTED_SCRT2_URL}/iamessage/v1/authorization/authlink`,
                {
                    method: 'GET',
                    headers: {Authorization: `Bearer ${V2_JWT}`}
                }
            )
            expect(res.status).toHaveBeenCalledWith(200)
            // The response echoes the SCRT URL that was called as `scrt_url`,
            // alongside SCRT's own body.
            expect(res.json).toHaveBeenCalledWith({
                auth_link_key: 'test-auth-link-key',
                scrt_url: `${TRUSTED_SCRT2_URL}/iamessage/v1/authorization/authlink`
            })
        })

        it('always targets the v1 path — never derives a v2 path from the JWT', async () => {
            // Regression guard for the reverted bug: a v2 JWT must NOT produce a
            // /iamessage/v2/... request (that endpoint does not exist -> 404).
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({auth_link_key: 'k'})
            })

            await handleAuthLinkProxy(req, res)

            const calledUrl = mockFetch.mock.calls[0][0]
            expect(calledUrl).toBe(`${TRUSTED_SCRT2_URL}/iamessage/v1/authorization/authlink`)
            expect(calledUrl).not.toContain('/iamessage/v2/')
        })

        describe('conversationId query param', () => {
            it('appends conversationId to the SCRT URL when provided', async () => {
                req.body = {
                    commerce_client_jwt: V2_JWT,
                    conversation_id: '3d55ae6f-9775-426e-a7d0-192b197d08d8'
                }
                mockFetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({auth_link_key: 'k'})
                })

                await handleAuthLinkProxy(req, res)

                const expectedUrl =
                    `${TRUSTED_SCRT2_URL}/iamessage/v1/authorization/authlink` +
                    '?conversationId=3d55ae6f-9775-426e-a7d0-192b197d08d8'
                expect(mockFetch).toHaveBeenCalledWith(
                    expectedUrl,
                    expect.objectContaining({method: 'GET'})
                )
                // scrt_url in the response reflects the query param too.
                expect(res.json).toHaveBeenCalledWith({
                    auth_link_key: 'k',
                    scrt_url: expectedUrl
                })
            })

            it('omits the query param when conversation_id is absent', async () => {
                // beforeEach body has no conversation_id.
                mockFetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({auth_link_key: 'k'})
                })

                await handleAuthLinkProxy(req, res)

                const calledUrl = mockFetch.mock.calls[0][0]
                expect(calledUrl).toBe(`${TRUSTED_SCRT2_URL}/iamessage/v1/authorization/authlink`)
                expect(calledUrl).not.toContain('conversationId')
            })

            it('omits the query param when conversation_id is blank/whitespace', async () => {
                req.body = {commerce_client_jwt: V2_JWT, conversation_id: '   '}
                mockFetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({auth_link_key: 'k'})
                })

                await handleAuthLinkProxy(req, res)

                const calledUrl = mockFetch.mock.calls[0][0]
                expect(calledUrl).not.toContain('conversationId')
            })

            it('percent-encodes a conversationId containing URL-unsafe characters', async () => {
                req.body = {commerce_client_jwt: V2_JWT, conversation_id: 'a b&c=d'}
                mockFetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({auth_link_key: 'k'})
                })

                await handleAuthLinkProxy(req, res)

                const calledUrl = mockFetch.mock.calls[0][0]
                // No raw '&' or '=' from the value leaks into the query string.
                expect(calledUrl).toContain('conversationId=a+b%26c%3Dd')
                expect(calledUrl).not.toContain('a b&c=d')
            })
        })

        it('warns when the presented JWT version will not match the v1 authlink endpoint', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
            // beforeEach already sets a v2 JWT in req.body.
            mockFetch.mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({message: 'version mismatch'})
            })

            await handleAuthLinkProxy(req, res)

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('does not match the authlink'),
                expect.objectContaining({jwtApiVersion: 'v2', requiredApiVersion: 'v1'})
            )
            consoleSpy.mockRestore()
        })

        it('does not warn when the presented JWT is already v1', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
            req.body = {commerce_client_jwt: V1_JWT}
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({auth_link_key: 'k'})
            })

            await handleAuthLinkProxy(req, res)

            expect(consoleSpy).not.toHaveBeenCalled()
            consoleSpy.mockRestore()
        })

        it('returns 401 MISSING_COMMERCE_CLIENT_JWT when the JWT is absent', async () => {
            req.body = {}

            await handleAuthLinkProxy(req, res)

            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({error: 'MISSING_COMMERCE_CLIENT_JWT'})
            expect(mockFetch).not.toHaveBeenCalled()
        })

        it('returns 401 MISSING_COMMERCE_CLIENT_JWT when the JWT is not a string', async () => {
            req.body = {commerce_client_jwt: 12345}

            await handleAuthLinkProxy(req, res)

            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({error: 'MISSING_COMMERCE_CLIENT_JWT'})
            expect(mockFetch).not.toHaveBeenCalled()
        })

        describe('CSRF protection', () => {
            it('allows same-origin requests', async () => {
                req.headers.origin = 'https://localhost:3000'
                req.headers.host = 'localhost:3000'
                mockFetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({auth_link_key: 'k'})
                })

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(200)
            })

            it('allows trusted Salesforce origins (e.g. Storefront Preview iframe)', async () => {
                req.headers.origin = 'https://orgfarm-123.test1.my.pc-rnd.salesforce.com'
                req.headers.host = 'localhost:3000'
                mockFetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({auth_link_key: 'k'})
                })

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(200)
            })

            it('blocks untrusted origins with 403 FORBIDDEN_ORIGIN', async () => {
                req.headers.origin = 'https://evil.com'
                req.headers.host = 'localhost:3000'

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(403)
                expect(res.json).toHaveBeenCalledWith({error: 'FORBIDDEN_ORIGIN'})
                expect(mockFetch).not.toHaveBeenCalled()
            })

            it('returns 400 INVALID_ORIGIN for a malformed Origin header', async () => {
                req.headers.origin = 'not-a-valid-url'

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(400)
                expect(res.json).toHaveBeenCalledWith({error: 'INVALID_ORIGIN'})
            })

            it('allows requests without an Origin/Referer header', async () => {
                delete req.headers.origin
                delete req.headers.referer
                mockFetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({auth_link_key: 'k'})
                })

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(200)
            })
        })

        describe('SCRT2 URL resolution / SSRF protection', () => {
            it('returns 500 SCRT2_URL_NOT_CONFIGURED when COMMERCE_AGENT_SETTINGS is missing', async () => {
                delete process.env.COMMERCE_AGENT_SETTINGS

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(500)
                expect(res.json).toHaveBeenCalledWith({error: 'SCRT2_URL_NOT_CONFIGURED'})
                expect(mockFetch).not.toHaveBeenCalled()
            })

            it('returns 400 UNTRUSTED_SCRT2_URL when scrt2Url is not a Salesforce domain', async () => {
                process.env.COMMERCE_AGENT_SETTINGS = JSON.stringify({
                    scrt2Url: 'https://evil.com'
                })

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(400)
                expect(res.json).toHaveBeenCalledWith({error: 'UNTRUSTED_SCRT2_URL'})
                expect(mockFetch).not.toHaveBeenCalled()
            })
        })

        describe('SCRT endpoint errors are forwarded verbatim (with scrt_url echoed)', () => {
            const SCRT_URL = `${TRUSTED_SCRT2_URL}/iamessage/v1/authorization/authlink`

            it('forwards a 401 Unauthorized from SCRT, adding scrt_url', async () => {
                mockFetch.mockResolvedValue({
                    ok: false,
                    status: 401,
                    json: async () => ({message: 'INVALID_TOKEN'})
                })

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(401)
                expect(res.json).toHaveBeenCalledWith({
                    message: 'INVALID_TOKEN',
                    scrt_url: SCRT_URL
                })
            })

            it('forwards the version-mismatch 401 (regression for the v1/v2 bug), adding scrt_url', async () => {
                // If a caller ever hits the wrong version, SCRT returns this exact
                // body (error 900020). We must surface it unchanged, not swallow it.
                const versionMismatchBody = {
                    message:
                        'JWT is valid,but not issued with correct version of the end point. ' +
                        'Please use the correct version of the end point.'
                }
                mockFetch.mockResolvedValue({
                    ok: false,
                    status: 401,
                    json: async () => versionMismatchBody
                })

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(401)
                expect(res.json).toHaveBeenCalledWith({
                    ...versionMismatchBody,
                    scrt_url: SCRT_URL
                })
            })

            it('forwards a 403 Forbidden from SCRT, adding scrt_url', async () => {
                mockFetch.mockResolvedValue({
                    ok: false,
                    status: 403,
                    json: async () => ({error: 'FORBIDDEN'})
                })

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(403)
                expect(res.json).toHaveBeenCalledWith({error: 'FORBIDDEN', scrt_url: SCRT_URL})
            })

            it('forwards a 500 from SCRT, adding scrt_url', async () => {
                mockFetch.mockResolvedValue({
                    ok: false,
                    status: 500,
                    json: async () => ({error: 'INTERNAL_ERROR'})
                })

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(500)
                expect(res.json).toHaveBeenCalledWith({
                    error: 'INTERNAL_ERROR',
                    scrt_url: SCRT_URL
                })
            })

            it('forwards the status and nests a null body under upstream_body when SCRT returns invalid JSON', async () => {
                mockFetch.mockResolvedValue({
                    ok: false,
                    status: 500,
                    json: async () => {
                        throw new Error('Invalid JSON')
                    }
                })

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(500)
                expect(res.json).toHaveBeenCalledWith({scrt_url: SCRT_URL, upstream_body: null})
            })
        })

        describe('unexpected errors', () => {
            it('returns 500 INTERNAL_ERROR on a network failure', async () => {
                mockFetch.mockRejectedValue(new Error('Network error'))

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(500)
                expect(res.json).toHaveBeenCalledWith({error: 'INTERNAL_ERROR'})
            })

            it('logs unexpected errors', async () => {
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
                mockFetch.mockRejectedValue(new Error('Network error'))

                await handleAuthLinkProxy(req, res)

                expect(consoleSpy).toHaveBeenCalledWith(
                    '[auth-link-proxy] Unexpected error:',
                    expect.any(Error)
                )
                consoleSpy.mockRestore()
            })
        })
    })

    // ------------------------------------------------------------------------
    describe('callAuthLinkProxy (browser helper)', () => {
        it('exposes the proxy path for browser use', () => {
            expect(AUTH_LINK_PROXY_PATH).toBe('/api/agent/authlink')
        })

        it('POSTs the JWT to the proxy and returns the parsed body', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({auth_link_key: 'k', scrt_url: 'https://x/authlink'})
            })

            const result = await callAuthLinkProxy({
                commerceClientJWT: V2_JWT,
                siteId: 'RefArch'
            })

            expect(result).toEqual({auth_link_key: 'k', scrt_url: 'https://x/authlink'})
            expect(mockFetch).toHaveBeenCalledTimes(1)
            const [path, opts] = mockFetch.mock.calls[0]
            expect(path).toBe(AUTH_LINK_PROXY_PATH)
            expect(opts.method).toBe('POST')
            expect(opts.headers['x-site-id']).toBe('RefArch')
            expect(JSON.parse(opts.body)).toEqual({commerce_client_jwt: V2_JWT})
        })

        it('forwards conversationId as conversation_id in the POST body', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({auth_link_key: 'k'})
            })

            await callAuthLinkProxy({
                commerceClientJWT: V2_JWT,
                conversationId: 'ee051d12-0a3b-4858-a3e6-57abf2fe7b72',
                siteId: 'RefArch'
            })

            const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(sentBody).toEqual({
                commerce_client_jwt: V2_JWT,
                conversation_id: 'ee051d12-0a3b-4858-a3e6-57abf2fe7b72'
            })
        })

        it('omits conversation_id from the body when conversationId is not provided', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({auth_link_key: 'k'})
            })

            await callAuthLinkProxy({commerceClientJWT: V2_JWT})

            const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(sentBody).not.toHaveProperty('conversation_id')
        })

        it('throws with the proxy error code when the proxy responds non-OK', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({error: 'MISSING_COMMERCE_CLIENT_JWT'})
            })

            await expect(
                callAuthLinkProxy({commerceClientJWT: V2_JWT})
            ).rejects.toThrow('MISSING_COMMERCE_CLIENT_JWT')
        })
    })
})
