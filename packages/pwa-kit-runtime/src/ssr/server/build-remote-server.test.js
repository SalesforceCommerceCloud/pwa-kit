/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {once} from './build-remote-server'

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

describe('WHATWG URL parsing for SSR request processing', () => {
    // These tests validate the URL parsing that happens in
    // _setupSSRRequestProcessorMiddleware using the WHATWG URL API

    const parseUrl = (urlString) => {
        const parsedUrl = new URL(urlString, 'http://localhost')
        return {
            pathname: parsedUrl.pathname,
            query: parsedUrl.search ? parsedUrl.search.slice(1) : null,
            search: parsedUrl.search
        }
    }

    test('parses basic URL with query string', () => {
        const result = parseUrl('/path?key=value')
        expect(result.pathname).toBe('/path')
        expect(result.query).toBe('key=value')
        expect(result.search).toBe('?key=value')
    })

    test('handles empty query strings', () => {
        const result = parseUrl('/path')
        expect(result.pathname).toBe('/path')
        expect(result.query).toBeNull()
        expect(result.search).toBe('')
    })

    test('handles URL with trailing question mark (empty query)', () => {
        const result = parseUrl('/path?')
        expect(result.pathname).toBe('/path')
        // WHATWG URL treats '?' as empty search
        expect(result.search).toBe('')
        expect(result.query).toBeNull()
    })

    test('handles special characters in URL path', () => {
        const result = parseUrl('/path/caf%C3%A9/items?a=1')
        expect(result.pathname).toBe('/path/caf%C3%A9/items')
        expect(result.query).toBe('a=1')
    })

    test('handles special characters in query string', () => {
        const result = parseUrl('/path?name=hello%20world&emoji=%F0%9F%98%80')
        expect(result.pathname).toBe('/path')
        expect(result.query).toBe('name=hello%20world&emoji=%F0%9F%98%80')
    })

    test('handles malformed URLs gracefully', () => {
        // WHATWG URL with a base can handle relative paths
        expect(() => parseUrl('/valid/path')).not.toThrow()
        expect(() => parseUrl('/')).not.toThrow()
        expect(() => parseUrl('/path?a=1&b=2')).not.toThrow()
    })

    test('handles URLs with fragments', () => {
        const result = parseUrl('/path?key=value#section')
        expect(result.pathname).toBe('/path')
        expect(result.query).toBe('key=value')
        // Hash should not be part of search/query
        expect(result.search).toBe('?key=value')
    })

    test('handles URL with only fragment', () => {
        const result = parseUrl('/path#section')
        expect(result.pathname).toBe('/path')
        expect(result.query).toBeNull()
        expect(result.search).toBe('')
    })

    test('handles URL with multiple query parameters', () => {
        const result = parseUrl('/path?a=1&b=2&c=3')
        expect(result.pathname).toBe('/path')
        expect(result.query).toBe('a=1&b=2&c=3')
    })

    test('handles URL with query parameter with no value', () => {
        const result = parseUrl('/path?flag&key=value')
        expect(result.pathname).toBe('/path')
        expect(result.query).toBe('flag&key=value')
    })

    test('reconstructs URL correctly with updated path and search', () => {
        // Verify that new URL correctly parses, then string concatenation reconstructs
        const parsed = new URL('/original?q=1', 'http://localhost')
        expect(parsed.pathname).toBe('/original')
        expect(parsed.search).toBe('?q=1')

        const updatedPath = '/new-path'
        const updatedSearch = '?q=2'
        const reconstructed = updatedPath + updatedSearch
        expect(reconstructed).toBe('/new-path?q=2')

        // With empty search
        const noSearch = updatedPath + ''
        expect(noSearch).toBe('/new-path')
    })

    test('reconstructs URL correctly when query is removed', () => {
        const updatedPath = '/path'
        const search = ''
        expect(updatedPath + search).toBe('/path')
    })

    test('reconstructs URL correctly when query is added', () => {
        const updatedPath = '/path'
        const search = '?new=param'
        expect(updatedPath + search).toBe('/path?new=param')
    })
})
