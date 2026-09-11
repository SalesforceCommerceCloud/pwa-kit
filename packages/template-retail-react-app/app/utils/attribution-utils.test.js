/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    ATTRIBUTION_COOKIE_NAME,
    DNT_COOKIE_NAME,
    LANDING_PARAM_ALLOWLIST,
    REFERRER_PARAM_ALLOWLIST,
    ATTRIBUTION_COOKIE_MAX_AGE_SECONDS,
    MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH,
    getCookie,
    buildSanitizedReferrer,
    buildAttributionValue,
    createAttributionCookieMiddleware
} from '@salesforce/retail-react-app/app/utils/attribution-utils'

describe('attribution-utils constants', () => {
    test('cookie and DNT names match the agreed contract', () => {
        expect(ATTRIBUTION_COOKIE_NAME).toBe('dw_attribution')
        expect(DNT_COOKIE_NAME).toBe('dw_dnt')
    })

    test('landing allowlist is the agreed utm params plus the three ad-network click IDs', () => {
        expect(LANDING_PARAM_ALLOWLIST).toEqual([
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_term',
            'utm_content',
            'gclid',
            'fbclid',
            'msclkid'
        ])
    })

    test('referrer allowlist matches the landing allowlist', () => {
        expect(REFERRER_PARAM_ALLOWLIST).toEqual(LANDING_PARAM_ALLOWLIST)
    })
})

describe('getCookie', () => {
    test('returns null when there is no cookie header', () => {
        expect(getCookie({headers: {}}, 'dw_attribution')).toBeNull()
        expect(getCookie({}, 'dw_attribution')).toBeNull()
        expect(getCookie(undefined, 'dw_attribution')).toBeNull()
    })

    test('returns the value of a present cookie', () => {
        const req = {headers: {cookie: 'foo=bar; dw_dnt=1; other=x'}}
        expect(getCookie(req, 'dw_dnt')).toBe('1')
        expect(getCookie(req, 'foo')).toBe('bar')
        expect(getCookie(req, 'other')).toBe('x')
    })

    test('returns null for an absent cookie', () => {
        const req = {headers: {cookie: 'foo=bar'}}
        expect(getCookie(req, 'dw_attribution')).toBeNull()
    })

    test('does not match on a name prefix (requires an exact name= match)', () => {
        const req = {headers: {cookie: 'dw_dnt_other=1'}}
        expect(getCookie(req, 'dw_dnt')).toBeNull()
    })

    test('URL-decodes the cookie value', () => {
        const req = {headers: {cookie: 'dw_attribution=utm_source%3Dgoogle'}}
        expect(getCookie(req, 'dw_attribution')).toBe('utm_source=google')
    })

    test('returns the raw value when percent-decoding fails', () => {
        const req = {headers: {cookie: 'dw_attribution=%E0%A4%A'}}
        expect(getCookie(req, 'dw_attribution')).toBe('%E0%A4%A')
    })
})

describe('buildSanitizedReferrer', () => {
    test('returns empty string when there is no referrer', () => {
        expect(buildSanitizedReferrer(undefined, 'shop.example.com')).toBe('')
        expect(buildSanitizedReferrer('', 'shop.example.com')).toBe('')
    })

    test('returns empty string for a malformed referrer', () => {
        expect(buildSanitizedReferrer('not a url', 'shop.example.com')).toBe('')
    })

    test('drops non-http(s) referrers', () => {
        expect(buildSanitizedReferrer('android-app://com.google.android', 'shop.example.com')).toBe(
            ''
        )
    })

    test('drops a same-origin referrer (internal navigation is not attribution)', () => {
        expect(
            buildSanitizedReferrer('https://shop.example.com/category/shoes', 'shop.example.com')
        ).toBe('')
    })

    test('keeps origin + path for an external referrer with no attribution params', () => {
        expect(buildSanitizedReferrer('https://blog.com/post', 'shop.example.com')).toBe(
            'https://blog.com/post'
        )
    })

    test('keeps only the allowlisted attribution params from the referrer', () => {
        const referrer = 'https://blog.com/post?utm_source=news&freeText=secret&fbclid=xyz'
        expect(buildSanitizedReferrer(referrer, 'shop.example.com')).toBe(
            'https://blog.com/post?utm_source=news&fbclid=xyz'
        )
    })

    test('drops the fragment', () => {
        expect(
            buildSanitizedReferrer(
                'https://blog.com/post?utm_source=news#section',
                'shop.example.com'
            )
        ).toBe('https://blog.com/post?utm_source=news')
    })

    test('drops credentials (userinfo) from the referrer', () => {
        expect(
            buildSanitizedReferrer(
                'https://user:pass@blog.com/post?utm_source=news',
                'shop.example.com'
            )
        ).toBe('https://blog.com/post?utm_source=news')
    })

    test('preserves the port on the origin', () => {
        expect(buildSanitizedReferrer('https://blog.com:8443/post', 'shop.example.com')).toBe(
            'https://blog.com:8443/post'
        )
    })
})

