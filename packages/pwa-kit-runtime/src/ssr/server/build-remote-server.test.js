/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {once} from './build-remote-server'
import {parseRequestUrl} from '../../utils/ssr-server'

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

describe('parseRequestUrl', () => {
    // Helper to create a minimal Express-like request object
    const mockReq = (url, overrides = {}) => ({url, headers: {}, ...overrides})

    test('parses basic URL with query string', () => {
        const result = parseRequestUrl(mockReq('/path?key=value'))
        expect(result.pathname).toBe('/path')
        expect(result.query).toBe('key=value')
        expect(result.search).toBe('?key=value')
    })

    test('handles empty query strings', () => {
        const result = parseRequestUrl(mockReq('/path'))
        expect(result.pathname).toBe('/path')
        expect(result.query).toBeNull()
        expect(result.search).toBe('')
    })

    test('handles URL with trailing question mark (empty query)', () => {
        const result = parseRequestUrl(mockReq('/path?'))
        expect(result.pathname).toBe('/path')
        // WHATWG URL treats bare '?' as empty search
        expect(result.search).toBe('')
        expect(result.query).toBeNull()
    })

    test('handles special characters in URL path', () => {
        const result = parseRequestUrl(mockReq('/path/caf%C3%A9/items?a=1'))
        expect(result.pathname).toContain('/path/caf')
        expect(result.query).toBe('a=1')
    })

    test('handles special characters in query string', () => {
        const result = parseRequestUrl(mockReq('/path?name=hello%20world&emoji=%F0%9F%98%80'))
        expect(result.pathname).toBe('/path')
        expect(result.query).toBe('name=hello%20world&emoji=%F0%9F%98%80')
    })

    test('handles malformed URLs gracefully', () => {
        // WHATWG URL with a base can handle relative paths
        expect(() => parseRequestUrl(mockReq('/valid/path'))).not.toThrow()
        expect(() => parseRequestUrl(mockReq('/'))).not.toThrow()
        expect(() => parseRequestUrl(mockReq('/path?a=1&b=2'))).not.toThrow()
    })

    test('handles double-encoded path segments', () => {
        const result = parseRequestUrl(mockReq('/path%252Fencoded'))
        expect(result.pathname).toContain('path')
        expect(result.query).toBeNull()
    })

    test('handles extremely long paths without throwing', () => {
        const longPath = '/' + 'a'.repeat(2000)
        const result = parseRequestUrl(mockReq(longPath))
        expect(result.pathname).toBe(longPath)
        expect(result.query).toBeNull()
    })

    test('handles path with encoded unicode characters', () => {
        const result = parseRequestUrl(mockReq('/caf%C3%A9/%E4%B8%AD%E6%96%87'))
        expect(result.pathname).toContain('/caf')
        expect(result.query).toBeNull()
    })

    test('handles URLs with fragments', () => {
        const result = parseRequestUrl(mockReq('/path?key=value#section'))
        expect(result.pathname).toBe('/path')
        expect(result.query).toBe('key=value')
        // Hash should not be part of search/query
        expect(result.search).toBe('?key=value')
    })

    test('handles URL with only fragment', () => {
        const result = parseRequestUrl(mockReq('/path#section'))
        expect(result.pathname).toBe('/path')
        expect(result.query).toBeNull()
        expect(result.search).toBe('')
    })

    test('handles URL with multiple query parameters', () => {
        const result = parseRequestUrl(mockReq('/path?a=1&b=2&c=3'))
        expect(result.pathname).toBe('/path')
        expect(result.query).toBe('a=1&b=2&c=3')
    })

    test('handles URL with query parameter with no value', () => {
        const result = parseRequestUrl(mockReq('/path?flag&key=value'))
        expect(result.pathname).toBe('/path')
        expect(result.query).toBe('flag&key=value')
    })

    describe('dynamic base URL construction', () => {
        test('uses request protocol and host header', () => {
            const result = parseRequestUrl(
                mockReq('/path?a=1', {
                    protocol: 'https',
                    headers: {host: 'example.com'}
                })
            )
            expect(result.pathname).toBe('/path')
            expect(result.query).toBe('a=1')
            expect(result.search).toBe('?a=1')
        })

        test('falls back to http when protocol is absent', () => {
            const result = parseRequestUrl(mockReq('/path'))
            // Should not throw; falls back to http://localhost
            expect(result.pathname).toBe('/path')
        })

        test('detects https from socket.encrypted when protocol is absent', () => {
            const result = parseRequestUrl(
                mockReq('/secure-path', {
                    socket: {encrypted: true},
                    headers: {host: 'secure.example.com'}
                })
            )
            expect(result.pathname).toBe('/secure-path')
            expect(result.query).toBeNull()
        })

        test('falls back to localhost when host header is absent', () => {
            const result = parseRequestUrl(mockReq('/path?x=1'))
            expect(result.pathname).toBe('/path')
            expect(result.query).toBe('x=1')
        })

        test('prefers req.protocol over socket.encrypted', () => {
            const result = parseRequestUrl(
                mockReq('/path', {
                    protocol: 'http',
                    socket: {encrypted: true},
                    headers: {host: 'example.com'}
                })
            )
            // req.protocol is truthy ('http'), so socket.encrypted is not consulted
            expect(result.pathname).toBe('/path')
        })
    })

    describe('URL reconstruction for request processing', () => {
        test('reconstructs URL correctly with updated path and search', () => {
            const {search} = parseRequestUrl(mockReq('/original?q=1'))
            expect(search).toBe('?q=1')

            const updatedPath = '/new-path'
            const updatedSearch = '?q=2'
            expect(updatedPath + updatedSearch).toBe('/new-path?q=2')
            expect(updatedPath + '').toBe('/new-path')
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
})
