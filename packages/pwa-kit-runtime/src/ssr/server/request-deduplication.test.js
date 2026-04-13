/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getRefreshDeduplicationKey, createRefreshTokenDeduplicator} from './request-deduplication'
import {X_GRANT_TYPE, X_SITE_ID} from './constants'

jest.mock('../../utils/logger-instance', () => ({
    __esModule: true,
    default: {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
    }
}))

import logger from '../../utils/logger-instance'

function makeReq({siteId = 'testsite', grantType = 'refresh_token', cookies = {}} = {}) {
    const cookieParts = Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ')
    return {
        headers: {
            [X_SITE_ID]: siteId,
            [X_GRANT_TYPE]: grantType,
            ...(cookieParts ? {cookie: cookieParts} : {})
        }
    }
}

function makeRes() {
    const headers = {}
    const res = {
        statusCode: 200,
        headersSent: false,
        append: jest.fn((name, value) => {
            const key = name.toLowerCase()
            if (!headers[key]) headers[key] = []
            headers[key].push(value)
        }),
        set: jest.fn((name, value) => {
            headers[name.toLowerCase()] = value
        }),
        getHeader: jest.fn((name) => headers[name.toLowerCase()]),
        status: jest.fn(function (code) {
            res.statusCode = code
            return res
        }),
        json: jest.fn(function (body) {
            res.end(JSON.stringify(body))
            return res
        }),
        end: jest.fn()
    }
    return res
}

describe('getRefreshDeduplicationKey', () => {
    test('returns key for valid refresh_token request with registered token', () => {
        const req = makeReq({cookies: {'cc-nx_testsite': 'rt-registered-abc'}})
        const key = getRefreshDeduplicationKey(req)
        expect(key).toBe('refresh:testsite:rt-registered-abc')
    })

    test('returns key for valid refresh_token request with guest token', () => {
        const req = makeReq({cookies: {'cc-nx-g_testsite': 'rt-guest-xyz'}})
        const key = getRefreshDeduplicationKey(req)
        expect(key).toBe('refresh:testsite:rt-guest-xyz')
    })

    test('prefers registered token over guest token', () => {
        const req = makeReq({
            cookies: {
                'cc-nx_testsite': 'rt-registered',
                'cc-nx-g_testsite': 'rt-guest'
            }
        })
        const key = getRefreshDeduplicationKey(req)
        expect(key).toBe('refresh:testsite:rt-registered')
    })

    test('returns null for non-refresh_token grant type', () => {
        const req = makeReq({grantType: 'authorization_code', cookies: {'cc-nx_testsite': 'rt'}})
        expect(getRefreshDeduplicationKey(req)).toBeNull()
    })

    test('returns null when x-grant-type header is missing', () => {
        const req = {
            headers: {
                [X_SITE_ID]: 'testsite',
                cookie: 'cc-nx_testsite=rt'
            }
        }
        expect(getRefreshDeduplicationKey(req)).toBeNull()
    })

    test('returns null when x-site-id header is missing', () => {
        const req = {
            headers: {
                [X_GRANT_TYPE]: 'refresh_token',
                cookie: 'cc-nx_testsite=rt'
            }
        }
        expect(getRefreshDeduplicationKey(req)).toBeNull()
    })

    test('returns null when cookie header is missing', () => {
        const req = makeReq({cookies: {}})
        // Remove the cookie header entirely
        delete req.headers.cookie
        expect(getRefreshDeduplicationKey(req)).toBeNull()
    })

    test('returns null when refresh token cookie is not found', () => {
        const req = makeReq({cookies: {unrelated_cookie: 'value'}})
        expect(getRefreshDeduplicationKey(req)).toBeNull()
    })

    test('uses siteId to scope cookie lookup', () => {
        // Cookie is for 'siteA' but request has siteId 'siteB'
        const req = makeReq({siteId: 'siteB', cookies: {'cc-nx_siteA': 'rt-for-a'}})
        expect(getRefreshDeduplicationKey(req)).toBeNull()
    })
})

