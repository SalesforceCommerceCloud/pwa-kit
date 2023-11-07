/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    CONTENT_SECURITY_POLICY as CSP,
    STRICT_TRANSPORT_SECURITY as HSTS
} from '../../ssr/server/constants'
import {defaultPwaKitSecurityHeaders} from './security'

describe('Content-Security-Policy enforcement', () => {
    let res

    /** Sets the correct values for `isRemote()` to return true */
    const mockProduction = () => {
        process.env.AWS_LAMBDA_FUNCTION_NAME = 'testEnforceSecurityHeaders'
    }
    /**
     * Helper to make expected CSP more readable. Asserts that the actual CSP header contains each
     * of the expected directives.
     * @param {string[]} expected Array of expected CSP directives
     */
    const expectDirectives = (expected) => {
        const actual = res.getHeader(CSP).split(';')
        expect(actual).toEqual(expect.arrayContaining(expected))
    }

    beforeEach(() => {
        const headers = {}
        res = {
            hasHeader: (key) => Object.hasOwn(headers, key),
            getHeader: (key) => headers[key],
            setHeader: (key, val) => (headers[key] = val)
        }
    })
    // Revert state detected by `isRemote()`
    afterEach(() => delete process.env.AWS_LAMBDA_FUNCTION_NAME)

    test('adds required directives for development', () => {
        defaultPwaKitSecurityHeaders({}, res, () => {})
        res.setHeader(CSP, '')
        expectDirectives([
            "connect-src 'self' localhost:*",
            'frame-ancestors localhost:*',
            "img-src 'self' data:",
            "script-src 'self' 'unsafe-eval' localhost:*"
        ])
    })
    test('adds required directives for production', () => {
        mockProduction()
        defaultPwaKitSecurityHeaders({}, res, () => {})
        res.setHeader(CSP, '')
        expectDirectives([
            "connect-src 'self' https://runtime.commercecloud.com",
            'frame-ancestors https://runtime.commercecloud.com',
            "img-src 'self' data:",
            "script-src 'self' 'unsafe-eval' https://runtime.commercecloud.com",
            'upgrade-insecure-requests'
        ])
    })
    test('merges with existing CSP directives', () => {
        defaultPwaKitSecurityHeaders({}, res, () => {})
        res.setHeader(CSP, "connect-src test:* ; script-src 'unsafe-eval' test:*")
        expectDirectives([
            "connect-src test:* 'self' localhost:*",
            "script-src 'unsafe-eval' test:* 'self' localhost:*"
        ])
    })
    test('allows other CSP directives', () => {
        defaultPwaKitSecurityHeaders({}, res, () => {})
        res.setHeader(CSP, 'fake-directive test:*')
        expectDirectives(['fake-directive test:*'])
    })
    test('enforces upgrade-insecure-requests disabled on development', () => {
        defaultPwaKitSecurityHeaders({}, res, () => {})
        res.setHeader(CSP, 'upgrade-insecure-requests')
        expect(res.getHeader(CSP)).not.toContain('upgrade-insecure-requests')
    })
    test('enforces upgrade-insecure-requests enabled on production', () => {
        mockProduction()
        defaultPwaKitSecurityHeaders({}, res, () => {})
        res.setHeader(CSP, 'connect-src localhost:*')
        expectDirectives(['upgrade-insecure-requests'])
    })
    test('adds directives even if setHeader is never called', () => {
        defaultPwaKitSecurityHeaders({}, res, () => {})
        expectDirectives(["img-src 'self' data:"])
    })
    test('handles multiple CSP headers', () => {
        defaultPwaKitSecurityHeaders({}, res, () => {})
        res.setHeader(CSP, ['connect-src first.header', 'script-src second.header'])
        const headers = res.getHeader(CSP)
        expect(headers).toHaveLength(2)
        expect(headers[0]).toContain('connect-src first.header')
        expect(headers[1]).toContain('script-src second.header')
    })
    test('does not modify unrelated headers', () => {
        const header = 'Contentious-Secret-Police'
        const value = 'connect-src unmodified fake directive'
        defaultPwaKitSecurityHeaders({}, res, () => {})
        res.setHeader(header, value)
        expect(res.getHeader(header)).toBe(value)
    })
    test('blocks Strict-Transport-Security header in development', () => {
        defaultPwaKitSecurityHeaders({}, res, () => {})
        res.setHeader(HSTS, 'max-age=12345')
        expect(res.hasHeader(HSTS)).toBe(false)
    })
    test('allows Strict-Transport-Security header in production', () => {
        mockProduction()
        defaultPwaKitSecurityHeaders({}, res, () => {})
        res.setHeader(HSTS, 'max-age=12345')
        expect(res.getHeader(HSTS)).toBe('max-age=12345')
    })
    test('provides default value for Strict-Transport-Security header in production', () => {
        mockProduction()
        defaultPwaKitSecurityHeaders({}, res, () => {})
        expect(res.getHeader(HSTS)).toBe('max-age=15552000; includeSubDomains')
    })
})
