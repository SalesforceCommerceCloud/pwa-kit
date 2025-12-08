/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {parseRuleExpression, evaluateRule} from './mrt-rule-matcher'

describe('parseRuleExpression', () => {
    it('should translate MRT eq/or/and/not to JS', () => {
        expect(parseRuleExpression('http.request.uri.path eq "/foo"')).toContain(
            'http.request._path === "/foo"'
        )
        expect(parseRuleExpression('A and B')).toContain('A && B')
        expect(parseRuleExpression('A or B')).toContain('A || B')
        expect(parseRuleExpression('not A')).toContain('! A') // Accepts space
    })

    it('should translate matches, contains and ~', () => {
        expect(parseRuleExpression('http.request.uri.path matches "^/foo.*"')).toContain(
            '.match("^/foo.*")'
        )
        expect(parseRuleExpression('http.request.uri.path contains "/bar"')).toContain(
            '.includes("/bar")'
        )
        expect(parseRuleExpression('http.request.uri.path ~ "^/baz"')).toContain('.match("^/baz")')
    })
})

describe('evaluateRule', () => {
    it('should match basic eq logic', () => {
        expect(
            evaluateRule('http.request.uri.path eq "/foo"', {
                path: '/foo'
            })
        ).toBe(true)
        expect(
            evaluateRule('http.request.uri.path eq "/foo"', {
                path: '/bar'
            })
        ).toBe(false)
    })

    it('should match regex with matches', () => {
        expect(
            evaluateRule('http.request.uri.path matches "^/f.*"', {
                path: '/foo'
            })
        ).toBe(true)
    })

    it('should handle transformation functions', () => {
        // lower/upper
        expect(evaluateRule('lower(http.request.uri.path) eq "/foo"', {path: '/FOO'})).toBe(true)
        expect(evaluateRule('upper(http.request.uri.path) eq "/FOO"', {path: '/foo'})).toBe(true)
        // starts_with, ends_with
        expect(evaluateRule('starts_with(http.request.uri.path, "/bar")', {path: '/barbaz'})).toBe(
            true
        )
        expect(evaluateRule('ends_with(http.request.uri.path, "baz")', {path: '/foobaz'})).toBe(
            true
        )
        // concat
        expect(evaluateRule('concat("/foo","/bar") eq "/foo/bar"', {})).toBe(true)
        // len
        expect(evaluateRule('len("abc") eq 3', {})).toBe(true)
        // regex_replace
        expect(
            evaluateRule(
                'regex_replace("hello world", "world", "universe") eq "hello universe"',
                {}
            )
        ).toBe(true)
    })

    it('should handle logical expressions', () => {
        expect(
            evaluateRule('http.request.uri.path eq "/foo" or http.request.uri.path eq "/bar"', {
                path: '/bar'
            })
        ).toBe(true)
    })

    it('should throw and log on bad expression', () => {
        jest.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => evaluateRule('notarealfunction()', {path: '/foo'})).toThrow()
        console.error.mockRestore()
    })

    it('should handle evaluateRule with undefined request fields', () => {
        // This hits the default destructuring assignment = {} on line 92
        expect(evaluateRule('len("test") eq 4', undefined)).toBe(true)
    })
})
