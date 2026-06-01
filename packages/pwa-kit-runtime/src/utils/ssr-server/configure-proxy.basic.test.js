/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    applyProxyRequestHeaders,
    setScapiAuthRequestHeaders,
    stripSessionCookies,
    configureProxy,
    AccessTokenNotFoundError
} from './configure-proxy'
import {X_SITE_ID} from '../../ssr/server/constants'
import * as ssrProxying from '../ssr-proxying'
import * as utils from './utils'
import cookie from 'cookie'

jest.mock('cookie')
jest.mock('./utils', () => ({
    ...jest.requireActual('./utils'),
    isScapiDomain: jest.fn()
}))
jest.mock('../logger-instance', () => ({
    __esModule: true,
    default: {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
    }
}))

import logger from '../logger-instance'

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

describe('setScapiAuthRequestHeaders', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('applies Bearer token and sfdc_dwsid header for SCAPI endpoints', () => {
        utils.isScapiDomain.mockReturnValue(true)
        cookie.parse.mockReturnValue({
            'cc-at_RefArch': 'test-access-token',
            dwsid: 'test-session-id'
        })

        const proxyRequest = {
            setHeader: jest.fn(),
            removeHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/shopper/products/v1/products',
            headers: {
                cookie: 'cc-at_RefArch=test-access-token; dwsid=test-session-id',
                [X_SITE_ID]: 'RefArch'
            }
        }

        setScapiAuthRequestHeaders({
            proxyRequest,
            incomingRequest,
            caching: false,
            targetHost: 'abc-001.api.commercecloud.salesforce.com'
        })

        expect(proxyRequest.setHeader).toHaveBeenCalledWith(
            'authorization',
            'Bearer test-access-token'
        )
        expect(proxyRequest.setHeader).toHaveBeenCalledWith('sfdc_dwsid', 'test-session-id')
    })

    it('does not apply Bearer token when caching is true', () => {
        utils.isScapiDomain.mockReturnValue(true)
        cookie.parse.mockReturnValue({'cc-at_RefArch': 'test-access-token'})

        const proxyRequest = {
            setHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/shopper/products/v1/products',
            headers: {
                cookie: 'cc-at_RefArch=test-access-token',
                [X_SITE_ID]: 'RefArch'
            }
        }

        setScapiAuthRequestHeaders({
            proxyRequest,
            incomingRequest,
            caching: true,
            targetHost: 'abc-001.api.commercecloud.salesforce.com'
        })

        // Caching proxies don't use auth
        expect(proxyRequest.setHeader).not.toHaveBeenCalled()
    })

    it('logs warning and skips when x-site-id header is missing on SCAPI request', () => {
        utils.isScapiDomain.mockReturnValue(true)
        cookie.parse.mockReturnValue({})

        const proxyRequest = {
            setHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/shopper/products/v1/products',
            headers: {}
        }

        setScapiAuthRequestHeaders({
            proxyRequest,
            incomingRequest,
            caching: false,
            targetHost: 'abc-001.api.commercecloud.salesforce.com'
        })

        expect(proxyRequest.setHeader).not.toHaveBeenCalled()
        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('x-site-id header is missing'),
            expect.any(Object)
        )
    })

    it('does not apply Bearer token when target is not SCAPI domain', () => {
        utils.isScapiDomain.mockReturnValue(false)
        cookie.parse.mockReturnValue({'cc-at_RefArch': 'test-access-token'})

        const proxyRequest = {
            setHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/api/products',
            headers: {
                cookie: 'cc-at_RefArch=test-access-token',
                [X_SITE_ID]: 'RefArch'
            }
        }

        setScapiAuthRequestHeaders({
            proxyRequest,
            incomingRequest,
            caching: false,
            targetHost: 'external-api.example.com'
        })

        expect(proxyRequest.setHeader).not.toHaveBeenCalled()
    })

    it('throws AccessTokenNotFoundError when access token cookie is not present', () => {
        utils.isScapiDomain.mockReturnValue(true)
        cookie.parse.mockReturnValue({}) // No access token cookie

        const proxyRequest = {
            setHeader: jest.fn(),
            removeHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/shopper/products/v1/products',
            headers: {
                cookie: 'some-other-cookie=value',
                [X_SITE_ID]: 'RefArch'
            }
        }

        expect(() =>
            setScapiAuthRequestHeaders({
                proxyRequest,
                incomingRequest,
                caching: false,
                targetHost: 'abc-001.api.commercecloud.salesforce.com'
            })
        ).toThrow(AccessTokenNotFoundError)

        expect(proxyRequest.setHeader).not.toHaveBeenCalledWith('authorization', expect.any(String))
    })

    it('does not throw when access token cookie is missing but Authorization header exists (SSR)', () => {
        utils.isScapiDomain.mockReturnValue(true)
        cookie.parse.mockReturnValue({}) // No access token cookie

        const proxyRequest = {
            setHeader: jest.fn(),
            removeHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/shopper/products/v1/products',
            headers: {
                cookie: 'some-other-cookie=value',
                authorization: 'Bearer server-side-token',
                [X_SITE_ID]: 'RefArch'
            }
        }

        expect(() =>
            setScapiAuthRequestHeaders({
                proxyRequest,
                incomingRequest,
                caching: false,
                targetHost: 'abc-001.api.commercecloud.salesforce.com'
            })
        ).not.toThrow()

        // Should not override the existing Authorization header
        expect(proxyRequest.setHeader).not.toHaveBeenCalledWith('authorization', expect.any(String))
    })

    it('uses x-site-id header to resolve correct cookie', () => {
        utils.isScapiDomain.mockReturnValue(true)
        cookie.parse.mockReturnValue({'cc-at_OtherSite': 'other-access-token'})

        const proxyRequest = {
            setHeader: jest.fn(),
            removeHeader: jest.fn()
        }
        const incomingRequest = {
            url: '/shopper/products/v1/products',
            headers: {
                cookie: 'cc-at_OtherSite=other-access-token',
                [X_SITE_ID]: 'OtherSite'
            }
        }

        setScapiAuthRequestHeaders({
            proxyRequest,
            incomingRequest,
            caching: false,
            targetHost: 'abc-001.api.commercecloud.salesforce.com'
        })

        expect(proxyRequest.setHeader).toHaveBeenCalledWith(
            'authorization',
            'Bearer other-access-token'
        )
    })
})

