/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    handleAuthLinkProxy,
    extractScrt2UrlFromEnv,
    callAuthLinkProxy,
    AUTH_LINK_PROXY_PATH
} from '@salesforce/retail-react-app/app/components/shopper-agent/auth-link-proxy'

// --- Test helpers -----------------------------------------------------------
// Commerce Client JWTs are `header.payload.signature`, each segment base64url.
// The proxy forwards the JWT to SCRT verbatim as a Bearer token and never
// verifies the signature (SCRT does), so a dummy signature is fine here.
const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
const makeJWT = (payload, header = {alg: 'RS256', typ: 'JWT'}) =>
    `${encode(header)}.${encode(payload)}.signature`

// A representative Commerce Client JWT (minted for the v2 API the widget issues).
const V2_JWT = makeJWT({apiVersion: 'v2', sub: 'v2/iamessage/abc', iss: 'orgJwt'})

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

    // NOTE: The domain allowlist validators (isTrustedSalesforceDomain,
    // isTrustedSCRTDomain) now live in ./salesforce-domain-allowlist.js and are
    // unit-tested there. Their behavior in this proxy's handler is exercised by
    // the CSRF and SSRF cases in the handleAuthLinkProxy describe block below.

    // ------------------------------------------------------------------------
    describe('handleAuthLinkProxy', () => {
        let req, res

        beforeEach(() => {
            process.env.COMMERCE_AGENT_SETTINGS = JSON.stringify({scrt2Url: TRUSTED_SCRT2_URL})

            req = {
                headers: {
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

        it('retrieves the auth link key, calling SCRT at the fixed v2 authlink path', async () => {
            // authlink is served by the v2 API; the path is fixed regardless of
            // the JWT (this beforeEach presents a v2 JWT, which matches).
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({auth_link_key: 'test-auth-link-key'})
            })

            await handleAuthLinkProxy(req, res)

            expect(mockFetch).toHaveBeenCalledWith(
                `${TRUSTED_SCRT2_URL}/iamessage/api/v2/authorization/authlink`,
                {
                    method: 'GET',
                    headers: {Authorization: `Bearer ${V2_JWT}`},
                    // The request is bounded by an AbortController timeout (#7),
                    // so an AbortSignal is always attached. Coverage for the
                    // signal/timeout behavior itself lives in the dedicated
                    // "passes an AbortSignal" / "returns 504 SCRT_TIMEOUT" tests.
                    signal: expect.anything()
                }
            )
            expect(res.status).toHaveBeenCalledWith(200)
            // SCRT's body is forwarded to the caller unchanged.
            expect(res.json).toHaveBeenCalledWith({
                auth_link_key: 'test-auth-link-key'
            })
        })

        it('always targets the fixed v2 path — never derives the version from the JWT', async () => {
            // Regression guard: the path is hardcoded (SCRT_AUTHLINK_PATH) and
            // must not be derived from the presented JWT's apiVersion claim.
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({auth_link_key: 'k'})
            })

            await handleAuthLinkProxy(req, res)

            const calledUrl = mockFetch.mock.calls[0][0]
            expect(calledUrl).toBe(`${TRUSTED_SCRT2_URL}/iamessage/api/v2/authorization/authlink`)
        })

        it('ignores conversation_id in the body — it never reaches the SCRT URL', async () => {
            // conversation_id is no longer part of the authlink flow. A stray
            // value in the request body must be dropped, not forwarded to SCRT.
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

            const calledUrl = mockFetch.mock.calls[0][0]
            expect(calledUrl).toBe(`${TRUSTED_SCRT2_URL}/iamessage/api/v2/authorization/authlink`)
            expect(calledUrl).not.toContain('conversationId')
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

        describe('SCRT endpoint errors are forwarded verbatim', () => {
            it('forwards a 401 Unauthorized from SCRT unchanged', async () => {
                mockFetch.mockResolvedValue({
                    ok: false,
                    status: 401,
                    json: async () => ({message: 'INVALID_TOKEN'})
                })

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(401)
                expect(res.json).toHaveBeenCalledWith({message: 'INVALID_TOKEN'})
            })

            it('forwards the version-mismatch 401 unchanged (regression for the version-mismatch bug)', async () => {
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
                expect(res.json).toHaveBeenCalledWith(versionMismatchBody)
            })

            it('forwards a 403 Forbidden from SCRT unchanged', async () => {
                mockFetch.mockResolvedValue({
                    ok: false,
                    status: 403,
                    json: async () => ({error: 'FORBIDDEN'})
                })

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(403)
                expect(res.json).toHaveBeenCalledWith({error: 'FORBIDDEN'})
            })

            it('forwards a 500 from SCRT unchanged', async () => {
                mockFetch.mockResolvedValue({
                    ok: false,
                    status: 500,
                    json: async () => ({error: 'INTERNAL_ERROR'})
                })

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(500)
                expect(res.json).toHaveBeenCalledWith({error: 'INTERNAL_ERROR'})
            })

            it('forwards the status with a null body when SCRT returns invalid JSON', async () => {
                mockFetch.mockResolvedValue({
                    ok: false,
                    status: 500,
                    json: async () => {
                        throw new Error('Invalid JSON')
                    }
                })

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(500)
                expect(res.json).toHaveBeenCalledWith(null)
            })
        })

        describe('unexpected errors', () => {
            it('returns 500 INTERNAL_ERROR on a network failure', async () => {
                mockFetch.mockRejectedValue(new Error('Network error'))

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(500)
                expect(res.json).toHaveBeenCalledWith({error: 'INTERNAL_ERROR'})
            })

            it('returns 504 SCRT_TIMEOUT when the SCRT request aborts on timeout', async () => {
                // Simulate the AbortController firing: undici fetch rejects with an
                // AbortError when the request is aborted past the timeout deadline.
                const abortError = new Error('The operation was aborted')
                abortError.name = 'AbortError'
                mockFetch.mockRejectedValue(abortError)

                await handleAuthLinkProxy(req, res)

                expect(res.status).toHaveBeenCalledWith(504)
                expect(res.json).toHaveBeenCalledWith({error: 'SCRT_TIMEOUT'})
            })

            it('passes an AbortSignal to the SCRT fetch (bounded by a timeout)', async () => {
                mockFetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => ({auth_link_key: 'k'})
                })

                await handleAuthLinkProxy(req, res)

                const opts = mockFetch.mock.calls[0][1]
                expect(opts.signal).toBeDefined()
                // AbortController.signal is an AbortSignal instance.
                expect(typeof opts.signal.aborted).toBe('boolean')
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
                json: async () => ({auth_link_key: 'k'})
            })

            const result = await callAuthLinkProxy({commerceClientJWT: V2_JWT})

            expect(result).toEqual({auth_link_key: 'k'})
            expect(mockFetch).toHaveBeenCalledTimes(1)
            const [path, opts] = mockFetch.mock.calls[0]
            expect(path).toBe(AUTH_LINK_PROXY_PATH)
            expect(opts.method).toBe('POST')
            expect(JSON.parse(opts.body)).toEqual({commerce_client_jwt: V2_JWT})
        })

        it('does not send an x-site-id header (authlink authenticates with the JWT alone)', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({auth_link_key: 'k'})
            })

            await callAuthLinkProxy({commerceClientJWT: V2_JWT})

            const opts = mockFetch.mock.calls[0][1]
            expect(opts.headers).not.toHaveProperty('x-site-id')
        })

        it('never includes conversation_id in the POST body', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({auth_link_key: 'k'})
            })

            await callAuthLinkProxy({commerceClientJWT: V2_JWT})

            const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(sentBody).toEqual({commerce_client_jwt: V2_JWT})
            expect(sentBody).not.toHaveProperty('conversation_id')
        })

        it('throws with the proxy error code when the proxy responds non-OK', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({error: 'MISSING_COMMERCE_CLIENT_JWT'})
            })

            await expect(callAuthLinkProxy({commerceClientJWT: V2_JWT})).rejects.toThrow(
                'MISSING_COMMERCE_CLIENT_JWT'
            )
        })
    })
})
