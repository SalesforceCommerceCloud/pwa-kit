/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    ATTRIBUTION_COOKIE_NAME,
    LANDING_PARAM_ALLOWLIST,
    REFERRER_PARAM_ALLOWLIST,
    ATTRIBUTION_COOKIE_MAX_AGE_SECONDS,
    MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH,
    buildSanitizedReferrer,
    buildAttributionValue,
    serializeAttributionCookie,
    captureAttribution,
    clearAttribution
} from '@salesforce/retail-react-app/app/utils/attribution-utils'

// The current query string for buildAttributionValue tests (accepts a URLSearchParams).
const params = (qs) => new URLSearchParams(qs)

describe('attribution-utils constants', () => {
    test('cookie name matches the agreed contract', () => {
        expect(ATTRIBUTION_COOKIE_NAME).toBe('dw_attribution')
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

    test('cookie TTL is the agreed 30 minutes', () => {
        expect(ATTRIBUTION_COOKIE_MAX_AGE_SECONDS).toBe(30 * 60)
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

    test('keeps the origin and path for an external referrer with no attribution params', () => {
        expect(buildSanitizedReferrer('https://blog.com/post', 'shop.example.com')).toBe(
            'https://blog.com/post'
        )
    })

    test('normalizes a bare origin to a trailing-slash path', () => {
        // `new URL('https://blog.com').pathname` is '/', so a path is always present.
        expect(buildSanitizedReferrer('https://blog.com', 'shop.example.com')).toBe(
            'https://blog.com/'
        )
    })

    test('keeps the path verbatim (the referrer path is part of the attribution signal)', () => {
        // The path is retained (Andrew's decision — it is signal ECOM emits as
        // sessionReferrer). PII minimization is by the query allowlist, not by dropping the
        // path; free-text query params are still dropped below.
        expect(
            buildSanitizedReferrer(
                'https://blog.com/campaigns/spring-sale?utm_source=news',
                'shop.example.com'
            )
        ).toBe('https://blog.com/campaigns/spring-sale?utm_source=news')
        expect(buildSanitizedReferrer('https://blog.com/authors/jane', 'shop.example.com')).toBe(
            'https://blog.com/authors/jane'
        )
    })

    test('keeps only the allowlisted attribution params from the referrer (path kept)', () => {
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

    test('drops credentials (userinfo) from the referrer but keeps the path', () => {
        expect(
            buildSanitizedReferrer(
                'https://user:pass@blog.com/post?utm_source=news',
                'shop.example.com'
            )
        ).toBe('https://blog.com/post?utm_source=news')
    })

    test('preserves the port on the origin (path kept)', () => {
        expect(buildSanitizedReferrer('https://blog.com:8443/post', 'shop.example.com')).toBe(
            'https://blog.com:8443/post'
        )
    })
})

describe('buildAttributionValue', () => {
    test('reproduces the agreed contract example exactly', () => {
        const value = buildAttributionValue({
            searchParams: params('utm_source=google&utm_medium=cpc&gclid=abc123'),
            referer: 'https://blog.com/post?utm_source=news',
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe(
            'utm_source=google&utm_medium=cpc&gclid=abc123&ref=https%3A%2F%2Fblog.com%2Fpost%3Futm_source%3Dnews'
        )
    })

    test('returns empty string when there is nothing to attribute', () => {
        expect(
            buildAttributionValue({searchParams: params(''), requestHostname: 'shop.example.com'})
        ).toBe('')
        expect(buildAttributionValue()).toBe('')
    })

    test('captures landing params only when there is no usable referrer', () => {
        const value = buildAttributionValue({
            searchParams: params('utm_source=google&utm_campaign=summer'),
            referer: 'https://shop.example.com/home', // same-origin -> dropped
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('utm_source=google&utm_campaign=summer')
    })

    test('captures ref only when the landing URL has no attribution params', () => {
        const value = buildAttributionValue({
            searchParams: params(''),
            referer: 'https://blog.com/post?utm_source=news',
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('ref=https%3A%2F%2Fblog.com%2Fpost%3Futm_source%3Dnews')
    })

    test('captures fbclid and msclkid from the landing URL (where paid social/Bing put them)', () => {
        const value = buildAttributionValue({
            searchParams: params('fbclid=fb123&msclkid=ms456'),
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('fbclid=fb123&msclkid=ms456')
    })

    test('ignores non-allowlisted landing params', () => {
        const value = buildAttributionValue({
            searchParams: params(
                'utm_source=google&email=shopper%40example.com&sessionToken=secret'
            ),
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('utm_source=google')
    })

    test('preserves allowlist ordering regardless of query order', () => {
        const value = buildAttributionValue({
            searchParams: params('gclid=abc&utm_medium=cpc&utm_source=google'),
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('utm_source=google&utm_medium=cpc&gclid=abc')
    })

    test('takes the first value of a repeated query param', () => {
        const value = buildAttributionValue({
            searchParams: params('utm_source=google&utm_source=bing'),
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('utm_source=google')
    })

    test('ignores bracket-notation params (no key collision, no "[object Object]")', () => {
        const value = buildAttributionValue({
            searchParams: params('utm_source%5Bx%5D=y&utm_medium=cpc'),
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('utm_medium=cpc')
        expect(value).not.toContain('object Object')
    })

    test('drops ref first when the value exceeds the length cap', () => {
        // ref is dropped before the landing params (it is the longest component and the
        // current URL's own params are the primary signal).
        const longVal = 'a'.repeat(MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH + 100)
        const value = buildAttributionValue({
            searchParams: params('utm_source=google'),
            referer: `https://blog.com/post?utm_content=${longVal}`,
            requestHostname: 'shop.example.com'
        })
        expect(value).toBe('utm_source=google')
        expect(value.length).toBeLessThanOrEqual(MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH)
    })

    test('never exceeds the length cap even when a single landing param is huge', () => {
        const value = buildAttributionValue({
            searchParams: params(
                `utm_source=${'x'.repeat(MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH + 500)}`
            ),
            requestHostname: 'shop.example.com'
        })
        expect(value.length).toBeLessThanOrEqual(MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH)
    })

    test('percent-encodes hostile characters so no cookie/header separators survive', () => {
        const hostile = 'a; Domain=evil.com\r\nSet-Cookie: pwned=1, b=c'
        const value = buildAttributionValue({
            searchParams: new URLSearchParams([['utm_source', hostile]]),
            requestHostname: 'shop.example.com'
        })
        // The raw separators that would let a value break out of the cookie or inject a
        // header must not appear unencoded in the serialized value.
        expect(value).not.toMatch(/[;\r\n]/)
        // And it must round-trip back to the original (lossless, just encoded).
        expect(new URLSearchParams(value).get('utm_source')).toBe(hostile)
    })
})

describe('serializeAttributionCookie', () => {
    test('serializes the write attributes for a first-touch cookie', () => {
        const cookie = serializeAttributionCookie('utm_source=google', {
            maxAge: ATTRIBUTION_COOKIE_MAX_AGE_SECONDS,
            secure: true
        })
        expect(cookie).toContain('dw_attribution=utm_source=google')
        expect(cookie).toContain(`Max-Age=${ATTRIBUTION_COOKIE_MAX_AGE_SECONDS}`)
        expect(cookie).toContain('Path=/')
        expect(cookie).toContain('SameSite=Lax')
        expect(cookie).toContain('Secure')
    })

    test('omits Secure when the page is not served over HTTPS', () => {
        const cookie = serializeAttributionCookie('utm_source=google', {
            maxAge: ATTRIBUTION_COOKIE_MAX_AGE_SECONDS,
            secure: false
        })
        expect(cookie).not.toContain('Secure')
    })

    test('adds the Domain attribute when a valid cookieDomain is configured', () => {
        const cookie = serializeAttributionCookie('utm_source=google', {
            maxAge: ATTRIBUTION_COOKIE_MAX_AGE_SECONDS,
            cookieDomain: '.example.com'
        })
        expect(cookie).toContain('Domain=.example.com')
    })

    test('ignores an invalid cookieDomain and falls back to a host-scoped cookie', () => {
        // Wildcards and separators are rejected by the runtime's shared validation; a stray
        // `;` could otherwise be read as an extra cookie attribute.
        const logger = {warn: jest.fn()}
        const cookie = serializeAttributionCookie('utm_source=google', {
            maxAge: ATTRIBUTION_COOKIE_MAX_AGE_SECONDS,
            cookieDomain: '*.evil.com; Path=/',
            logger
        })
        expect(cookie).not.toContain('Domain=')
    })

    test('emits Max-Age=0 for a deletion', () => {
        const cookie = serializeAttributionCookie('', {maxAge: 0})
        expect(cookie).toContain('dw_attribution=;')
        expect(cookie).toContain('Max-Age=0')
        expect(cookie).toContain('Path=/')
    })
})

describe('captureAttribution / clearAttribution (client cookie I/O)', () => {
    // A campaign-entry landing: utm params on the URL + an external referrer.
    const campaign = (overrides = {}) => ({
        search: '?utm_source=google&utm_medium=cpc&gclid=abc123',
        referer: 'https://blog.com/post?utm_source=news',
        hostname: 'shop.example.com',
        // jsdom's document URL is http://localhost, so a Secure cookie would be dropped by
        // the cookie jar; write a non-Secure cookie in tests so we can read it back.
        secure: false,
        ...overrides
    })

    // Expire any cookie left by a previous test so write-once starts clean each time.
    beforeEach(() => {
        document.cookie = `${ATTRIBUTION_COOKIE_NAME}=; Max-Age=0; Path=/`
    })

    test('writes the first-touch cookie verbatim for a campaign-entry request', () => {
        captureAttribution(campaign())

        expect(document.cookie).toContain(
            'dw_attribution=utm_source=google&utm_medium=cpc&gclid=abc123&ref=https%3A%2F%2Fblog.com%2Fpost%3Futm_source%3Dnews'
        )
    })

    test('does not overwrite an existing attribution cookie (first touch wins)', () => {
        document.cookie = `${ATTRIBUTION_COOKIE_NAME}=utm_source=facebook; Path=/`

        captureAttribution(campaign())

        expect(document.cookie).toContain('dw_attribution=utm_source=facebook')
        expect(document.cookie).not.toContain('utm_source=google')
    })

    test('captures a sanitized referrer when there is no landing param', () => {
        captureAttribution(campaign({search: ''}))

        expect(document.cookie).toContain(
            'dw_attribution=ref=https%3A%2F%2Fblog.com%2Fpost%3Futm_source%3Dnews'
        )
    })

    test('leaves ordinary (non-campaign) traffic untouched', () => {
        captureAttribution(campaign({search: '', referer: ''}))

        expect(document.cookie).not.toContain('dw_attribution=')
    })

    test('does not throw and writes nothing when capture inputs are hostile', () => {
        // Fails open: even if buildAttributionValue produced something odd, capture must not
        // throw. A malformed referer is simply ignored.
        expect(() => captureAttribution(campaign({referer: 'not a url', search: ''}))).not.toThrow()
        expect(document.cookie).not.toContain('dw_attribution=')
    })

    test('clearAttribution expires an existing cookie', () => {
        document.cookie = `${ATTRIBUTION_COOKIE_NAME}=utm_source=old; Path=/`
        expect(document.cookie).toContain('dw_attribution=utm_source=old')

        clearAttribution({secure: false})

        expect(document.cookie).not.toContain('dw_attribution=')
    })
})