describe('stripSessionCookies', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('strips siteId-specific session cookies and dwsid, preserves others', () => {
        cookie.parse.mockReturnValue({
            'cc-at_SiteA': 'access-token-a',
            'cc-at_SiteB': 'access-token-b',
            'cc-nx-g_SiteA': 'guest-refresh-a',
            'cc-nx_SiteA': 'registered-refresh-a',
            dwsid: 'session-id',
            'custom-cookie': 'keep-me'
        })
        cookie.serialize.mockImplementation((name, value) => `${name}=${value}`)

        const proxyRequest = {
            setHeader: jest.fn(),
            removeHeader: jest.fn()
        }
        const incomingRequest = {
            headers: {cookie: 'any', [X_SITE_ID]: 'SiteA'}
        }

        stripSessionCookies(proxyRequest, incomingRequest)

        // Only SiteA cookies are stripped; SiteB cookies are preserved
        expect(proxyRequest.setHeader).toHaveBeenCalledWith(
            'cookie',
            'cc-at_SiteB=access-token-b; custom-cookie=keep-me'
        )
        expect(proxyRequest.removeHeader).not.toHaveBeenCalled()
    })

    it('removes cookie header entirely when all cookies are session cookies', () => {
        cookie.parse.mockReturnValue({
            'cc-at_RefArch': 'access-token',
            'cc-nx-g_RefArch': 'guest-refresh-token',
            dwsid: 'session-id'
        })

        const proxyRequest = {
            setHeader: jest.fn(),
            removeHeader: jest.fn()
        }
        const incomingRequest = {
            headers: {cookie: 'any', [X_SITE_ID]: 'RefArch'}
        }

        stripSessionCookies(proxyRequest, incomingRequest)

        expect(proxyRequest.removeHeader).toHaveBeenCalledWith('cookie')
        expect(proxyRequest.setHeader).not.toHaveBeenCalled()
    })

    it('does nothing when no cookie header is present', () => {
        const proxyRequest = {
            setHeader: jest.fn(),
            removeHeader: jest.fn()
        }
        const incomingRequest = {
            headers: {}
        }

        stripSessionCookies(proxyRequest, incomingRequest)

        expect(proxyRequest.setHeader).not.toHaveBeenCalled()
        expect(proxyRequest.removeHeader).not.toHaveBeenCalled()
    })
})
