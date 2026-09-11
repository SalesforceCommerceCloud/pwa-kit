/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Integration tests for the `dw_attribution` middleware through a REAL Express app and
 * a real HTTP round-trip. The unit tests use a fake `res`; these cover the behaviour
 * that only shows up end-to-end through Express' header machinery:
 *
 *   1. `Cache-Control: no-store` still wins when a downstream handler — standing in for
 *      the home/PLP/PDP page components — sets a cacheable `s-maxage` AFTER the
 *      middleware runs. Without the flush-time enforcement, that per-visit cookie would
 *      be shared-cached and replayed to other shoppers. This holds even when an upstream
 *      middleware has already wrapped `res.setHeader` (the real runtime chain) and when
 *      headers are replayed as an object via `res.set({...})` (the cache-HIT path).
 *   2. Our appended `Set-Cookie` coexists with cookies a downstream handler sets.
 *   3. A hostile query value cannot inject a header or break out of the cookie.
 */

import http from 'http'
import express from 'express'
import {rest} from 'msw'
import {createAttributionCookieMiddleware} from '@salesforce/retail-react-app/app/utils/attribution-utils'

// These tests hit a real local Express server; let MSW pass those requests through
// (matched by host regardless of the ephemeral port) instead of logging them as
// unhandled. resetHandlers() runs after each test, so register per test.
beforeEach(() => {
    global.server.use(rest.all(/127\.0\.0\.1/, (req) => req.passthrough()))
})

// Stand in for a home/PLP/PDP page component: sets a cacheable Cache-Control during
// render (which, in the real app, runs after this middleware).
const cacheablePage = (req, res) => {
    res.set('Cache-Control', 's-maxage=900, stale-while-revalidate=900')
    res.send('ok')
}

const startServer = ({allowCookies = true, downstream = cacheablePage, preMiddleware} = {}) => {
    const app = express()
    // Mimic the pwa-kit runtime: cookie writes are gated on `req.app.options.allowCookies`.
    app.options = {allowCookies}
    const handlers = [createAttributionCookieMiddleware(), downstream]
    // Optionally install a middleware AHEAD of ours (mimicking the real runtime chain,
    // where encodeNonAsciiMiddleware / defaultPwaKitSecurityHeaders wrap res.setHeader
    // before us).
    if (preMiddleware) handlers.unshift(preMiddleware)
    app.get('*', ...handlers)
    return new Promise((resolve) => {
        const server = app.listen(0, '127.0.0.1', () => resolve(server))
    })
}

const get = (server, {path = '/?utm_source=google&utm_medium=cpc', headers = {}} = {}) => {
    const {port} = server.address()
    return new Promise((resolve, reject) => {
        http.get({host: '127.0.0.1', port, path, headers}, (res) => {
            const chunks = []
            res.on('data', (c) => chunks.push(c))
            res.on('end', () =>
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    setCookie: res.headers['set-cookie'] || [],
                    body: Buffer.concat(chunks).toString()
                })
            )
        }).on('error', reject)
    })
}

