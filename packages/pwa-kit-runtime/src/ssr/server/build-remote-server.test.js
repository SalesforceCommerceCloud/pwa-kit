/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {once, RemoteServerFactory, isBinary} from './build-remote-server'
import {X_ENCODED_HEADERS} from './constants'
import {default as createEvent} from '@serverless/event-mocks'

jest.mock('../../utils/ssr-config', () => {
    return {
        getConfig: () => {}
    }
})

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

describe('remote server factory test coverage', () => {
    test('getSlasEndpoint returns undefined if useSLASPrivateClient is false', () => {
        const endpoint = RemoteServerFactory._getSlasEndpoint({})
        expect(endpoint).toBeUndefined()
    })

    test('getSlasEndpoint returns endpoint if useSLASPrivateClient is true', () => {
        const endpoint = RemoteServerFactory._getSlasEndpoint({useSLASPrivateClient: true})
        expect(endpoint).toBeDefined()
    })
})

describe('encodeNonAsciiHttpHeaders flag in options to createHandler', () => {
    test('encodes request headers', () => {
        const mockApp = {
            sendMetric: jest.fn(),
            _requestMonitor: {
                _waitForResponses: jest.fn(() => Promise.resolve())
            },
            metrics: {
                flush: jest.fn()
            }
        }

        const mockOptions = {
            encodeNonAsciiHttpHeaders: true
        }

        const originalHeaders = {
            'x-non-ascii-header-one': 'テスト',
            'x-non-ascii-header-two': '测试',
            'x-regular-header': 'ascii-str'
        }

        const event = createEvent('aws:apiGateway', {
            path: '/',
            body: undefined,
            headers: {...originalHeaders}
        })

        const expectedHeaders = {
            'x-non-ascii-header-one': '%E3%83%86%E3%82%B9%E3%83%88',
            'x-non-ascii-header-two': '%E6%B5%8B%E8%AF%95',
            'x-encoded-headers': 'x-non-ascii-header-one,x-non-ascii-header-two',
            'x-regular-header': 'ascii-str'
        }

        const {handler} = RemoteServerFactory._createHandler(mockApp, mockOptions)
        expect(event.headers).toMatchObject(originalHeaders)
        handler(event, {}, () => {})
        expect(event.headers).toMatchObject(expectedHeaders)
        expect(decodeURIComponent(event.headers['x-non-ascii-header-one'])).toEqual(
            originalHeaders['x-non-ascii-header-one']
        )
    })

    test('encodes response headers', () => {
        const mockApp = {
            use: jest.fn()
        }

        const mockOptions = {
            encodeNonAsciiHttpHeaders: true
        }

        const res = {
            headers: {},
            setHeader: (key, value) => {
                res.headers[key] = value
            },
            getHeader: (key) => {
                return res.headers[key]
            }
        }

        const nonASCIIheader = 'x-non-ascii-header'
        const nonASCIIstr = 'テスト'
        const expectedEncoding = '%E3%83%86%E3%82%B9%E3%83%88'

        const regularHeaderKey = 'x-regular-header'
        const regularHeaderValue = 'ascii-str'

        RemoteServerFactory._setupCommonMiddleware(mockApp, mockOptions)
        const encodeNonAsciiMiddleware = mockApp.use.mock.calls[3][0]

        res.setHeader(nonASCIIheader, nonASCIIstr)
        expect(res.getHeader(nonASCIIheader)).toEqual(nonASCIIstr)

        encodeNonAsciiMiddleware({}, res, () => {})

        res.setHeader(nonASCIIheader, nonASCIIstr)
        expect(res.getHeader(nonASCIIheader)).toEqual(expectedEncoding)
        expect(decodeURI(expectedEncoding)).toEqual(nonASCIIstr)
        expect(res.getHeader(X_ENCODED_HEADERS)).toEqual(nonASCIIheader)

        // confirm ASCII headers are not modified
        res.setHeader(regularHeaderKey, regularHeaderValue)
        expect(res.getHeader(regularHeaderKey)).toEqual(regularHeaderValue)
    })
})

describe('isBinary function', () => {
    test('returns true if the content type is binary', () => {
        const headers = {
            'content-type': 'application/json'
        }
        expect(isBinary(headers)).toBe(true)
    })

    test('returns false if neither content type nor content encoding is binary', () => {
        const headers = {
            'content-type': 'text/plain',
            'content-encoding': 'identity'
        }
        expect(isBinary(headers)).toBe(false)
    })

    test('returns false if headers are empty', () => {
        const headers = {}
        expect(isBinary(headers)).toBe(false)
    })

    test('returns false if content type is non-binary and content encoding is missing', () => {
        const headers = {
            'content-type': 'text/html'
        }
        expect(isBinary(headers)).toBe(false)
    })
})

