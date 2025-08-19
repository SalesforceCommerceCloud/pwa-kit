/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClient} from '@salesforce/retail-react-app/app/components/express/utils/api'

// Mock fetch properly
const mockFetch = jest.fn()

// Mock Headers constructor for Node.js test environment
global.Headers = class MockHeaders {
    constructor(init = {}) {
        this._headers = {...init}
    }

    get(name) {
        return this._headers[name.toLowerCase()] || null
    }

    set(name, value) {
        this._headers[name.toLowerCase()] = value
    }

    has(name) {
        return name.toLowerCase() in this._headers
    }

    append(name, value) {
        if (this.has(name)) {
            this._headers[name.toLowerCase()] += `, ${value}`
        } else {
            this._headers[name.toLowerCase()] = value
        }
    }

    delete(name) {
        delete this._headers[name.toLowerCase()]
    }
}

// Suppress MSW 'Found an unhandled' warnings for this test file
const originalConsoleError = console.error
const originalFetch = global.fetch

beforeAll(() => {
    global.fetch = mockFetch
    console.error = (...args) => {
        if (typeof args[0] === 'string' && args[0].startsWith('Found an unhandled')) {
            return
        }
        originalConsoleError(...args)
    }
})

afterAll(() => {
    global.fetch = originalFetch
    console.error = originalConsoleError
    delete global.Headers
})

describe('ApiClient', () => {
    let apiClient
    const mockToken = 'test-token'
    const mockSite = {id: 'test-site'}
    const mockUrl = '/api/test'

    beforeEach(() => {
        apiClient = new ApiClient(mockUrl, mockToken, mockSite)
        mockFetch.mockClear()
    })

    describe('constructor', () => {
        it('should initialize with correct properties', () => {
            expect(apiClient.url).toBe(mockUrl)
            expect(apiClient.token).toBe(mockToken)
            expect(apiClient.site).toBe(mockSite)
        })
    })

    describe('base method', () => {
        it('should make a GET request with correct parameters', async () => {
            const mockResponse = {
                ok: true,
                json: () => Promise.resolve({}),
                text: () => Promise.resolve(''),
                clone: () => mockResponse,
                headers: new Headers()
            }
            mockFetch.mockResolvedValue(mockResponse)

            await apiClient.base('GET', {
                queryParams: {param1: 'value1'}
            })

            const requestUrl = mockFetch.mock.calls[0][0]
            const requestConfig = mockFetch.mock.calls[0][1]
            expect(requestUrl).toBe(`${mockUrl}?siteId=${mockSite.id}&param1=value1`)
            expect(requestConfig.method).toBe('GET')
            expect(requestConfig.headers['Content-Type']).toBe('application/json')
            expect(requestConfig.headers.authorization).toBe(`Bearer ${mockToken}`)
        })

        it('should make a POST request with body and headers', async () => {
            const mockResponse = {
                ok: true,
                json: () => Promise.resolve({}),
                text: () => Promise.resolve(''),
                clone: () => mockResponse,
                headers: new Headers()
            }
            mockFetch.mockResolvedValue(mockResponse)
            const body = JSON.stringify({test: 'data'})
            const customHeaders = {custom: 'header'}

            await apiClient.base('POST', {
                body,
                headers: customHeaders
            })

            const requestUrl = mockFetch.mock.calls[0][0]
            const requestConfig = mockFetch.mock.calls[0][1]
            expect(requestUrl).toBe(`${mockUrl}?siteId=${mockSite.id}`)
            expect(requestConfig.method).toBe('POST')
            expect(requestConfig.headers['Content-Type']).toBe('application/json')
            expect(requestConfig.headers.authorization).toBe(`Bearer ${mockToken}`)
            expect(requestConfig.headers.custom).toBe('header')

            // Check body separately to avoid conditional expect
            expect(requestConfig.body).toBe(body)
        })

        it('should handle request without optional parameters', async () => {
            const mockResponse = {
                ok: true,
                json: () => Promise.resolve({}),
                text: () => Promise.resolve(''),
                clone: () => mockResponse,
                headers: new Headers()
            }
            mockFetch.mockResolvedValue(mockResponse)

            await apiClient.base('GET')

            const requestUrl = mockFetch.mock.calls[0][0]
            const requestConfig = mockFetch.mock.calls[0][1]
            expect(requestUrl).toBe(`${mockUrl}?siteId=${mockSite.id}`)
            expect(requestConfig.method).toBe('GET')
            expect(requestConfig.body === null || requestConfig.body === undefined).toBe(true)
            expect(requestConfig.headers['Content-Type']).toBe('application/json')
            expect(requestConfig.headers.authorization).toBe(`Bearer ${mockToken}`)
        })
    })

    describe('get method', () => {
        it('should call base with GET method', async () => {
            const mockResponse = {
                ok: true,
                json: () => Promise.resolve({}),
                text: () => Promise.resolve(''),
                clone: () => mockResponse,
                headers: new Headers()
            }
            mockFetch.mockResolvedValue(mockResponse)
            const spy = jest.spyOn(apiClient, 'base')

            await apiClient.get({param: 'value'})

            expect(spy).toHaveBeenCalledWith('get', {param: 'value'})
        })
    })

    describe('post method', () => {
        it('should call base with POST method', async () => {
            const mockResponse = {
                ok: true,
                json: () => Promise.resolve({}),
                text: () => Promise.resolve(''),
                clone: () => mockResponse,
                headers: new Headers()
            }
            mockFetch.mockResolvedValue(mockResponse)
            const spy = jest.spyOn(apiClient, 'base')

            await apiClient.post({param: 'value'})

            expect(spy).toHaveBeenCalledWith('post', {param: 'value'})
        })
    })
})
