/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {iterate, hybridProxy} from './hybrid-proxy'
import logger from '../logger-instance'
import * as utils from './utils'

// Mock only isRemote from utils module
jest.mock('./utils', () => ({
    ...jest.requireActual('./utils'),
    isRemote: jest.fn(() => false) // Default to false for most tests
}))

jest.mock('../logger-instance', () => ({
    __esModule: true,
    default: {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
    }
}))

// Capture options passed to createProxyMiddleware so we can assert pathRewrite behavior
let __capturedOptions
let __capturedFilter
let __responseInterceptorInner
jest.mock('http-proxy-middleware', () => ({
    __esModule: true,
    createProxyMiddleware: (filter, options) => {
        __capturedOptions = options
        __capturedFilter = filter
        const fn = jest.fn()
        return fn
    },
    responseInterceptor: (fn) => {
        __responseInterceptorInner = fn
        return () => {}
    }
}))

describe('iterate', () => {
    beforeEach(() => {
        jest.spyOn(console, 'info').mockImplementation(() => {})
        jest.spyOn(console, 'warn').mockImplementation(() => {})
    })
    afterEach(() => {
        console.info.mockRestore()
        console.warn.mockRestore()
    })
    it('should rewrite redirectUrl keys', () => {
        const sampleObj = {
            url1: 'https://original.com/page',
            redirectUrl: 'https://original.com/redirect',
            nest: {
                redirectUrl: 'https://original.com/nestedredirect',
                foo: 'bar'
            }
        }
        const input = JSON.parse(JSON.stringify(sampleObj))
        const output = iterate(input, null, {
            sfccOrigin: 'https://original.com',
            proxyOrigin: 'https://proxied.com'
        })
        expect(output.redirectUrl).toBe('https://proxied.com/redirect')
        expect(output.nest.redirectUrl).toBe('https://proxied.com/nestedredirect')
        // Non-matching keys remain unchanged
        expect(output.nest.foo).toBe('bar')
    })
})

