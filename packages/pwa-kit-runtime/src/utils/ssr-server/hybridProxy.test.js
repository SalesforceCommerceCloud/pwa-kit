/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {iterate, hybridProxy, shouldProxyRequest} from './hybridProxy'
import * as mrtRuleMatcher from './mrt-rule-matcher'
import logger from '../logger-instance'

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
let __responseInterceptorInner
jest.mock('http-proxy-middleware', () => ({
    __esModule: true,
    createProxyMiddleware: (filter, options) => {
        __capturedOptions = options
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
            SFCC_ORIGIN: 'https://original.com',
            PROXY_ORIGIN: 'https://proxied.com'
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
    })
    it('warns when localAllowCookies is missing', () => {
        hybridProxy({
            sfccOrigin: 'https://test.com',
            appHostname: 'localhost',
            protocol: 'http',
            hybridRoutingRules: ['rule']
        })
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('localAllowCookies'))
    })
    it('warns when sfccOrigin is missing', () => {
        // createProxyMiddleware will throw if target is missing, so we wrap in try/catch
        try {
            hybridProxy({
                localAllowCookies: true,
                appHostname: 'localhost',
                protocol: 'http',
                hybridRoutingRules: ['rule']
            })
        } catch (e) {
            // Expected to throw
        }
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('sfccOrigin'))
    })
    it('warns when hybridRoutingRules is empty', () => {
        hybridProxy({
            localAllowCookies: true,
            sfccOrigin: 'https://test.com',
            appHostname: 'localhost',
            protocol: 'http',
            hybridRoutingRules: []
        })
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('No hybridRoutingRules'))
    })
    it('returns middleware function when all options provided', () => {
        const proxy = hybridProxy({
            localAllowCookies: true,
            sfccOrigin: 'https://test.com',
            appHostname: 'localhost',
            protocol: 'http',
            hybridRoutingRules: ['http.request.uri.path eq "/test"']
        })
        expect(typeof proxy).toBe('function')
    })

    it('pathRewrite skips already-SFRA and non-page assets', () => {
        const proxy = hybridProxy({
            localAllowCookies: true,
            sfccOrigin: 'https://test.com',
            appHostname: 'localhost',
            protocol: 'http',
            hybridRoutingRules: ['http.request.uri.path eq "/test"'],
            mobify: {app: {siteAliases: {RefArchGlobal: 'global'}, defaultSite: 'RefArchGlobal'}}
        })
        expect(typeof __capturedOptions?.pathRewrite).toBe('function')
        expect(__capturedOptions.pathRewrite('/s/RefArchGlobal/en-GB/cart')).toBe(
            '/s/RefArchGlobal/en-GB/cart'
        )
        expect(__capturedOptions.pathRewrite('/mobify/proxy/api')).toBe('/mobify/proxy/api')
        expect(__capturedOptions.pathRewrite('/on/demandware.static/foo.css')).toBe(
            '/on/demandware.static/foo.css'
        )
    })

    it('pathRewrite rewrites multi-site URL using alias or defaultSite', () => {
        hybridProxy({
            localAllowCookies: true,
            sfccOrigin: 'https://test.com',
            appHostname: 'localhost',
            protocol: 'http',
            hybridRoutingRules: ['http.request.uri.path eq "/test"'],
            mobify: {app: {siteAliases: {RefArchGlobal: 'global'}, defaultSite: 'RefArchGlobal'}}
        })
        expect(__capturedOptions.pathRewrite('/global/en-GB/cart')).toBe(
            '/s/RefArchGlobal/en-GB/cart'
        )
        // No alias match, falls back to defaultSite
        expect(__capturedOptions.pathRewrite('/unknown/en-GB/cart')).toBe(
            '/s/RefArchGlobal/en-GB/cart'
        )
    })

    it('onProxyRes rewrites HTML body and Location header', async () => {
        hybridProxy({
            localAllowCookies: true,
            sfccOrigin: 'https://sfcc.example.com',
            appHostname: 'localhost',
            protocol: 'http',
            hybridRoutingRules: ['http.request.uri.path eq "/"']
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
            sfccOrigin: 'https://sfcc.example.com',
            appHostname: 'localhost',
            protocol: 'http',
            hybridRoutingRules: ['http.request.uri.path eq "/"']
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
            sfccOrigin: 'https://sfcc.example.com',
            appHostname: 'localhost',
            protocol: 'http',
            hybridRoutingRules: ['http.request.uri.path eq "/"']
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
            sfccOrigin: 'https://sfcc.example.com',
            appHostname: 'localhost',
            protocol: 'http',
            hybridRoutingRules: ['http.request.uri.path eq "/"']
        })
        const proxyRes = {headers: {}}
        const res = {}
        __capturedOptions.onProxyRes(proxyRes, {}, res)
        const input = Buffer.from('DATA')
        const result = await __responseInterceptorInner(input)
        expect(result).toBe(input)
    })
})

describe('shouldProxyRequest', () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })
    it('returns false if any rule matches (should not proxy)', () => {
        jest.spyOn(mrtRuleMatcher, 'evaluateRule').mockReturnValue(true)
        expect(shouldProxyRequest(['x'], {a: 1})).toBe(false)
    })
    it('returns true if no rule matches (should proxy)', () => {
        jest.spyOn(mrtRuleMatcher, 'evaluateRule').mockReturnValue(false)
        expect(shouldProxyRequest(['x', 'y'], {a: 1})).toBe(true)
    })
})
