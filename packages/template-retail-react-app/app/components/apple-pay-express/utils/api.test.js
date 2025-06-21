/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClient} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/api'

// Mock fetch properly
const mockFetch = jest.fn()
global.fetch = mockFetch

// Suppress MSW 'Found an unhandled' warnings for this test file
const originalConsoleError = console.error
beforeAll(() => {
    console.error = (...args) => {
        if (typeof args[0] === 'string' && args[0].startsWith('Found an unhandled')) {
            return
        }
        originalConsoleError(...args)
    }
})
afterAll(() => {
    console.error = originalConsoleError
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

            const request = mockFetch.mock.calls[0][0]
            expect(request.url).toBe(`${mockUrl}?siteId=${mockSite.id}&param1=value1`)
            expect(request.method).toBe('GET')
            expect(request.headers.get('Content-Type')).toBe('application/json')
            expect(request.headers.get('authorization')).toBe(`Bearer ${mockToken}`)
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

            const request = mockFetch.mock.calls[0][0]
            expect(request.url).toBe(`${mockUrl}?siteId=${mockSite.id}`)
            expect(request.method).toBe('POST')
            expect(request.headers.get('Content-Type')).toBe('application/json')
            expect(request.headers.get('authorization')).toBe(`Bearer ${mockToken}`)
            expect(request.headers.get('custom')).toBe('header')

            // Check body separately to avoid conditional expect
            const requestBody = await request.text()
            expect(requestBody).toBe(body)
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

            const request = mockFetch.mock.calls[0][0]
            expect(request.url).toBe(`${mockUrl}?siteId=${mockSite.id}`)
            expect(request.method).toBe('GET')
            expect(request.body === null || request.body === undefined).toBe(true)
            expect(request.headers.get('Content-Type')).toBe('application/json')
            expect(request.headers.get('authorization')).toBe(`Bearer ${mockToken}`)
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