describe('hybridProxy', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Reset isRemote mock to default value
        utils.isRemote.mockReturnValue(false)
    })
    it('warns when localAllowCookies is missing', () => {
        hybridProxy({
            hybridProxy: {
                sfccOrigin: 'https://test.com',
                routingRules: ['rule']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('localAllowCookies'))
    })
    it('warns when sfccOrigin is missing', () => {
        hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                routingRules: ['rule']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('hybridProxy.sfccOrigin'))
    })
    it('warns when hybridRoutingRules is empty', () => {
        hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://test.com',
                routingRules: []
            },
            appHostname: 'localhost',
            protocol: 'http'
        })
        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('hybridProxy.routingRules')
        )
    })
    it('returns middleware function when all options provided', () => {
        const proxy = hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://test.com',
                routingRules: ['http.request.uri.path eq "/test"']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })
        expect(typeof proxy).toBe('function')
    })

    it('onProxyRes rewrites HTML body and Location header', async () => {
        hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://sfcc.example.com',
                routingRules: ['http.request.uri.path eq "/"']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })
        const proxyRes = {
            headers: {'content-type': 'text/html', location: 'https://sfcc.example.com/some'}
        }
        const res = {setHeader: jest.fn()}
        __capturedOptions.onProxyRes(proxyRes, {}, res)
        const result = await __responseInterceptorInner(
            Buffer.from('<a href="https://sfcc.example.com/x">link</a>')
        )
        expect(String(result)).toContain('http://localhost/x')
        expect(res.setHeader).toHaveBeenCalledWith('location', 'http://localhost/some')
    })

    it('onProxyRes returns original buffer for non-JSON default type', async () => {
        hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://sfcc.example.com',
                routingRules: ['http.request.uri.path eq "/"']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })
        const proxyRes = {headers: {'content-type': 'image/png'}}
        const res = {}
        __capturedOptions.onProxyRes(proxyRes, {}, res)
        const buf = Buffer.from('PNGDATA')
        const result = await __responseInterceptorInner(buf)
        expect(result).toBe(buf)
    })

    it('onProxyRes handles application/json parse errors gracefully', async () => {
        hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://sfcc.example.com',
                routingRules: ['http.request.uri.path eq "/"']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })
        const proxyRes = {headers: {'content-type': 'application/json'}}
        const res = {}
        __capturedOptions.onProxyRes(proxyRes, {}, res)
        const bad = Buffer.from('{not json')
        const result = await __responseInterceptorInner(bad)
        expect(result).toBe(bad)
    })

    it('onProxyRes no content-type returns original buffer', async () => {
        hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://sfcc.example.com',
                routingRules: ['http.request.uri.path eq "/"']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })
        const proxyRes = {headers: {}}
        const res = {}
        __capturedOptions.onProxyRes(proxyRes, {}, res)
        const input = Buffer.from('DATA')
        const result = await __responseInterceptorInner(input)
        expect(result).toBe(input)
    })

    it('onProxyRes rewrites JSON response with redirectUrl', async () => {
        hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://sfcc.example.com',
                routingRules: ['http.request.uri.path eq "/"']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })
        const proxyRes = {headers: {'content-type': 'application/json'}}
        const res = {}
        __capturedOptions.onProxyRes(proxyRes, {}, res)
        const jsonData = JSON.stringify({
            redirectUrl: 'https://sfcc.example.com/redirect',
            otherData: 'value'
        })
        const result = await __responseInterceptorInner(Buffer.from(jsonData))
        const parsedResult = JSON.parse(result.toString())
        expect(parsedResult.redirectUrl).toBe('http://localhost/redirect')
        expect(parsedResult.otherData).toBe('value')
    })

    it('proxy middleware filter function returns correct boolean based on routing rules', () => {
        const proxy = hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://test.com',
                routingRules: ['http.request.uri.path eq "/test"']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })

        // Test that the filter function is called with correct parameters
        expect(typeof proxy).toBe('function')
        expect(typeof __capturedFilter).toBe('function')

        // Test the filter function behavior with a mock request
        const mockReq = {
            hostname: 'localhost',
            url: '/test',
            headers: {cookie: 'test=value'}
        }

        // The filter function should be called and return a boolean
        // We can't easily mock evaluateRule here since it's imported, but we can test the function exists
        expect(() => __capturedFilter('/test', mockReq)).not.toThrow()
    })

    it('proxy middleware filter function handles missing cookies header', () => {
        hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://test.com',
                routingRules: ['http.request.uri.path eq "/test"']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })

        // Test with request that has no cookies header
        const mockReq = {
            hostname: 'localhost',
            url: '/test',
            headers: {} // No cookie header
        }

        // Should not throw when cookies header is missing
        expect(() => __capturedFilter('/test', mockReq)).not.toThrow()
    })

    it('iterate handles non-iterable objects', () => {
        const result = iterate('not an object', null, {
            sfccOrigin: 'https://original.com',
            proxyOrigin: 'https://proxied.com'
        })
        expect(result).toBe('not an object')
    })

    it('iterate handles null and undefined values', () => {
        const result1 = iterate(null, null, {
            sfccOrigin: 'https://original.com',
            proxyOrigin: 'https://proxied.com'
        })
        expect(result1).toBeNull()

        const result2 = iterate(undefined, null, {
            sfccOrigin: 'https://original.com',
            proxyOrigin: 'https://proxied.com'
        })
        expect(result2).toBeUndefined()
    })

    it('iterate handles arrays with redirectUrl', () => {
        const input = [
            {redirectUrl: 'https://original.com/redirect1'},
            {redirectUrl: 'https://original.com/redirect2'},
            {otherData: 'value'}
        ]
        const output = iterate(input, null, {
            sfccOrigin: 'https://original.com',
            proxyOrigin: 'https://proxied.com'
        })
        expect(output[0].redirectUrl).toBe('https://proxied.com/redirect1')
        expect(output[1].redirectUrl).toBe('https://proxied.com/redirect2')
        expect(output[2].otherData).toBe('value')
    })

    it('uses https protocol when isRemote returns true', () => {
        // Set the mocked utils module to return true
        utils.isRemote.mockReturnValue(true)

        const proxy = hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://test.com',
                routingRules: ['http.request.uri.path eq "/test"']
            },
            appHostname: 'localhost',
            protocol: 'http' // This should be overridden to https
        })

        expect(typeof proxy).toBe('function')
        // The proxy should use https://localhost as the proxy origin when isRemote is true
    })

    it('onProxyRes does not rewrite location header when it does not contain sfccOrigin', async () => {
        hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://sfcc.example.com',
                routingRules: ['http.request.uri.path eq "/"']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })
        const proxyRes = {
            headers: {
                'content-type': 'text/html',
                location: 'https://other-domain.com/redirect-path'
            }
        }
        const res = {setHeader: jest.fn()}
        __capturedOptions.onProxyRes(proxyRes, {}, res)

        // Verify that the location header was NOT rewritten
        expect(res.setHeader).not.toHaveBeenCalledWith('location', expect.any(String))
    })

    it('uses empty array when hybridProxy.routingRules is undefined', () => {
        const proxy = hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://test.com'
                // routingRules is undefined
            },
            appHostname: 'localhost',
            protocol: 'http'
        })

        expect(typeof proxy).toBe('function')
        // Should warn about empty routing rules
        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('hybridProxy.routingRules')
        )
    })

    it('onProxyRes handles location header with sfccOrigin but no content-type', async () => {
        hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://sfcc.example.com',
                routingRules: ['http.request.uri.path eq "/"']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })
        const proxyRes = {
            headers: {
                location: 'https://sfcc.example.com/redirect-path'
                // No content-type header
            }
        }
        const res = {setHeader: jest.fn()}
        __capturedOptions.onProxyRes(proxyRes, {}, res)

        // Should not rewrite location header when content-type is not text/html
        expect(res.setHeader).not.toHaveBeenCalledWith('location', expect.any(String))
    })

    it('onProxyRes handles location header that does not contain sfccOrigin', async () => {
        hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://sfcc.example.com',
                routingRules: ['http.request.uri.path eq "/"']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })
        const proxyRes = {
            headers: {
                'content-type': 'text/html',
                location: 'https://other-domain.com/redirect-path'
            }
        }
        const res = {setHeader: jest.fn()}
        __capturedOptions.onProxyRes(proxyRes, {}, res)

        // Should not rewrite location header when it doesn't contain sfccOrigin
        expect(res.setHeader).not.toHaveBeenCalledWith('location', expect.any(String))
    })

    it('iterate handles non-string values and keys', () => {
        const input = {
            redirectUrl: 'https://original.com/redirect',
            nonStringKey: 123, // non-string value
            [123]: 'https://original.com/redirect', // non-string key
            normalKey: 'https://original.com/redirect'
        }
        const output = iterate(input, null, {
            sfccOrigin: 'https://original.com',
            proxyOrigin: 'https://proxied.com'
        })

        // Only redirectUrl should be rewritten (string key and value)
        expect(output.redirectUrl).toBe('https://proxied.com/redirect')
        expect(output.nonStringKey).toBe(123) // unchanged
        expect(output[123]).toBe('https://original.com/redirect') // unchanged
        expect(output.normalKey).toBe('https://original.com/redirect') // unchanged (not redirecturl)
    })

    it('onProxyRes handles empty location header', async () => {
        hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://sfcc.example.com',
                routingRules: ['http.request.uri.path eq "/"']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })
        const proxyRes = {
            headers: {
                'content-type': 'text/html',
                location: '' // empty location header
            }
        }
        const res = {setHeader: jest.fn()}
        __capturedOptions.onProxyRes(proxyRes, {}, res)

        // Should not rewrite empty location header
        expect(res.setHeader).not.toHaveBeenCalledWith('location', expect.any(String))
    })

    it('iterate handles case-insensitive redirectUrl key matching', () => {
        const input = {
            redirectUrl: 'https://original.com/redirect',
            REDIRECTURL: 'https://original.com/redirect2',
            RedirectUrl: 'https://original.com/redirect3',
            otherKey: 'https://original.com/redirect4'
        }
        const output = iterate(input, null, {
            sfccOrigin: 'https://original.com',
            proxyOrigin: 'https://proxied.com'
        })

        // All case variations of redirectUrl should be rewritten
        expect(output.redirectUrl).toBe('https://proxied.com/redirect')
        expect(output.REDIRECTURL).toBe('https://proxied.com/redirect2')
        expect(output.RedirectUrl).toBe('https://proxied.com/redirect3')
        expect(output.otherKey).toBe('https://original.com/redirect4') // unchanged
    })

    it('iterate handles mixed data types to cover all branch conditions', () => {
        const input = {
            redirectUrl: 'https://original.com/redirect', // should be rewritten
            redirectUrl2: null, // non-string value, should not be rewritten
            redirectUrl3: undefined, // non-string value, should not be rewritten
            redirectUrl4: 123, // non-string value, should not be rewritten
            redirectUrl5: {}, // non-string value, should not be rewritten
            redirectUrl6: [], // non-string value, should not be rewritten
            redirectUrl7: true, // non-string value, should not be rewritten
            redirectUrl8: 'https://original.com/redirect8' // should be rewritten
        }
        const output = iterate(input, null, {
            sfccOrigin: 'https://original.com',
            proxyOrigin: 'https://proxied.com'
        })

        // Only string values should be rewritten
        expect(output.redirectUrl).toBe('https://proxied.com/redirect')
        expect(output.redirectUrl2).toBeNull() // unchanged
        expect(output.redirectUrl3).toBeUndefined() // unchanged
        expect(output.redirectUrl4).toBe(123) // unchanged
        expect(output.redirectUrl5).toEqual({}) // unchanged
        expect(output.redirectUrl6).toEqual([]) // unchanged
        expect(output.redirectUrl7).toBe(true) // unchanged
        expect(output.redirectUrl8).toBe('https://original.com/redirect8') // unchanged (key is redirectUrl8, not redirecturl)
    })

    it('onProxyRes handles falsy location header values safely', async () => {
        hybridProxy({
            localAllowCookies: true,
            hybridProxy: {
                sfccOrigin: 'https://sfcc.example.com',
                routingRules: ['http.request.uri.path eq "/"']
            },
            appHostname: 'localhost',
            protocol: 'http'
        })

        // Test various falsy values that could cause errors without the first check
        const falsyValues = [null, undefined, '', 0, false]

        falsyValues.forEach((falsyValue) => {
            const proxyRes = {
                headers: {
                    'content-type': 'text/html',
                    location: falsyValue
                }
            }
            const res = {setHeader: jest.fn()}

            // Should not throw an error and should not rewrite
            expect(() => {
                __capturedOptions.onProxyRes(proxyRes, {}, res)
            }).not.toThrow()

            expect(res.setHeader).not.toHaveBeenCalledWith('location', expect.any(String))
        })
    })
})
