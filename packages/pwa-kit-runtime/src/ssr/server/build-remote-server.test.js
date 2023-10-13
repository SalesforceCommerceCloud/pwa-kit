/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {enforceContentSecurityPolicy, once} from './build-remote-server'
import {CONTENT_SECURITY_POLICY as CSP} from './constants'

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
            getHeader: (key) => headers[key],
            setHeader: (key, val) => (headers[key] = val)
        }
    })
    // Revert state detected by `isRemote()`
    afterEach(() => delete process.env.AWS_LAMBDA_FUNCTION_NAME)

    test('adds required directives for development', () => {
        enforceContentSecurityPolicy({}, res, () => {})
        res.setHeader(CSP, '')
        expectDirectives([
            "connect-src 'self' api.cquotient.com localhost:*",
            'frame-ancestors localhost:*',
            "img-src 'self' *.commercecloud.salesforce.com data:",
            "script-src 'self' 'unsafe-eval' storage.googleapis.com localhost:*"
        ])
    })
    test('adds required directives for production', () => {
        process.env.AWS_LAMBDA_FUNCTION_NAME = 'testEnforceCSP'
        enforceContentSecurityPolicy({}, res, () => {})
        res.setHeader(CSP, '')
        expectDirectives([
            "connect-src 'self' api.cquotient.com https://runtime.commercecloud.com",
            'frame-ancestors https://runtime.commercecloud.com',
            "img-src 'self' *.commercecloud.salesforce.com data:",
            "script-src 'self' 'unsafe-eval' storage.googleapis.com https://runtime.commercecloud.com",
            'upgrade-insecure-requests'
        ])
    })
    test('merges with existing CSP directives', () => {
        enforceContentSecurityPolicy({}, res, () => {})
        res.setHeader(CSP, "connect-src test:* ; script-src 'unsafe-eval' test:*")
        expectDirectives([
            "connect-src test:* 'self' api.cquotient.com localhost:*",
            "script-src 'unsafe-eval' test:* 'self' storage.googleapis.com localhost:*"
        ])
    })
    test('allows other CSP directives', () => {
        enforceContentSecurityPolicy({}, res, () => {})
        res.setHeader(CSP, 'fake-directive test:*')
        expectDirectives(['fake-directive test:*'])
    })
    test('enforces upgrade-insecure-requests disabled on development', () => {
        enforceContentSecurityPolicy({}, res, () => {})
        res.setHeader(CSP, 'upgrade-insecure-requests')
        expect(res.getHeader(CSP)).not.toContain('upgrade-insecure-requests')
    })
    test('enforces upgrade-insecure-requests enabled on production', () => {
        process.env.AWS_LAMBDA_FUNCTION_NAME = 'testEnforceCSP'
        enforceContentSecurityPolicy({}, res, () => {})
        res.setHeader(CSP, 'connect-src localhost:*')
        expectDirectives(['upgrade-insecure-requests'])
    })
    test('adds directives even if setHeader is never called', () => {
        enforceContentSecurityPolicy({}, res, () => {})
        expectDirectives(["img-src 'self' *.commercecloud.salesforce.com data:"])
    })
    test('handles multiple CSP headers', () => {
        enforceContentSecurityPolicy({}, res, () => {})
        res.setHeader(CSP, ['connect-src first.header', 'script-src second.header'])
        const headers = res.getHeader(CSP)
        expect(headers).toHaveLength(2)
        expect(headers[0]).toContain('connect-src first.header')
        expect(headers[1]).toContain('script-src second.header')
    })
    test('does not modify unrelated headers', () => {
        const header = 'Contentious-Secret-Police'
        const value = 'connect-src unmodified fake directive'
        enforceContentSecurityPolicy({}, res, () => {})
        res.setHeader(header, value)
        expect(res.getHeader(header)).toBe(value)
    })
})
