/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {convertExpressRouteToRegex} from './convert-express-route'

describe('convertExpressRouteToRegex', () => {
    it('returns null for falsy routePattern', () => {
        expect(convertExpressRouteToRegex(null)).toBeNull()
        expect(convertExpressRouteToRegex(undefined)).toBeNull()
    })
    it('returns given RegExp', () => {
        const re = /abc/
        expect(convertExpressRouteToRegex(re)).toBe(re)
    })
    it('returns null for non-string, non-RegExp', () => {
        expect(convertExpressRouteToRegex(123)).toBeNull()
    })
    it('handles simple static path', () => {
        const re = convertExpressRouteToRegex('/users')
        expect(re.test('/users')).toBe(true)
        expect(re.test('/other')).toBe(false)
    })
    it('handles parameter, optional parameter and wildcard', () => {
        // /users/:id -> /users/123
        const re = convertExpressRouteToRegex('/users/:id')
        expect(re.test('/users/123')).toBe(true)
        // /users/:id? matches /users and /users/123
        const reOpt = convertExpressRouteToRegex('/users/:id?')
        expect(reOpt.test('/users')).toBe(true)
        expect(reOpt.test('/users/123')).toBe(true)
        // /users/* -> /users/anything
        const reStar = convertExpressRouteToRegex('/users/*')
        expect(reStar.test('/users/abc/def')).toBe(true)
    })
    it('handles regex constraint (:id(\\d+))', () => {
        const re = convertExpressRouteToRegex('/users/:id(\\d+)')
        expect(re.test('/users/345')).toBe(true)
        expect(re.test('/users/abc')).toBe(false)
    })
    it('throws on invalid pattern', () => {
        expect(() => convertExpressRouteToRegex('[')).toThrow()
    })

    it('handles root optional parameter', () => {
        const re = convertExpressRouteToRegex('/:id?')
        expect(re.test('/')).toBe(false)
        expect(re.test('/foo')).toBe(true)
    })
    it('handles root wildcard', () => {
        const re = convertExpressRouteToRegex('/*')
        expect(re.test('/')).toBe(true)
        expect(re.test('/something')).toBe(true)
    })

    it('handles complex optional param with regex meta', () => {
        // This should trigger line 108: complex content inside optional gets (?:...)?
        const re = convertExpressRouteToRegex('/test/:id(\\d+)?')
        expect(re.test('/test/')).toBe(true) // trailing slash
        expect(re.test('/test/123')).toBe(true)
        expect(re.test('/test/abc')).toBe(false)
    })

    it('handles simple optional param without regex', () => {
        // This should hit the branch where optional param is simple (no complex regex)
        const re = convertExpressRouteToRegex('/api/:version?/users')
        expect(re.test('/api/users')).toBe(true)
        expect(re.test('/api/v1/users')).toBe(true)
    })
})
