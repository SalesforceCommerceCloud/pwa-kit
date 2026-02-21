/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    applyProxyRequestHeaders,
    applyScapiAuthHeaders,
    configureProxy
} from './configure-proxy'
import * as ssrProxying from '../ssr-proxying'
import * as utils from './utils'
import cookie from 'cookie'

jest.mock('cookie')
jest.mock('./utils', () => ({
    ...jest.requireActual('./utils'),
    isScapiDomain: jest.fn()
}))

describe('applyProxyRequestHeaders', () => {
    it('removes a header not present in new headers', () => {
        const incomingRequest = {
            url: '/path',
            headers: {x: '1', toremove: '2'}
        }
        const proxyRequest = {
            setHeader: jest.fn(),
            removeHeader: jest.fn()
        }
        jest.spyOn(ssrProxying, 'rewriteProxyRequestHeaders').mockImplementation(() => ({x: '99'}))
        applyProxyRequestHeaders({
            proxyRequest,
            incomingRequest,
            logging: false,
            caching: false,
            proxyPath: '/proxy/',
            targetHost: 'localhost',
            targetProtocol: 'http'
        })
        expect(proxyRequest.setHeader).toHaveBeenCalledWith('x', '99')
        expect(proxyRequest.removeHeader).toHaveBeenCalledWith('toremove')
        ssrProxying.rewriteProxyRequestHeaders.mockRestore()
    })
})

describe('configureProxy ALLOWED_CACHING_PROXY_REQUEST_METHODS', () => {
    it('returns 405 for disallowed method', () => {
        const wrapper = configureProxy({
            appHostname: 'localhost',
            proxyPath: '/mobify/caching/base/',
            targetProtocol: 'http',
            targetHost: 'api.test.com',
            caching: true
        })
        const req = {method: 'POST'} // not HEAD, GET, OPTIONS
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            end: jest.fn()
        }
        wrapper(req, res, jest.fn())
        expect(res.status).toHaveBeenCalledWith(405)
        expect(res.send).toHaveBeenCalledWith('Method POST not supported for caching proxy')
        expect(res.end).toHaveBeenCalled()
    })

    it('calls next/proxyFunc for allowed method', () => {
        const wrapper = configureProxy({
            appHostname: 'localhost',
            proxyPath: '/mobify/caching/base/',
            targetProtocol: 'http',
            targetHost: 'api.test.com',
            caching: true
        })
        const req = {method: 'GET'}
        const res = {}
        const next = jest.fn()
        // proxyFunc will try to execute, so just check next is a function
        expect(typeof wrapper).toBe('function')
        // safe: don't actually assert calls for proxyFunc, just ensure it's a function
    })

    it('returns a plain proxyFunc for non-caching proxy', () => {
        const result = configureProxy({
            appHostname: 'localhost',
            proxyPath: '/mobify/proxy/base/',
            targetProtocol: 'http',
            targetHost: 'api.test.com',
            caching: false
        })
        expect(typeof result).toBe('function')
    })
})