describe('SLAS private proxy', () => {
    let request
    let mockExpress

    beforeEach(() => {
        // Mock express application
        mockExpress = require('express')
        request = require('supertest')
    })

    afterEach(() => {
        // Clean up environment variables
        delete process.env.PWA_KIT_SLAS_CLIENT_SECRET
    })

    test('returns 404 when useSLASPrivateClient is false', async () => {
        const app = mockExpress()
        const options = {
            useSLASPrivateClient: false,
            mobify: {
                app: {
                    commerceAPI: {
                        parameters: {
                            shortCode: 'test',
                            clientId: 'test-client-id'
                        }
                    }
                }
            }
        }

        RemoteServerFactory._setupSlasPrivateClientProxy(app, options)

        // Attempt to access the SLAS private proxy path
        const response = await request(app).get('/mobify/slas/private/shopper/auth/v1/oauth2/token')

        expect(response.status).toBe(404)
    })

    test('returns 501 when useSLASPrivateClient is true but no secret is set', async () => {
        const app = mockExpress()
        const options = RemoteServerFactory._configure({
            useSLASPrivateClient: true,
            mobify: {
                app: {
                    commerceAPI: {
                        parameters: {
                            shortCode: 'test',
                            organizationId: 'f_ecom_test',
                            clientId: 'test-client-id'
                        }
                    }
                }
            }
        })

        RemoteServerFactory._setupSlasPrivateClientProxy(app, options)

        const response = await request(app).get('/mobify/slas/private/shopper/auth/v1/oauth2/token')

        expect(response.status).toBe(501)
    })

    test('returns 403 for non-SLAS auth paths', async () => {
        const app = mockExpress()
        const options = RemoteServerFactory._configure({
            useSLASPrivateClient: true,
            mobify: {
                app: {
                    commerceAPI: {
                        parameters: {
                            shortCode: 'test',
                            organizationId: 'f_ecom_test',
                            clientId: 'test-client-id'
                        }
                    }
                }
            }
        })

        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'test-secret'

        RemoteServerFactory._setupSlasPrivateClientProxy(app, options)

        const response = await request(app).get('/mobify/slas/private/shopper/products/v1')

        expect(response.status).toBe(403)
    })

    test('returns 403 for trusted-system paths', async () => {
        const app = mockExpress()
        const options = RemoteServerFactory._configure({
            useSLASPrivateClient: true,
            mobify: {
                app: {
                    commerceAPI: {
                        parameters: {
                            shortCode: 'test',
                            organizationId: 'f_ecom_test',
                            clientId: 'test-client-id'
                        }
                    }
                }
            }
        })

        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'test-secret'

        RemoteServerFactory._setupSlasPrivateClientProxy(app, options)

        const response = await request(app).post(
            '/mobify/slas/private/shopper/auth/v1/oauth2/trusted-system/token'
        )

        expect(response.status).toBe(403)
    })

    test('invokes onSLASPrivateProxyReq callback and onSLASPrivateProxyRes callback', async () => {
        // Create a mock SLAS endpoint for the http-proxy to consume
        const mockSlasServer = mockExpress()
        mockSlasServer.post('/shopper/auth/v1/oauth2/token', (req, res) => {
            // Reflect the custom header back in the response to verify it was set
            res.status(200).json({
                access_token: 'mock-token',
                reflected_header: req.headers['x-custom-request-header']
            })
        })

        const mockSlasServerInstance = mockSlasServer.listen(0)
        const mockSlasPort = mockSlasServerInstance.address().port

        try {
            const onSLASPrivateProxyReqMock = jest.fn((proxyRequest) => {
                proxyRequest.setHeader('X-Custom-Request-Header', 'CustomRequestValue')
            })

            const onSLASPrivateProxyResMock = jest.fn((responseBuffer, proxyRes, req, res) => {
                // Add a custom response header
                res.setHeader('X-Custom-Response-Header', 'CustomResponseValue')
                return responseBuffer
            })

            const app = mockExpress()
            const options = RemoteServerFactory._configure({
                useSLASPrivateClient: true,
                slasTarget: `http://localhost:${mockSlasPort}`,
                onSLASPrivateProxyReq: onSLASPrivateProxyReqMock,
                onSLASPrivateProxyRes: onSLASPrivateProxyResMock,
                mobify: {
                    app: {
                        commerceAPI: {
                            parameters: {
                                shortCode: 'test',
                                organizationId: 'f_ecom_test',
                                clientId: 'test-client-id'
                            }
                        }
                    }
                }
            })

            process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'test-secret'

            RemoteServerFactory._setupSlasPrivateClientProxy(app, options)

            const response = await request(app).post(
                '/mobify/slas/private/shopper/auth/v1/oauth2/token'
            )

            // Verify the request was successful
            expect(response.status).toBe(200)

            // Verify the callbacks were invoked
            expect(onSLASPrivateProxyReqMock).toHaveBeenCalled()
            expect(onSLASPrivateProxyResMock).toHaveBeenCalled()

            // Verify the custom request header was added (reflected back in response)
            expect(response.body.reflected_header).toBe('CustomRequestValue')

            // Verify the custom response header was added
            expect(response.headers['x-custom-response-header']).toBe('CustomResponseValue')
        } finally {
            mockSlasServerInstance.close()
        }
    })
})
