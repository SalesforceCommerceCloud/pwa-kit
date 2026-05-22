/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {tryWriteStorefrontPreviewMarker, readStorefrontPreviewMarker} from './preview-context'
import {STOREFRONT_PREVIEW_CTX_COOKIE, STOREFRONT_PREVIEW_PARENT_ALLOW_LIST} from './constants'

const TRUSTED_PARENT = 'https://runtime-admin-preview.mobify-storefront.com'

const makeReq = ({method = 'GET', headers = {}} = {}) => ({
    method,
    headers: {
        'sec-fetch-dest': 'iframe',
        'sec-fetch-site': 'cross-site',
        referer: `${TRUSTED_PARENT}/some/path`,
        ...headers
    }
})

const makeRes = () => {
    const setCookies = []
    return {
        append: jest.fn((header, value) => {
            if (header.toLowerCase() === 'set-cookie') {
                setCookies.push(value)
            }
        }),
        setCookies
    }
}

describe('tryWriteStorefrontPreviewMarker', () => {
    test('emits the marker when GET + iframe + cross-site + Referer is on the allow-list', () => {
        const req = makeReq()
        const res = makeRes()

        tryWriteStorefrontPreviewMarker(req, res, {})

        expect(res.setCookies).toHaveLength(1)
        const c = res.setCookies[0]
        expect(c).toContain(`${STOREFRONT_PREVIEW_CTX_COOKIE}=${TRUSTED_PARENT}`)
        expect(c).toContain('Path=/')
        expect(c).toContain('Secure')
        expect(c).toContain('HttpOnly')
        expect(c).toContain('SameSite=none')
        expect(c).toContain('Partitioned')
        // No Expires/Max-Age — session cookie.
        expect(c).not.toMatch(/Expires=/)
        expect(c).not.toMatch(/Max-Age=/)
    })

    test.each(STOREFRONT_PREVIEW_PARENT_ALLOW_LIST)(
        'emits the marker for trusted parent %s',
        (origin) => {
            const req = makeReq({headers: {referer: `${origin}/x`}})
            const res = makeRes()

            tryWriteStorefrontPreviewMarker(req, res, {})

            expect(res.setCookies).toHaveLength(1)
            expect(res.setCookies[0]).toContain(`=${origin}`)
        }
    )

    test('does nothing for POST', () => {
        const req = makeReq({method: 'POST'})
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res, {})
        expect(res.setCookies).toHaveLength(0)
    })

    test('does nothing when Sec-Fetch-Dest is not iframe', () => {
        const req = makeReq({headers: {'sec-fetch-dest': 'document'}})
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res, {})
        expect(res.setCookies).toHaveLength(0)
    })

    test('does nothing when Sec-Fetch-Site is same-origin', () => {
        const req = makeReq({headers: {'sec-fetch-site': 'same-origin'}})
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res, {})
        expect(res.setCookies).toHaveLength(0)
    })

    test('does nothing when Referer origin is not on the allow-list', () => {
        const req = makeReq({headers: {referer: 'https://evil.example.com/x'}})
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res, {})
        expect(res.setCookies).toHaveLength(0)
    })

    test('does nothing when Referer is missing', () => {
        const req = makeReq()
        delete req.headers.referer
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res, {})
        expect(res.setCookies).toHaveLength(0)
    })

    test('does nothing when Referer is unparseable', () => {
        const req = makeReq({headers: {referer: 'not-a-url'}})
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res, {})
        expect(res.setCookies).toHaveLength(0)
    })

    test('fails closed when Sec-Fetch-* headers are absent', () => {
        const req = {
            method: 'GET',
            headers: {referer: `${TRUSTED_PARENT}/x`}
        }
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res, {})
        expect(res.setCookies).toHaveLength(0)
    })

    test('includes Domain when commerceAPI.cookieDomain is configured', () => {
        const req = makeReq()
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res, {
            mobify: {app: {commerceAPI: {cookieDomain: '.example.com'}}}
        })
        expect(res.setCookies[0]).toContain('Domain=.example.com')
    })

    test('omits Domain when cookieDomain is malformed', () => {
        const req = makeReq()
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res, {
            mobify: {app: {commerceAPI: {cookieDomain: 'bad domain'}}}
        })
        expect(res.setCookies[0]).not.toContain('Domain=')
    })
})

describe('readStorefrontPreviewMarker', () => {
    test('returns undefined when cookie header is absent', () => {
        expect(readStorefrontPreviewMarker({headers: {}})).toBeUndefined()
    })

    test('returns the validated origin when the cookie value is on the allow-list', () => {
        const req = {
            headers: {cookie: `${STOREFRONT_PREVIEW_CTX_COOKIE}=${TRUSTED_PARENT}`}
        }
        expect(readStorefrontPreviewMarker(req)).toBe(TRUSTED_PARENT)
    })

    test('returns undefined when the cookie value is not on the allow-list', () => {
        const req = {
            headers: {
                cookie: `${STOREFRONT_PREVIEW_CTX_COOKIE}=https://evil.example.com`
            }
        }
        expect(readStorefrontPreviewMarker(req)).toBeUndefined()
    })

    test('returns undefined when the marker cookie is absent but other cookies present', () => {
        const req = {headers: {cookie: 'foo=bar; baz=qux'}}
        expect(readStorefrontPreviewMarker(req)).toBeUndefined()
    })
})
