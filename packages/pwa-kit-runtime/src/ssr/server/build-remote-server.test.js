/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {isBinary, once, RemoteServerFactory} from './build-remote-server'
import {X_ENCODED_HEADERS} from './constants'
import {default as createEvent} from '@serverless/event-mocks'
import logger from '../../utils/logger-instance'
import {catchAndLog, parseRequestUrl} from '../../utils/ssr-server'
import {applyProxyRequestHeaders} from '../../utils/ssr-server/configure-proxy'

jest.mock('../../utils/ssr-config', () => {
    return {
        getConfig: () => {}
    }
})

jest.mock('../../utils/ssr-server', () => ({
    ...jest.requireActual('../../utils/ssr-server'),
    catchAndLog: jest.fn()
}))
jest.mock('../../utils/logger-instance', () => ({
    __esModule: true,
    default: {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
    }
}))
jest.mock('../../utils/ssr-server/configure-proxy', () => {
    const actual = jest.requireActual('../../utils/ssr-server/configure-proxy')
    return {
        ...actual,
        applyProxyRequestHeaders: jest.fn(actual.applyProxyRequestHeaders)
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

describe('_normalizeSlasPath', () => {
    test('decodes percent-encoded characters', () => {
        expect(RemoteServerFactory._normalizeSlasPath('/oauth2/trusted%2Dsystem/token')).toBe(
            '/oauth2/trusted-system/token'
        )
    })

    test('resolves dot-segment path traversals', () => {
        expect(
            RemoteServerFactory._normalizeSlasPath('/oauth2/token/%2E%2E/trusted-system/token')
        ).toBe('/oauth2/trusted-system/token')
    })

    test('handles combined encoding and traversal', () => {
        expect(
            RemoteServerFactory._normalizeSlasPath('/oauth2/token/%2E%2E/trusted%2Dsystem/token')
        ).toBe('/oauth2/trusted-system/token')
    })

    test('normalizes encoded forward slash in path segment', () => {
        expect(
            RemoteServerFactory._normalizeSlasPath('/oauth2/token/%2E%2E/passwordless%2Flogin')
        ).toBe('/oauth2/passwordless/login')
    })

    test('fully decodes double-encoded paths', () => {
        // %252D → first decode → %2D → second decode → -
        expect(RemoteServerFactory._normalizeSlasPath('/oauth2/trusted%252Dsystem/token')).toBe(
            '/oauth2/trusted-system/token'
        )
    })

    test('fully decodes triple-encoded paths', () => {
        // %25252D → %252D → %2D → -
        expect(RemoteServerFactory._normalizeSlasPath('/oauth2/trusted%25252Dsystem/token')).toBe(
            '/oauth2/trusted-system/token'
        )
    })

    test('fully decodes double-encoded dot-segments', () => {
        // %252E%252E → %2E%2E → ..  then normalize collapses
        expect(
            RemoteServerFactory._normalizeSlasPath('/oauth2/token/%252E%252E/trusted-system/token')
        ).toBe('/oauth2/trusted-system/token')
    })

    test('fully decodes double-encoded forward slash', () => {
        // %252F → %2F → /
        expect(RemoteServerFactory._normalizeSlasPath('/oauth2/passwordless%252Flogin')).toBe(
            '/oauth2/passwordless/login'
        )
    })

    test('returns null on malformed percent encoding', () => {
        const malformed = '/oauth2/%ZZbad/path'
        expect(RemoteServerFactory._normalizeSlasPath(malformed)).toBeNull()
    })

    test('passes through clean paths unchanged', () => {
        expect(RemoteServerFactory._normalizeSlasPath('/shopper/auth/v1/oauth2/token')).toBe(
            '/shopper/auth/v1/oauth2/token'
        )
    })
})

describe('_matchSlasAllowlistEntry', () => {
    const ORG = 'f_ecom_zzrf_001'

    test('matches a known endpoint and returns its injectAuth mode', () => {
        const entry = RemoteServerFactory._matchSlasAllowlistEntry(
            `/shopper/auth/v1/organizations/${ORG}/oauth2/token`,
            'POST'
        )
        expect(entry?.segments).toEqual(['oauth2', 'token'])
        expect(entry?.injectAuth).toBe('basic')
    })

    test('matches trusted-agent/token with sfdc-header mode', () => {
        const entry = RemoteServerFactory._matchSlasAllowlistEntry(
            `/shopper/auth/v1/organizations/${ORG}/oauth2/trusted-agent/token`,
            'POST'
        )
        expect(entry?.injectAuth).toBe('sfdc-header')
    })

    test('matches oauth2/login with no credential injection', () => {
        const entry = RemoteServerFactory._matchSlasAllowlistEntry(
            `/shopper/auth/v1/organizations/${ORG}/oauth2/login`,
            'POST'
        )
        expect(entry?.injectAuth).toBe('none')
    })

    test('matches future API versions via structural prefix', () => {
        const entry = RemoteServerFactory._matchSlasAllowlistEntry(
            `/shopper/auth/v2/organizations/${ORG}/oauth2/token`,
            'POST'
        )
        expect(entry?.segments).toEqual(['oauth2', 'token'])
    })

    test('returns null for endpoints not on the allow-list', () => {
        expect(
            RemoteServerFactory._matchSlasAllowlistEntry(
                `/shopper/auth/v1/organizations/${ORG}/oauth2/some-other-route`,
                'POST'
            )
        ).toBeNull()
    })

    test('returns null for paths outside /shopper/auth', () => {
        expect(
            RemoteServerFactory._matchSlasAllowlistEntry(
                `/shopper/customers/v1/organizations/${ORG}/customers`,
                'GET'
            )
        ).toBeNull()
    })

    test('returns null when the organizations segment is missing', () => {
        expect(
            RemoteServerFactory._matchSlasAllowlistEntry('/shopper/auth/v1/oauth2/token', 'POST')
        ).toBeNull()
    })

    test('returns null when trailing segments do not match an entry', () => {
        expect(
            RemoteServerFactory._matchSlasAllowlistEntry(
                `/shopper/auth/v1/organizations/${ORG}/oauth2/token/extra`,
                'POST'
            )
        ).toBeNull()
    })

    test('returns null on substring-only matches', () => {
        expect(
            RemoteServerFactory._matchSlasAllowlistEntry(
                `/shopper/auth/v1/organizations/${ORG}/oauth2/token-extra`,
                'POST'
            )
        ).toBeNull()
    })

    test('returns null for null input', () => {
        expect(RemoteServerFactory._matchSlasAllowlistEntry(null, 'POST')).toBeNull()
    })

    test.each([
        ['GET', `/shopper/auth/v1/organizations/${ORG}/oauth2/token`],
        ['PUT', `/shopper/auth/v1/organizations/${ORG}/oauth2/token`],
        ['DELETE', `/shopper/auth/v1/organizations/${ORG}/oauth2/token`],
        ['PATCH', `/shopper/auth/v1/organizations/${ORG}/oauth2/passwordless/login`],
        ['GET', `/shopper/auth/v1/organizations/${ORG}/oauth2/passwordless/token`],
        ['POST', `/shopper/auth/v1/organizations/${ORG}/oauth2/trusted-agent/authorize`]
    ])('returns null when method %s is not declared for the endpoint', (method, path) => {
        expect(RemoteServerFactory._matchSlasAllowlistEntry(path, method)).toBeNull()
    })

    test.each([
        ['/shopper/auth/v1\nx/organizations/org1/oauth2/token'],
        ['/shopper/auth/v1\rx/organizations/org1/oauth2/token'],
        ['/shopper/auth/v1\u0000x/organizations/org1/oauth2/token'],
        ['/shopper/auth/v1 x/organizations/org1/oauth2/token'],
        ['/shopper/auth/v1;x/organizations/org1/oauth2/token'],
        ['/shopper/auth/v1:x/organizations/org1/oauth2/token'],
        ['/shopper/auth/v1+x/organizations/org1/oauth2/token'],
        ['/shopper/auth/v1/organizations/org\ny/oauth2/token'],
        ['/shopper/auth/v1/organizations/org\u0000y/oauth2/token'],
        ['/shopper/auth/v1/organizations/org y/oauth2/token'],
        ['/shopper/auth/v1/organizations/org%y/oauth2/token'],
        ['/shopper/auth/v1/organizations/org*y/oauth2/token']
    ])(
        'returns null when version or orgId contains characters outside the allowed set: %s',
        (path) => {
            expect(RemoteServerFactory._matchSlasAllowlistEntry(path, 'POST')).toBeNull()
        }
    )

    test('accepts a custom allow-list passed by the project', () => {
        const customList = [
            {segments: ['oauth2', 'my-experiment'], methods: ['POST'], injectAuth: 'basic'}
        ]
        const entry = RemoteServerFactory._matchSlasAllowlistEntry(
            `/shopper/auth/v1/organizations/${ORG}/oauth2/my-experiment`,
            'POST',
            customList
        )
        expect(entry?.segments).toEqual(['oauth2', 'my-experiment'])
        expect(entry?.injectAuth).toBe('basic')
    })

    test('a custom allow-list replaces, does not extend, the default', () => {
        const customList = [
            {segments: ['oauth2', 'my-experiment'], methods: ['POST'], injectAuth: 'basic'}
        ]
        expect(
            RemoteServerFactory._matchSlasAllowlistEntry(
                `/shopper/auth/v1/organizations/${ORG}/oauth2/token`,
                'POST',
                customList
            )
        ).toBeNull()
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

    describe('_configure deprecation warnings', () => {
        beforeEach(() => {
            logger.warn.mockClear()
        })

        test('warns when applySLASPrivateClientToEndpoints is set', () => {
            RemoteServerFactory._configure({
                mobify: {
                    app: {
                        commerceAPI: {
                            parameters: {clientId: 'c', shortCode: 's'}
                        }
                    }
                },
                applySLASPrivateClientToEndpoints: /\/oauth2\/trusted-system/
            })
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('`applySLASPrivateClientToEndpoints` is deprecated'),
                expect.objectContaining({namespace: 'RemoteServerFactory._configure'})
            )
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('narrowing-only filter'),
                expect.anything()
            )
        })

        test('does not warn when applySLASPrivateClientToEndpoints is not set', () => {
            RemoteServerFactory._configure({
                mobify: {
                    app: {
                        commerceAPI: {
                            parameters: {clientId: 'c', shortCode: 's'}
                        }
                    }
                }
            })
            expect(logger.warn).not.toHaveBeenCalledWith(
                expect.stringContaining('`applySLASPrivateClientToEndpoints` is deprecated'),
                expect.anything()
            )
        })
    })

    describe('_setupSlasPrivateClientProxy override warning', () => {
        let mockExpress
        const baseOptions = () =>
            RemoteServerFactory._configure({
                useSLASPrivateClient: true,
                mobify: {
                    app: {
                        commerceAPI: {
                            parameters: {
                                clientId: 'test-client-id',
                                shortCode: 'test',
                                organizationId: 'f_ecom_test'
                            }
                        }
                    }
                }
            })

        beforeEach(() => {
            mockExpress = require('express')
            logger.warn.mockClear()
            process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'test-secret'
        })

        afterEach(() => {
            delete process.env.PWA_KIT_SLAS_CLIENT_SECRET
        })

        test('warns when slasPrivateClientAllowList is overridden', () => {
            const app = mockExpress()
            RemoteServerFactory._setupSlasPrivateClientProxy(app, {
                ...baseOptions(),
                slasPrivateClientAllowList: [
                    {segments: ['oauth2', 'token'], methods: ['POST'], injectAuth: 'basic'}
                ]
            })
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('custom `slasPrivateClientAllowList` is in use'),
                expect.objectContaining({namespace: '_setupSlasPrivateClientProxy'})
            )
        })

        test('does not warn when slasPrivateClientAllowList is not set', () => {
            const app = mockExpress()
            RemoteServerFactory._setupSlasPrivateClientProxy(app, baseOptions())
            expect(logger.warn).not.toHaveBeenCalledWith(
                expect.stringContaining('custom `slasPrivateClientAllowList` is in use'),
                expect.anything()
            )
        })
    })

    describe('applySLASPrivateClientToEndpoints narrowing-only fallback', () => {
        let mockExpress
        const baseOptions = () =>
            RemoteServerFactory._configure({
                useSLASPrivateClient: true,
                mobify: {
                    app: {
                        commerceAPI: {
                            parameters: {
                                clientId: 'test-client-id',
                                shortCode: 'test',
                                organizationId: 'f_ecom_test'
                            }
                        }
                    }
                }
            })

        beforeEach(() => {
            mockExpress = require('express')
            logger.warn.mockClear()
            process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'test-secret'
        })

        afterEach(() => {
            delete process.env.PWA_KIT_SLAS_CLIENT_SECRET
        })

        test('does not emit the "removed every entry" warning when the regex matches at least one entry', () => {
            const app = mockExpress()
            RemoteServerFactory._setupSlasPrivateClientProxy(app, {
                ...baseOptions(),
                applySLASPrivateClientToEndpoints: /\/oauth2\/token/
            })
            expect(logger.warn).not.toHaveBeenCalledWith(
                expect.stringContaining('removed every entry'),
                expect.anything()
            )
        })

        test('emits "removed every entry" warning when the regex matches nothing', () => {
            const app = mockExpress()
            RemoteServerFactory._setupSlasPrivateClientProxy(app, {
                ...baseOptions(),
                applySLASPrivateClientToEndpoints: /\/nothing-matches-this/
            })
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('removed every entry'),
                expect.objectContaining({namespace: '_setupSlasPrivateClientProxy'})
            )
        })

        test('a non-RegExp value for applySLASPrivateClientToEndpoints is ignored by the filter', () => {
            const app = mockExpress()
            RemoteServerFactory._setupSlasPrivateClientProxy(app, {
                ...baseOptions(),
                applySLASPrivateClientToEndpoints: 'not a regex'
            })
            expect(logger.warn).not.toHaveBeenCalledWith(
                expect.stringContaining('removed every entry'),
                expect.anything()
            )
        })
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
        logger.error.mockClear()
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

    test('returns 403 for trusted-system paths with percent-encoded hyphen', async () => {
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
            '/mobify/slas/private/shopper/auth/v1/oauth2/trusted%2Dsystem/token'
        )

        expect(response.status).toBe(403)
    })

    test('returns 403 for trusted-system paths reached via encoded dot-segments', async () => {
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
            '/mobify/slas/private/shopper/auth/v1/oauth2/token/%2E%2E/trusted%2Dsystem/token'
        )

        expect(response.status).toBe(403)
    })

    test('invokes onSLASPrivateProxyReq callback and onSLASPrivateProxyRes callback', async () => {
        // Create a mock SLAS endpoint for the http-proxy to consume
        const mockSlasServer = mockExpress()
        mockSlasServer.post(
            '/shopper/auth/v1/organizations/f_ecom_test/oauth2/token',
            (req, res) => {
                // Reflect the custom header back in the response to verify it was set
                res.status(200).json({
                    access_token: 'mock-token',
                    reflected_header: req.headers['x-custom-request-header']
                })
            }
        )

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
                '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/token'
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

    test('returns 500 when onProxyReq logic throws', async () => {
        const mockSlasServer = mockExpress()
        mockSlasServer.post(
            '/shopper/auth/v1/organizations/f_ecom_test/oauth2/token',
            (req, res) => {
                res.status(200).json({access_token: 'mock-token'})
            }
        )

        const mockSlasServerInstance = mockSlasServer.listen(0)
        const mockSlasPort = mockSlasServerInstance.address().port

        try {
            const app = mockExpress()
            const options = RemoteServerFactory._configure({
                useSLASPrivateClient: true,
                slasTarget: `http://localhost:${mockSlasPort}`,
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

            applyProxyRequestHeaders.mockImplementationOnce(() => {
                throw new Error('boom')
            })

            RemoteServerFactory._setupSlasPrivateClientProxy(app, options)

            const response = await request(app).post(
                '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/token'
            )

            expect(response.status).toBe(500)
            expect(response.body).toEqual({
                message: 'Error preparing SLAS private proxy request'
            })
            expect(logger.error).toHaveBeenCalledWith(
                'Error in SLAS private proxy request handling',
                expect.objectContaining({
                    namespace: '_setupSlasPrivateClientProxy'
                })
            )
        } finally {
            mockSlasServerInstance.close()
        }
    })

    test('returns 500 when proxy emits an error', async () => {
        const app = mockExpress()
        const options = RemoteServerFactory._configure({
            useSLASPrivateClient: true,
            slasTarget: 'http://127.0.0.1:1',
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
            '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/token'
        )

        expect(response.status).toBe(500)
        expect(response.body).toEqual({
            message: 'Error in SLAS private proxy request'
        })
        expect(logger.error).toHaveBeenCalledWith(
            'Error in SLAS private proxy',
            expect.objectContaining({
                namespace: '_setupSlasPrivateClientProxy'
            })
        )
    })
})

describe('errorHandlerMiddleware logic', () => {
    it('calls sendMetric and sendStatus(500) when error is handled', () => {
        catchAndLog.mockImplementation(() => {})
        const req = {app: {sendMetric: jest.fn()}}
        const res = {sendStatus: jest.fn()}
        const err = new Error('fail')
        // Inlined errorHandlerMiddleware logic
        catchAndLog(err)
        req.app.sendMetric('RenderErrors')
        res.sendStatus(500)
        expect(req.app.sendMetric).toHaveBeenCalledWith('RenderErrors')
        expect(res.sendStatus).toHaveBeenCalledWith(500)
    })
})

describe('_setRequestId', () => {
    it('sets requestId from correlationId header', () => {
        const app = {use: jest.fn()}
        RemoteServerFactory._setRequestId(app)
        // Grab the actual middleware
        const mw = app.use.mock.calls[0][0]
        const req = {headers: {'x-correlation-id': 'abc'}}
        const res = {locals: {}}
        const next = jest.fn()
        mw(req, res, next)
        expect(res.locals.requestId).toBe('abc')
        expect(next).toHaveBeenCalled()
    })
    it('sets requestId from x-apigateway-event header', () => {
        const app = {use: jest.fn()}
        RemoteServerFactory._setRequestId(app)
        const mw = app.use.mock.calls[0][0]
        const req = {headers: {'x-apigateway-event': 'eventid'}}
        const res = {locals: {}}
        const next = jest.fn()
        mw(req, res, next)
        expect(res.locals.requestId).toBe('eventid')
        expect(next).toHaveBeenCalled()
    })
    it('logs error if no id headers', () => {
        const app = {use: jest.fn()}
        RemoteServerFactory._setRequestId(app)
        const mw = app.use.mock.calls[0][0]
        const req = {headers: {}}
        const res = {locals: {}}
        const next = jest.fn()
        mw(req, res, next)
        expect(logger.error).toHaveBeenCalledWith(
            'Both x-correlation-id and x-apigateway-event headers are missing',
            expect.objectContaining({namespace: '_setRequestId'})
        )
        expect(next).toHaveBeenCalled()
    })
})

describe('_setupHybridProxy', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should call app.use with hybridProxy when enabled', () => {
        const mockApp = {use: jest.fn()}
        const options = {
            localAllowCookies: true,
            hybridProxy: {
                enabled: true,
                sfccOrigin: 'https://test.com',
                routingRules: ['http.request.uri.path eq "/test"']
            }
        }

        RemoteServerFactory._setupHybridProxy(mockApp, options)

        expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function))
        expect(mockApp.use).toHaveBeenCalledTimes(1)
    })

    it('should not call app.use when hybridProxy is disabled', () => {
        const mockApp = {use: jest.fn()}
        const options = {
            hybridProxy: {
                enabled: false,
                sfccOrigin: 'https://test.com',
                routingRules: ['http.request.uri.path eq "/test"']
            }
        }

        RemoteServerFactory._setupHybridProxy(mockApp, options)

        expect(mockApp.use).not.toHaveBeenCalled()
    })

    it('should not call app.use when hybridProxy is undefined', () => {
        const mockApp = {use: jest.fn()}
        const options = {}

        RemoteServerFactory._setupHybridProxy(mockApp, options)

        expect(mockApp.use).not.toHaveBeenCalled()
    })

    it('should not call app.use when hybridProxy is null', () => {
        const mockApp = {use: jest.fn()}
        const options = {
            hybridProxy: null
        }

        RemoteServerFactory._setupHybridProxy(mockApp, options)

        expect(mockApp.use).not.toHaveBeenCalled()
    })

    it('should not call app.use when hybridProxy.enabled is undefined', () => {
        const mockApp = {use: jest.fn()}
        const options = {
            hybridProxy: {
                sfccOrigin: 'https://test.com',
                routingRules: ['http.request.uri.path eq "/test"']
            }
        }

        RemoteServerFactory._setupHybridProxy(mockApp, options)

        expect(mockApp.use).not.toHaveBeenCalled()
    })

    it('should call app.use when hybridProxy.enabled is explicitly true', () => {
        const mockApp = {use: jest.fn()}
        const options = {
            localAllowCookies: true,
            hybridProxy: {
                enabled: true,
                sfccOrigin: 'https://test.com',
                routingRules: ['http.request.uri.path eq "/test"']
            }
        }

        RemoteServerFactory._setupHybridProxy(mockApp, options)

        expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function))
        expect(mockApp.use).toHaveBeenCalledTimes(1)
    })

    it('should call app.use when hybridProxy.enabled is truthy string', () => {
        const mockApp = {use: jest.fn()}
        const options = {
            localAllowCookies: true,
            hybridProxy: {
                enabled: 'true', // truthy string
                sfccOrigin: 'https://test.com',
                routingRules: ['http.request.uri.path eq "/test"']
            }
        }

        RemoteServerFactory._setupHybridProxy(mockApp, options)

        expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function))
        expect(mockApp.use).toHaveBeenCalledTimes(1)
    })

    it('should not call app.use when hybridProxy.enabled is falsy', () => {
        const mockApp = {use: jest.fn()}
        const falsyValues = [false, 0, '', null, undefined]

        falsyValues.forEach((falsyValue) => {
            jest.clearAllMocks()
            const options = {
                hybridProxy: {
                    enabled: falsyValue,
                    sfccOrigin: 'https://test.com',
                    routingRules: ['http.request.uri.path eq "/test"']
                }
            }

            RemoteServerFactory._setupHybridProxy(mockApp, options)

            expect(mockApp.use).not.toHaveBeenCalled()
        })
    })
})