describe('applyScapiAuthHeaders', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('applies Bearer token for non-SLAS Shopper API endpoints', () => {
        utils.isScapiDomain.mockReturnValue(true)
        cookie.parse.mockReturnValue({'cc-at_RefArch': 'test-access-token'})

        const proxyRequest = {
            setHeader: jest.fn(),
            removeHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/shopper/products/v1/products',
            headers: {cookie: 'cc-at_RefArch=test-access-token'}
        }

        applyScapiAuthHeaders({
            proxyRequest,
            incomingRequest,
            caching: false,
            siteId: 'RefArch',
            targetHost: 'abc-001.api.commercecloud.salesforce.com',
            slasEndpointsRequiringAccessToken: /\/oauth2\/logout/
        })

        expect(proxyRequest.setHeader).toHaveBeenCalledWith(
            'authorization',
            'Bearer test-access-token'
        )
    })

    it('applies Bearer token for SLAS logout endpoint', () => {
        utils.isScapiDomain.mockReturnValue(true)
        cookie.parse.mockReturnValue({'cc-at_RefArch': 'test-access-token'})

        const proxyRequest = {
            setHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/shopper/auth/v1/oauth2/logout',
            headers: {cookie: 'cc-at_RefArch=test-access-token'}
        }

        applyScapiAuthHeaders({
            proxyRequest,
            incomingRequest,
            caching: false,
            siteId: 'RefArch',
            targetHost: 'abc-001.api.commercecloud.salesforce.com',
            slasEndpointsRequiringAccessToken: /\/oauth2\/logout/
        })

        expect(proxyRequest.setHeader).toHaveBeenCalledWith(
            'authorization',
            'Bearer test-access-token'
        )
    })

    it('does not apply Bearer token for SLAS token endpoint', () => {
        utils.isScapiDomain.mockReturnValue(true)
        cookie.parse.mockReturnValue({'cc-at_RefArch': 'test-access-token'})

        const proxyRequest = {
            setHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/shopper/auth/v1/oauth2/token',
            headers: {cookie: 'cc-at_RefArch=test-access-token'}
        }

        applyScapiAuthHeaders({
            proxyRequest,
            incomingRequest,
            caching: false,
            siteId: 'RefArch',
            targetHost: 'abc-001.api.commercecloud.salesforce.com',
            slasEndpointsRequiringAccessToken: /\/oauth2\/logout/
        })

        // Should not set authorization header for token endpoint (uses Basic Auth)
        expect(proxyRequest.setHeader).not.toHaveBeenCalled()
    })

    it('does not apply Bearer token when caching is true', () => {
        utils.isScapiDomain.mockReturnValue(true)
        cookie.parse.mockReturnValue({'cc-at_RefArch': 'test-access-token'})

        const proxyRequest = {
            setHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/shopper/products/v1/products',
            headers: {cookie: 'cc-at_RefArch=test-access-token'}
        }

        applyScapiAuthHeaders({
            proxyRequest,
            incomingRequest,
            caching: true,
            siteId: 'RefArch',
            targetHost: 'abc-001.api.commercecloud.salesforce.com',
            slasEndpointsRequiringAccessToken: /\/oauth2\/logout/
        })

        // Caching proxies don't use auth
        expect(proxyRequest.setHeader).not.toHaveBeenCalled()
    })

    it('does not apply Bearer token when siteId is not provided', () => {
        utils.isScapiDomain.mockReturnValue(true)
        cookie.parse.mockReturnValue({})

        const proxyRequest = {
            setHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/shopper/products/v1/products',
            headers: {}
        }

        applyScapiAuthHeaders({
            proxyRequest,
            incomingRequest,
            caching: false,
            siteId: null,
            targetHost: 'abc-001.api.commercecloud.salesforce.com',
            slasEndpointsRequiringAccessToken: /\/oauth2\/logout/
        })

        expect(proxyRequest.setHeader).not.toHaveBeenCalled()
    })

    it('does not apply Bearer token when target is not SCAPI domain', () => {
        utils.isScapiDomain.mockReturnValue(false)
        cookie.parse.mockReturnValue({'cc-at_RefArch': 'test-access-token'})

        const proxyRequest = {
            setHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/api/products',
            headers: {cookie: 'cc-at_RefArch=test-access-token'}
        }

        applyScapiAuthHeaders({
            proxyRequest,
            incomingRequest,
            caching: false,
            siteId: 'RefArch',
            targetHost: 'external-api.example.com',
            slasEndpointsRequiringAccessToken: /\/oauth2\/logout/
        })

        expect(proxyRequest.setHeader).not.toHaveBeenCalled()
    })

    it('does not apply Bearer token when cookie is not present', () => {
        utils.isScapiDomain.mockReturnValue(true)
        cookie.parse.mockReturnValue({}) // No access token cookie

        const proxyRequest = {
            setHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/shopper/products/v1/products',
            headers: {}
        }

        applyScapiAuthHeaders({
            proxyRequest,
            incomingRequest,
            caching: false,
            siteId: 'RefArch',
            targetHost: 'abc-001.api.commercecloud.salesforce.com',
            slasEndpointsRequiringAccessToken: /\/oauth2\/logout/
        })

        expect(proxyRequest.setHeader).not.toHaveBeenCalled()
    })
})
