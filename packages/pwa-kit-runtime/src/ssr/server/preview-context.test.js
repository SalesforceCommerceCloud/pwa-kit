/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fs from 'fs'
import * as path from 'path'
import {
    tryWriteStorefrontPreviewMarker,
    readStorefrontPreviewMarker,
    readTrustedPreviewParentHeader,
    isTrustedPreviewRequest
} from './preview-context'
import {
    STOREFRONT_PREVIEW_CTX_COOKIE,
    STOREFRONT_PREVIEW_PARENT_ALLOW_LIST,
    X_PREVIEW_PARENT
} from './constants'

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

        tryWriteStorefrontPreviewMarker(req, res)

        expect(res.setCookies).toHaveLength(1)
        const c = res.setCookies[0]
        expect(c).toContain(`${STOREFRONT_PREVIEW_CTX_COOKIE}=${TRUSTED_PARENT}`)
        expect(c).toContain('Path=/')
        expect(c).toContain('Secure')
        expect(c).toContain('HttpOnly')
        expect(c).toContain('SameSite=none')
        expect(c).toContain('Partitioned')
        // The cookie name carries the `__Host-` prefix, which the browser
        // refuses to set with a Domain attribute. Defense in depth: assert
        // we never emit one.
        expect(c).not.toMatch(/Domain=/i)
        // No Expires/Max-Age — session cookie.
        expect(c).not.toMatch(/Expires=/)
        expect(c).not.toMatch(/Max-Age=/)
    })

    test('emits the marker when Sec-Fetch-Site is same-site (non-prod RA testing where parent and storefront share an eTLD+1)', () => {
        const req = makeReq({headers: {'sec-fetch-site': 'same-site'}})
        const res = makeRes()

        tryWriteStorefrontPreviewMarker(req, res)

        expect(res.setCookies).toHaveLength(1)
        expect(res.setCookies[0]).toContain(`${STOREFRONT_PREVIEW_CTX_COOKIE}=${TRUSTED_PARENT}`)
    })

    test.each(STOREFRONT_PREVIEW_PARENT_ALLOW_LIST)(
        'emits the marker for trusted parent %s',
        (origin) => {
            const req = makeReq({headers: {referer: `${origin}/x`}})
            const res = makeRes()

            tryWriteStorefrontPreviewMarker(req, res)

            expect(res.setCookies).toHaveLength(1)
            expect(res.setCookies[0]).toContain(`=${origin}`)
        }
    )

    test('does nothing for POST', () => {
        const req = makeReq({method: 'POST'})
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res)
        expect(res.setCookies).toHaveLength(0)
    })

    test('does nothing when Sec-Fetch-Dest is not iframe', () => {
        const req = makeReq({headers: {'sec-fetch-dest': 'document'}})
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res)
        expect(res.setCookies).toHaveLength(0)
    })

    test('does nothing when Sec-Fetch-Site is same-origin', () => {
        const req = makeReq({headers: {'sec-fetch-site': 'same-origin'}})
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res)
        expect(res.setCookies).toHaveLength(0)
    })

    test('does nothing when Sec-Fetch-Site is none (top-level navigation)', () => {
        const req = makeReq({headers: {'sec-fetch-site': 'none'}})
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res)
        expect(res.setCookies).toHaveLength(0)
    })

    test('does nothing when Referer origin is not on the allow-list', () => {
        const req = makeReq({headers: {referer: 'https://evil.example.com/x'}})
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res)
        expect(res.setCookies).toHaveLength(0)
    })

    test('does nothing when Referer is missing', () => {
        const req = makeReq()
        delete req.headers.referer
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res)
        expect(res.setCookies).toHaveLength(0)
    })

    test('does nothing when Referer is unparseable', () => {
        const req = makeReq({headers: {referer: 'not-a-url'}})
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res)
        expect(res.setCookies).toHaveLength(0)
    })

    test('fails closed when Sec-Fetch-* headers are absent', () => {
        const req = {
            method: 'GET',
            headers: {referer: `${TRUSTED_PARENT}/x`}
        }
        const res = makeRes()
        tryWriteStorefrontPreviewMarker(req, res)
        expect(res.setCookies).toHaveLength(0)
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

describe('readTrustedPreviewParentHeader', () => {
    test('returns undefined when the header is absent', () => {
        expect(readTrustedPreviewParentHeader({headers: {}})).toBeUndefined()
    })

    test('returns the validated origin when the header value is on the allow-list', () => {
        const req = {headers: {[X_PREVIEW_PARENT]: TRUSTED_PARENT}}
        expect(readTrustedPreviewParentHeader(req)).toBe(TRUSTED_PARENT)
    })

    test.each(STOREFRONT_PREVIEW_PARENT_ALLOW_LIST)(
        'returns the origin for trusted parent %s',
        (origin) => {
            const req = {headers: {[X_PREVIEW_PARENT]: origin}}
            expect(readTrustedPreviewParentHeader(req)).toBe(origin)
        }
    )

    test('returns undefined when the header value is not on the allow-list', () => {
        const req = {headers: {[X_PREVIEW_PARENT]: 'https://evil.example.com'}}
        expect(readTrustedPreviewParentHeader(req)).toBeUndefined()
    })

    test('returns undefined when the header value is empty', () => {
        const req = {headers: {[X_PREVIEW_PARENT]: ''}}
        expect(readTrustedPreviewParentHeader(req)).toBeUndefined()
    })
})

describe('isTrustedPreviewRequest', () => {
    test('true when only the marker cookie is present', () => {
        const req = {headers: {cookie: `${STOREFRONT_PREVIEW_CTX_COOKIE}=${TRUSTED_PARENT}`}}
        expect(isTrustedPreviewRequest(req)).toBe(true)
    })

    test('true when only the client header is present (CDN cache bypasses the marker)', () => {
        const req = {headers: {[X_PREVIEW_PARENT]: TRUSTED_PARENT}}
        expect(isTrustedPreviewRequest(req)).toBe(true)
    })

    test('true when both signals are present', () => {
        const req = {
            headers: {
                cookie: `${STOREFRONT_PREVIEW_CTX_COOKIE}=${TRUSTED_PARENT}`,
                [X_PREVIEW_PARENT]: TRUSTED_PARENT
            }
        }
        expect(isTrustedPreviewRequest(req)).toBe(true)
    })

    test('false when neither signal is present', () => {
        expect(isTrustedPreviewRequest({headers: {}})).toBe(false)
    })

    test('false when both signals carry untrusted values', () => {
        const req = {
            headers: {
                cookie: `${STOREFRONT_PREVIEW_CTX_COOKIE}=https://evil.example.com`,
                [X_PREVIEW_PARENT]: 'https://evil.example.com'
            }
        }
        expect(isTrustedPreviewRequest(req)).toBe(false)
    })
})

describe('STOREFRONT_PREVIEW_PARENT_ALLOW_LIST parity', () => {
    // The server-side allow-list (constants.js) MUST mirror IFRAME_HOST_ALLOW_LIST
    // in commerce-sdk-react/src/constant.ts. Drift would cause client and server
    // to disagree about which iframe parents are trusted: the client could decide
    // it is in a trusted iframe (and emit different cookie attributes / cookie
    // names) while the server falls back to Lax, or vice versa. This test reads
    // the canonical client file from disk so the check is robust against
    // refactors that move the constant or rename related symbols, without
    // requiring a runtime dependency from pwa-kit-runtime → commerce-sdk-react.
    //
    // SCOPE: this is a monorepo-only test. It runs in CI/local dev when both
    // packages are present in the workspace, and never ships to consumers —
    // *.test.js files are excluded from the npm package, and even if one
    // somehow leaked, the relative path back to commerce-sdk-react/src does
    // not exist in an installed pwa-kit-runtime tree. If pwa-kit-runtime is
    // ever extracted to its own repo, delete this test (or replace with a
    // copy of the canonical list checked in against a hash).
    test('matches IFRAME_HOST_ALLOW_LIST in commerce-sdk-react', () => {
        const clientConstantPath = path.resolve(
            __dirname,
            '../../../../commerce-sdk-react/src/constant.ts'
        )
        const source = fs.readFileSync(clientConstantPath, 'utf8')

        // Structural check — fails loudly if the constant moves or the
        // surrounding `Object.freeze([...])` shape changes.
        const match = source.match(/IFRAME_HOST_ALLOW_LIST\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\)/)
        expect(match).not.toBeNull()
        const clientList = [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1])

        // Catches the silent "regex matched but parsed zero entries" edge
        // case (e.g. a refactor switching to double quotes or template
        // strings would match the outer shape but extract nothing).
        expect(clientList.length).toBeGreaterThan(0)

        expect([...STOREFRONT_PREVIEW_PARENT_ALLOW_LIST].sort()).toEqual([...clientList].sort())
    })
})
