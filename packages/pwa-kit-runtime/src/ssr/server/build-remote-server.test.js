/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {enforceSecurityHeaders, once} from './build-remote-server'
import {CONTENT_SECURITY_POLICY as CSP, STRICT_TRANSPORT_SECURITY} from './constants'

describe('the once function', () => {
    test('should prevent a function being called more than once', () => {
        const fn = jest.fn(() => ({test: 'test'}))
        const wrapped = once(fn)
        expect(fn.mock.calls).toHaveLength(0)
        const v1 = wrapped()
        expect(fn.mock.calls).toHaveLength(1)
        const v2 = wrapped()
        expect(fn.mock.calls).toHaveLength(1)
        expect(v1).toBe(v2) // The exact same instance
    })
})

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
            hasHeader: (key) => Object.prototype.hasOwnProperty.call(headers, key),
            getHeader: (key) => headers[key],
            setHeader: (key, val) => (headers[key] = val)
        }
    })
    // Revert state detected by `isRemote()`
    afterEach(() => delete process.env.AWS_LAMBDA_FUNCTION_NAME)

    test('adds required directives for development', () => {
        enforceSecurityHeaders({}, res, () => {})
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
        enforceSecurityHeaders({}, res, () => {})
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
        enforceSecurityHeaders({}, res, () => {})
        res.setHeader(CSP, "connect-src test:* ; script-src 'unsafe-eval' test:*")
        expectDirectives([
            "connect-src test:* 'self' localhost:*",
            "script-src 'unsafe-eval' test:* 'self' localhost:*"
        ])
    })
    test('allows other CSP directives', () => {
        enforceSecurityHeaders({}, res, () => {})
        res.setHeader(CSP, 'fake-directive test:*')
        expectDirectives(['fake-directive test:*'])
    })
    test('enforces upgrade-insecure-requests disabled on development', () => {
        enforceSecurityHeaders({}, res, () => {})
        res.setHeader(CSP, 'upgrade-insecure-requests')
        expect(res.getHeader(CSP)).not.toContain('upgrade-insecure-requests')
    })
    test('enforces upgrade-insecure-requests enabled on production', () => {
        mockProduction()
        enforceSecurityHeaders({}, res, () => {})
        res.setHeader(CSP, 'connect-src localhost:*')
        expectDirectives(['upgrade-insecure-requests'])
    })
    test('adds directives even if setHeader is never called', () => {
        enforceSecurityHeaders({}, res, () => {})
        expectDirectives(["img-src 'self' data:"])
    })
    test('handles multiple CSP headers', () => {
        enforceSecurityHeaders({}, res, () => {})
        res.setHeader(CSP, ['connect-src first.header', 'script-src second.header'])
        const headers = res.getHeader(CSP)
        expect(headers).toHaveLength(2)
        expect(headers[0]).toContain('connect-src first.header')
        expect(headers[1]).toContain('script-src second.header')
    })
    test('does not modify unrelated headers', () => {
        const header = 'Contentious-Secret-Police'
        const value = 'connect-src unmodified fake directive'
        enforceSecurityHeaders({}, res, () => {})
        res.setHeader(header, value)
        expect(res.getHeader(header)).toBe(value)
    })
    test('blocks Strict-Transport-Security header in development', () => {
        enforceSecurityHeaders({}, res, () => {})
        res.setHeader(STRICT_TRANSPORT_SECURITY, 'max-age=12345')
        expect(res.hasHeader(STRICT_TRANSPORT_SECURITY)).toBe(false)
    })
    test('allows Strict-Transport-Security header in production', () => {
        mockProduction()
        enforceSecurityHeaders({}, res, () => {})
        res.setHeader(STRICT_TRANSPORT_SECURITY, 'max-age=12345')
        expect(res.getHeader(STRICT_TRANSPORT_SECURITY)).toBe('max-age=12345')
    })
    test('provides default value for Strict-Transport-Security header in production', () => {
        mockProduction()
        enforceSecurityHeaders({}, res, () => {})
        expect(res.getHeader(STRICT_TRANSPORT_SECURITY)).toBe('max-age=15552000; includeSubDomains')
    })
})