describe('createRefreshTokenDeduplicator', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('passes through non-refresh requests without deduplication', (done) => {
        const middleware = createRefreshTokenDeduplicator()
        const req = makeReq({grantType: 'authorization_code', cookies: {'cc-nx_testsite': 'rt'}})
        const res = makeRes()
        middleware(req, res, () => {
            // next() was called — request passed through
            done()
        })
    })

    test('passes through first refresh request and wraps res.end', (done) => {
        const middleware = createRefreshTokenDeduplicator()
        const req = makeReq({cookies: {'cc-nx_testsite': 'rt-abc'}})
        const res = makeRes()
        const originalEnd = res.end

        middleware(req, res, () => {
            // next() was called
            expect(res.end).not.toBe(originalEnd) // res.end was wrapped
            // Simulate the proxy completing
            res.end('response body')
            done()
        })
    })

    test('deduplicates concurrent requests with the same refresh token', async () => {
        const middleware = createRefreshTokenDeduplicator()
        const cookies = {'cc-nx_testsite': 'rt-same-token'}

        // First request: passes through
        const req1 = makeReq({cookies})
        const res1 = makeRes()
        let firstRequestNext
        const firstRequestReady = new Promise((resolve) => {
            firstRequestNext = resolve
        })
        middleware(req1, res1, () => firstRequestNext())
        await firstRequestReady

        // Second request: should be deduplicated (next NOT called)
        const req2 = makeReq({cookies})
        const res2 = makeRes()
        let secondNextCalled = false
        middleware(req2, res2, () => {
            secondNextCalled = true
        })

        expect(secondNextCalled).toBe(false)
        expect(logger.info).toHaveBeenCalledWith(
            expect.stringContaining('Deduplicating'),
            expect.any(Object)
        )

        // Complete the first request — this resolves the deferred for waiting requests
        res1.append('set-cookie', 'cc-at_testsite=new-access-token; HttpOnly')
        res1.append('set-cookie', 'cc-nx_testsite=new-refresh-token; HttpOnly')
        res1.set('content-type', 'application/json')
        res1.statusCode = 200
        res1.end(Buffer.from('{"customer_id":"c1"}'))

        // Allow microtasks to flush
        await new Promise((r) => setTimeout(r, 0))

        // Second response should have the same status, cookies, and body
        expect(res2.status).toHaveBeenCalledWith(200)
        expect(res2.append).toHaveBeenCalledWith(
            'set-cookie',
            'cc-at_testsite=new-access-token; HttpOnly'
        )
        expect(res2.append).toHaveBeenCalledWith(
            'set-cookie',
            'cc-nx_testsite=new-refresh-token; HttpOnly'
        )
        expect(res2.end).toHaveBeenCalledWith(Buffer.from('{"customer_id":"c1"}'))
    })

    test('does not deduplicate requests with different refresh tokens', (done) => {
        const middleware = createRefreshTokenDeduplicator()

        // First request
        const req1 = makeReq({cookies: {'cc-nx_testsite': 'token-A'}})
        const res1 = makeRes()
        middleware(req1, res1, () => {
            // Second request with different token
            const req2 = makeReq({cookies: {'cc-nx_testsite': 'token-B'}})
            const res2 = makeRes()
            middleware(req2, res2, () => {
                // Both passed through — no deduplication
                done()
            })
        })
    })

    test('cleans up pending entry after first request completes', async () => {
        const middleware = createRefreshTokenDeduplicator()
        const cookies = {'cc-nx_testsite': 'rt-cleanup'}

        // First request
        const req1 = makeReq({cookies})
        const res1 = makeRes()
        let nextResolve
        const nextCalled = new Promise((r) => (nextResolve = r))
        middleware(req1, res1, nextResolve)
        await nextCalled

        // Complete first request
        res1.statusCode = 200
        res1.end('ok')

        // Allow microtasks to flush
        await new Promise((r) => setTimeout(r, 0))

        // Third request should pass through (not deduplicated — pending was cleaned up)
        const req3 = makeReq({cookies})
        const res3 = makeRes()
        let thirdNextCalled = false
        middleware(req3, res3, () => {
            thirdNextCalled = true
        })
        expect(thirdNextCalled).toBe(true)
    })

    test('replays error status from first request to waiting requests', async () => {
        const middleware = createRefreshTokenDeduplicator()
        const cookies = {'cc-nx_testsite': 'rt-error'}

        // First request
        const req1 = makeReq({cookies})
        const res1 = makeRes()
        const nextPromise = new Promise((resolve) => {
            middleware(req1, res1, resolve)
        })
        await nextPromise

        // Second request (deduplicated)
        const req2 = makeReq({cookies})
        const res2 = makeRes()
        middleware(req2, res2, () => {})

        // First request completes with 401 error
        res1.statusCode = 401
        res1.set('content-type', 'application/json')
        res1.end(Buffer.from('{"message":"invalid refresh_token"}'))

        await new Promise((r) => setTimeout(r, 0))

        // Second response should get the same 401
        expect(res2.status).toHaveBeenCalledWith(401)
        expect(res2.end).toHaveBeenCalledWith(Buffer.from('{"message":"invalid refresh_token"}'))
    })

    test('replays content-type header from first request', async () => {
        const middleware = createRefreshTokenDeduplicator()
        const cookies = {'cc-nx_testsite': 'rt-ct'}

        const req1 = makeReq({cookies})
        const res1 = makeRes()
        await new Promise((resolve) => {
            middleware(req1, res1, resolve)
        })

        const req2 = makeReq({cookies})
        const res2 = makeRes()
        middleware(req2, res2, () => {})

        res1.statusCode = 200
        res1.set('content-type', 'application/json; charset=utf-8')
        res1.end('{}')

        await new Promise((r) => setTimeout(r, 0))

        expect(res2.set).toHaveBeenCalledWith('content-type', 'application/json; charset=utf-8')
    })

    test('skips replay if headersSent is true on waiting response', async () => {
        const middleware = createRefreshTokenDeduplicator()
        const cookies = {'cc-nx_testsite': 'rt-sent'}

        const req1 = makeReq({cookies})
        const res1 = makeRes()
        await new Promise((resolve) => {
            middleware(req1, res1, resolve)
        })

        const req2 = makeReq({cookies})
        const res2 = makeRes()
        res2.headersSent = true // Simulate already-sent response
        middleware(req2, res2, () => {})

        res1.statusCode = 200
        res1.end('ok')

        await new Promise((r) => setTimeout(r, 0))

        // res2.status should NOT have been called since headersSent was true
        expect(res2.status).not.toHaveBeenCalled()
    })
})