describe('createAttributionCookieMiddleware (integration)', () => {
    test('flushes Cache-Control: no-store even when the page sets a cacheable value after us', async () => {
        const server = await startServer({allowCookies: true})
        try {
            const res = await get(server)
            // The cookie was written...
            expect(res.setCookie.some((c) => c.startsWith('dw_attribution='))).toBe(true)
            // ...and no-store won over the downstream page's s-maxage.
            expect(res.headers['cache-control']).toBe('no-store')
        } finally {
            server.close()
        }
    })

    test('still forces no-store when an upstream middleware has already wrapped res.setHeader', async () => {
        // Mimic the real runtime chain: encodeNonAsciiMiddleware / defaultPwaKitSecurityHeaders
        // wrap res.setHeader (passing Cache-Control through) before our middleware runs.
        // forceNoStore must layer on top of that wrapper and still win.
        const securityHeadersLike = (req, res, next) => {
            const orig = res.setHeader.bind(res)
            // Pass everything (including Cache-Control) straight through, as the real
            // security/encoding middleware do.
            res.setHeader = function (name, value) {
                return orig(name, value)
            }
            res.setHeader('X-Marker', 'present')
            next()
        }
        const server = await startServer({allowCookies: true, preMiddleware: securityHeadersLike})
        try {
            const res = await get(server)
            expect(res.setCookie.some((c) => c.startsWith('dw_attribution='))).toBe(true)
            // The upstream wrapper's own header survives...
            expect(res.headers['x-marker']).toBe('present')
            // ...and no-store still wins through both layers.
            expect(res.headers['cache-control']).toBe('no-store')
        } finally {
            server.close()
        }
    })

    test('forces no-store even when headers are replayed as an object (cached-response path)', async () => {
        // Mimic the runtime cache-HIT path (cached-response.js), which restores stored
        // headers via `res.set(metadata.headers)` — the OBJECT form of res.set. Each key
        // must still route through the intercepted setHeader so Cache-Control is coerced.
        const replayCachedHeaders = (req, res) => {
            res.set({
                'Cache-Control': 's-maxage=900, stale-while-revalidate=900',
                'X-Cached': 'HIT'
            })
            res.send('ok')
        }
        const server = await startServer({allowCookies: true, downstream: replayCachedHeaders})
        try {
            const res = await get(server)
            expect(res.setCookie.some((c) => c.startsWith('dw_attribution='))).toBe(true)
            // Non-cache-control headers from the replayed object pass through untouched...
            expect(res.headers['x-cached']).toBe('HIT')
            // ...but the replayed cacheable Cache-Control is coerced to no-store.
            expect(res.headers['cache-control']).toBe('no-store')
        } finally {
            server.close()
        }
    })

    test('appends dw_attribution alongside a cookie a downstream handler sets', async () => {
        const downstream = (req, res) => {
            res.append('Set-Cookie', 'cc-nx-g=guest; Path=/; HttpOnly')
            res.set('Cache-Control', 's-maxage=900')
            res.send('ok')
        }
        const server = await startServer({allowCookies: true, downstream})
        try {
            const res = await get(server)
            const names = res.setCookie.map((c) => c.split('=')[0])
            expect(names).toContain('dw_attribution')
            expect(names).toContain('cc-nx-g')
            expect(res.headers['cache-control']).toBe('no-store')
        } finally {
            server.close()
        }
    })

    test('writes no cookie and leaves caching intact when the runtime disallows cookies', async () => {
        const server = await startServer({allowCookies: false})
        try {
            const res = await get(server)
            expect(res.setCookie.some((c) => c.startsWith('dw_attribution='))).toBe(false)
            // The downstream page's Cache-Control is untouched — the request stays cacheable.
            expect(res.headers['cache-control']).toBe('s-maxage=900, stale-while-revalidate=900')
        } finally {
            server.close()
        }
    })

    test('does not let a hostile query value inject a header or break out of the cookie', async () => {
        const server = await startServer({allowCookies: true})
        try {
            const payload = 'a\r\nSet-Cookie: pwned=1; Domain=evil.com'
            const res = await get(server, {path: `/?utm_source=${encodeURIComponent(payload)}`})

            // Exactly one Set-Cookie header — the CRLF did not spawn a second cookie.
            expect(res.setCookie).toHaveLength(1)
            const attr = res.setCookie[0]
            expect(attr.startsWith('dw_attribution=')).toBe(true)

            // The value segment (before the first `; ` attribute separator) carries the
            // payload percent-encoded, so the CRLF and `;` never act as separators.
            const [valueSegment, ...attributes] = attr.split('; ')
            expect(valueSegment).toContain('%0D%0A')
            expect(valueSegment).not.toMatch(/[\r\n]/)
            // No `Domain=evil.com` attribute leaked out of the payload.
            expect(attributes).not.toContain('Domain=evil.com')
        } finally {
            server.close()
        }
    })
})