describe('buildAttributionValue', () => {
    test('reproduces the agreed contract example exactly', () => {
        const value = buildAttributionValue({
            query: {utm_source: 'google', utm_medium: 'cpc', gclid: 'abc123'},
            referer: 'https://blog.com/post?utm_source=news',
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe(
            'utm_source=google&utm_medium=cpc&gclid=abc123&ref=https%3A%2F%2Fblog.com%2Fpost%3Futm_source%3Dnews'
        )
    })

    test('returns empty string when there is nothing to attribute', () => {
        expect(buildAttributionValue({query: {}, requestHostname: 'shop.example.com'})).toBe('')
        expect(buildAttributionValue()).toBe('')
    })

    test('captures landing params only when there is no usable referrer', () => {
        const value = buildAttributionValue({
            query: {utm_source: 'google', utm_campaign: 'summer'},
            referer: 'https://shop.example.com/home', // same-origin -> dropped
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('utm_source=google&utm_campaign=summer')
    })

    test('captures ref only when the landing URL has no attribution params', () => {
        const value = buildAttributionValue({
            query: {},
            referer: 'https://blog.com/post?utm_source=news',
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('ref=https%3A%2F%2Fblog.com%2Fpost%3Futm_source%3Dnews')
    })

    test('captures fbclid and msclkid from the landing URL (where paid social/Bing put them)', () => {
        const value = buildAttributionValue({
            query: {fbclid: 'fb123', msclkid: 'ms456'},
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('fbclid=fb123&msclkid=ms456')
    })

    test('ignores non-allowlisted landing params', () => {
        const value = buildAttributionValue({
            query: {utm_source: 'google', email: 'shopper@example.com', sessionToken: 'secret'},
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('utm_source=google')
    })

    test('preserves allowlist ordering regardless of query order', () => {
        const value = buildAttributionValue({
            query: {gclid: 'abc', utm_medium: 'cpc', utm_source: 'google'},
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('utm_source=google&utm_medium=cpc&gclid=abc')
    })

    test('takes the first value of a repeated query param', () => {
        const value = buildAttributionValue({
            query: {utm_source: ['google', 'bing']},
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('utm_source=google')
    })

    test('drops ref first when the value exceeds the length cap', () => {
        const longRefPath = '/'.padEnd(MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH + 100, 'a')
        const value = buildAttributionValue({
            query: {utm_source: 'google'},
            referer: `https://blog.com${longRefPath}`,
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('utm_source=google')
        expect(value.length).toBeLessThanOrEqual(MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH)
    })

    test('never exceeds the length cap even when a single landing param is huge', () => {
        const value = buildAttributionValue({
            query: {utm_source: 'x'.repeat(MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH + 500)},
            requestHostname: 'shop.example.com'
        })
        expect(value.length).toBeLessThanOrEqual(MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH)
    })

    test('percent-encodes hostile characters so no cookie/header separators survive', () => {
        const hostile = 'a; Domain=evil.com\r\nSet-Cookie: pwned=1, b=c'
        const value = buildAttributionValue({
            query: {utm_source: hostile},
            requestHostname: 'shop.example.com'
        })
        // The raw separators that would let a value break out of the cookie or inject a
        // header must not appear unencoded in the serialized value.
        expect(value).not.toMatch(/[;\r\n]/)
        // And it must round-trip back to the original (lossless, just encoded).
        expect(new URLSearchParams(value).get('utm_source')).toBe(hostile)
    })

    test('ignores object/bracket-notation query params (no "[object Object]")', () => {
        // `?utm_source[x]=y` parses to an object under Express' qs parser.
        const value = buildAttributionValue({
            query: {utm_source: {x: 'y'}, utm_medium: 'cpc'},
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('utm_medium=cpc')
        expect(value).not.toContain('object Object')
    })
})

describe('createAttributionCookieMiddleware', () => {
    const makeReq = (overrides = {}) => {
        const headers = overrides.headers || {}
        return {
            app: {options: {allowCookies: true}},
            headers,
            query: {},
            hostname: 'shop.example.com',
            // Mimic Express req.get (case-insensitive header lookup).
            get: (name) => headers[String(name).toLowerCase()],
            ...overrides
        }
    }

    // A minimal Express-like response with a REAL header map. Asserting on the final
    // header (after the middleware's setHeader interception) is what matters — merely
    // asserting `res.set('Cache-Control','no-store')` was *called* would pass even if a
    // later render overwrote it, which is exactly the bug this feature must avoid.
    const makeRes = () => {
        const headers = {}
        return {
            append: jest.fn(),
            setHeader(name, value) {
                headers[String(name).toLowerCase()] = value
            },
            getHeader(name) {
                return headers[String(name).toLowerCase()]
            },
            // Express `res.set` routes through `setHeader`; page components use `res.set`.
            set(name, value) {
                this.setHeader(name, value)
                return this
            }
        }
    }

    test('writes the cookie and disables caching for a campaign-entry request', () => {
        const req = makeReq({
            query: {utm_source: 'google', utm_medium: 'cpc', gclid: 'abc123'},
            headers: {referer: 'https://blog.com/post?utm_source=news'}
        })
        const res = makeRes()
        const next = jest.fn()

        createAttributionCookieMiddleware()(req, res, next)

        expect(res.append).toHaveBeenCalledTimes(1)
        const [header, cookie] = res.append.mock.calls[0]
        expect(header).toBe('Set-Cookie')
        // Value is the agreed contract string, stored verbatim.
        expect(cookie).toContain(
            'dw_attribution=utm_source=google&utm_medium=cpc&gclid=abc123&ref=https%3A%2F%2Fblog.com%2Fpost%3Futm_source%3Dnews'
        )
        expect(cookie).toContain('Path=/')
        expect(cookie).toContain(`Max-Age=${ATTRIBUTION_COOKIE_MAX_AGE_SECONDS}`)
        expect(cookie).toContain('Secure')
        expect(cookie).toContain('HttpOnly')
        expect(cookie).toContain('SameSite=Lax')
        expect(cookie).not.toContain('Domain=')

        // Per-visit cookie => response must not be cached.
        expect(res.getHeader('Cache-Control')).toBe('no-store')
        expect(next).toHaveBeenCalledTimes(1)
    })

    test('keeps no-store even when a later render sets a cacheable Cache-Control', () => {
        // Reproduces the home/PLP/PDP behaviour: the page component sets a cacheable
        // Cache-Control via res.set() AFTER this middleware has run. no-store must win,
        // or the per-visit cookie gets shared-cached and replayed to other shoppers.
        const req = makeReq({query: {utm_source: 'google'}})
        const res = makeRes()

        createAttributionCookieMiddleware()(req, res, jest.fn())

        // Simulate the page component during render.
        res.set('Cache-Control', 's-maxage=900, stale-while-revalidate=900')

        expect(res.getHeader('Cache-Control')).toBe('no-store')
    })

    test('adds the Domain attribute when a cookieDomain is configured', () => {
        const req = makeReq({query: {utm_source: 'google'}})
        const res = makeRes()

        createAttributionCookieMiddleware({cookieDomain: '.example.com'})(req, res, jest.fn())

        expect(res.append.mock.calls[0][1]).toContain('Domain=.example.com')
    })

    test('does nothing when the runtime does not allow cookies', () => {
        const req = makeReq({
            app: {options: {allowCookies: false}},
            query: {utm_source: 'google'}
        })
        const res = makeRes()
        const next = jest.fn()

        createAttributionCookieMiddleware()(req, res, next)

        expect(res.append).not.toHaveBeenCalled()
        // Must not disable caching when it isn't even writing a cookie: a later page
        // Cache-Control set is left intact (no interception installed).
        res.set('Cache-Control', 's-maxage=900')
        expect(res.getHeader('Cache-Control')).toBe('s-maxage=900')
        expect(next).toHaveBeenCalledTimes(1)
    })

    test('does not overwrite an existing attribution cookie (first touch wins)', () => {
        const req = makeReq({
            query: {utm_source: 'google'},
            headers: {cookie: 'dw_attribution=utm_source=facebook'}
        })
        const res = makeRes()
        const next = jest.fn()

        createAttributionCookieMiddleware()(req, res, next)

        expect(res.append).not.toHaveBeenCalled()
        expect(res.getHeader('Cache-Control')).toBeUndefined()
        expect(next).toHaveBeenCalledTimes(1)
    })

    test('honours Do Not Track (dw_dnt=1)', () => {
        const req = makeReq({
            query: {utm_source: 'google'},
            headers: {cookie: 'dw_dnt=1'}
        })
        const res = makeRes()
        const next = jest.fn()

        createAttributionCookieMiddleware()(req, res, next)

        expect(res.append).not.toHaveBeenCalled()
        expect(res.getHeader('Cache-Control')).toBeUndefined()
        expect(next).toHaveBeenCalledTimes(1)
    })

    test('leaves ordinary (non-campaign) traffic untouched and cacheable', () => {
        const req = makeReq() // no query params, no referer
        const res = makeRes()
        const next = jest.fn()

        createAttributionCookieMiddleware()(req, res, next)

        expect(res.append).not.toHaveBeenCalled()
        expect(res.getHeader('Cache-Control')).toBeUndefined()
        expect(next).toHaveBeenCalledTimes(1)
    })

    test('reads the referrer from req.get when there is no landing param', () => {
        const req = makeReq({
            headers: {referer: 'https://blog.com/post?utm_source=news'}
        })
        const res = makeRes()

        createAttributionCookieMiddleware()(req, res, jest.fn())

        expect(res.append.mock.calls[0][1]).toContain(
            'dw_attribution=ref=https%3A%2F%2Fblog.com%2Fpost%3Futm_source%3Dnews'
        )
    })

    test('fails open (calls next, no throw) when writing the cookie throws', () => {
        const req = makeReq({query: {utm_source: 'google'}})
        const res = makeRes()
        res.append = jest.fn(() => {
            throw new Error('boom')
        })
        const next = jest.fn()
        const logger = {warn: jest.fn()}

        expect(() => createAttributionCookieMiddleware({logger})(req, res, next)).not.toThrow()
        expect(logger.warn).toHaveBeenCalledTimes(1)
        expect(next).toHaveBeenCalledTimes(1)
    })
})