describe('parseRequestUrl', () => {
    const mockReq = (overrides = {}) => ({
        url: '/test?a=1',
        headers: {},
        ...overrides
    })

    test('parses a basic URL with query string', () => {
        const result = parseRequestUrl(mockReq({url: '/path?key=value'}))
        expect(result.pathname).toBe('/path')
        expect(result.search).toBe('?key=value')
        expect(result.query).toBe('key=value')
    })

    test('handles URL with empty query string (trailing ?)', () => {
        const result = parseRequestUrl(mockReq({url: '/path?'}))
        expect(result.pathname).toBe('/path')
        expect(result.search).toBe('')
        expect(result.query).toBeNull()
    })

    test('handles URL without any query string', () => {
        const result = parseRequestUrl(mockReq({url: '/path'}))
        expect(result.pathname).toBe('/path')
        expect(result.search).toBe('')
        expect(result.query).toBeNull()
    })

    test('handles URL with special characters in query', () => {
        const result = parseRequestUrl(mockReq({url: '/path?q=hello+world&lang=en%20US'}))
        expect(result.pathname).toBe('/path')
        expect(result.query).toContain('hello')
    })

    test('handles URL with fragment', () => {
        const result = parseRequestUrl(mockReq({url: '/path?a=1#section'}))
        expect(result.pathname).toBe('/path')
        expect(result.search).toBe('?a=1')
        expect(result.query).toBe('a=1')
    })

    test('handles URL with encoded path', () => {
        const result = parseRequestUrl(mockReq({url: '/caf%C3%A9?a=1'}))
        expect(result.pathname).toBe('/caf%C3%A9')
        expect(result.query).toBe('a=1')
    })

    test('handles URL with unicode characters', () => {
        expect(() => parseRequestUrl(mockReq({url: '/path/日本語?a=1'}))).not.toThrow()
    })

    test('handles URL with long path', () => {
        const longPath = '/a'.repeat(500)
        const result = parseRequestUrl(mockReq({url: `${longPath}?x=1`}))
        expect(result.pathname).toBe(longPath)
        expect(result.query).toBe('x=1')
    })

    test('handles URL with multiple query parameters', () => {
        const result = parseRequestUrl(mockReq({url: '/path?a=1&b=2&c=3'}))
        expect(result.query).toBe('a=1&b=2&c=3')
    })

    test('handles URL with valueless parameter', () => {
        const result = parseRequestUrl(mockReq({url: '/path?flag'}))
        expect(result.query).toBe('flag')
    })

    test('handles malformed URL gracefully by using localhost fallback', () => {
        expect(() => parseRequestUrl(mockReq({url: '/path?a=1'}))).not.toThrow()
    })

    describe('dynamic base URL construction', () => {
        test('uses request protocol when available', () => {
            const result = parseRequestUrl(mockReq({url: '/test', protocol: 'https'}))
            expect(result.pathname).toBe('/test')
        })

        test('falls back to http when no protocol info exists', () => {
            const result = parseRequestUrl(mockReq({url: '/test'}))
            expect(result.pathname).toBe('/test')
        })

        test('detects https from socket.encrypted', () => {
            const result = parseRequestUrl(mockReq({url: '/test', socket: {encrypted: true}}))
            expect(result.pathname).toBe('/test')
        })

        test('uses host header when available', () => {
            const result = parseRequestUrl(
                mockReq({url: '/test?a=1', headers: {host: 'example.com'}})
            )
            expect(result.pathname).toBe('/test')
            expect(result.query).toBe('a=1')
        })

        test('falls back to localhost when no host header', () => {
            const result = parseRequestUrl(mockReq({url: '/test?a=1'}))
            expect(result.pathname).toBe('/test')
            expect(result.query).toBe('a=1')
        })

        test('prefers req.protocol over socket.encrypted', () => {
            const result = parseRequestUrl(
                mockReq({url: '/test', protocol: 'https', socket: {encrypted: false}})
            )
            expect(result.pathname).toBe('/test')
        })
    })
})

describe('URL reconstruction for request processing', () => {
    test('reconstructs URL with modified path', () => {
        const req = {url: '/original/path?a=1', headers: {}}
        const {search} = parseRequestUrl(req)
        const newUrl = '/new/path' + search
        expect(newUrl).toBe('/new/path?a=1')
    })

    test('reconstructs URL with modified querystring', () => {
        const updatedPath = '/path'
        const search = '?b=2'
        const newUrl = updatedPath + search
        expect(newUrl).toBe('/path?b=2')
    })

    test('reconstructs URL with empty querystring', () => {
        const updatedPath = '/path'
        const search = ''
        const newUrl = updatedPath + search
        expect(newUrl).toBe('/path')
    })

    test('reconstructs URL preserving query when only path changes', () => {
        const req = {url: '/base/mobify/bundle?v=1&t=2', headers: {}}
        const {search} = parseRequestUrl(req)
        const cleanPath = '/mobify/bundle'
        const newUrl = cleanPath + search
        expect(newUrl).toBe('/mobify/bundle?v=1&t=2')
    })
})
