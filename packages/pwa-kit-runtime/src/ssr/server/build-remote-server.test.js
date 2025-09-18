/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {once, RemoteServerFactory, isBinary} from './build-remote-server'
import {X_ENCODED_HEADERS} from './constants'
// const createEvent = require('@serverless/event-mocks').default
import {default as createEvent} from '@serverless/event-mocks'
// import {ServerlessAdapter} from '@h4ad/serverless-adapter'
// import {DefaultHandler} from '@h4ad/serverless-adapter/handlers/default'
// import {CallbackResolver} from '@h4ad/serverless-adapter/resolvers/callback'
// import {ApiGatewayV1Adapter} from '@h4ad/serverless-adapter/adapters/aws'
// import {ExpressFramework} from '@h4ad/serverless-adapter/frameworks/express'

jest.mock('../../utils/ssr-config', () => {
    return {
        getConfig: () => {}
    }
})

// jest.mock('@h4ad/serverless-adapter', () => ({
//     ServerlessAdapter: {
//         new: jest.fn(() => ({
//             setFramework: jest.fn().mockReturnThis(),
//             setHandler: jest.fn().mockReturnThis(),
//             setResolver: jest.fn().mockReturnThis(),
//             addAdapter: jest.fn().mockReturnThis(),
//             build: jest.fn().mockReturnValue(jest.fn())
//         }))
//     }
// }))

// jest.mock('@h4ad/serverless-adapter/handlers/default', () => ({
//     DefaultHandler: jest.fn()
// }))

// jest.mock('@h4ad/serverless-adapter/resolvers/callback', () => ({
//     CallbackResolver: jest.fn()
// }))

// jest.mock('@h4ad/serverless-adapter/adapters/aws', () => ({
//     ApiGatewayV1Adapter: jest.fn()
// }))

// jest.mock('@h4ad/serverless-adapter/frameworks/express', () => ({
//     ExpressFramework: jest.fn()
// }))

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
