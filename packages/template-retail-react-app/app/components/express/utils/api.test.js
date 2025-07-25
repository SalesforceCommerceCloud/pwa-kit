/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClient} from '@salesforce/retail-react-app/app/components/express/utils/api'

describe('ApiClient', () => {
    let apiClient
    const mockUrl = '/api/test'
    const mockToken = 'test-token'
    const mockSite = {id: 'test-site'}

    beforeEach(() => {
        apiClient = new ApiClient(mockUrl, mockToken, mockSite)
        jest.clearAllMocks()
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
            const mockResponse = {status: 200, json: () => Promise.resolve({data: 'test'})}
            const mockFetch = jest.fn().mockResolvedValue(mockResponse)
            global.fetch = mockFetch

            await apiClient.base('GET', {
                queryParams: {param1: 'value1'}
            })

            expect(mockFetch).toHaveBeenCalledWith(
                `${mockUrl}?siteId=${mockSite.id}&param1=value1`,
                {
                    method: 'GET',
                    body: null,
                    headers: {
                        'Content-Type': 'application/json',
                        authorization: `Bearer ${mockToken}`
                    }
                }
            )
        })

        it('should make a POST request with body and headers', async () => {
            const mockResponse = {status: 200, json: () => Promise.resolve({data: 'test'})}
            const mockFetch = jest.fn().mockResolvedValue(mockResponse)
            global.fetch = mockFetch

            const body = JSON.stringify({test: 'data'})
            const headers = {custom: 'header'}

            await apiClient.base('POST', {
                body,
                headers
            })

            expect(mockFetch).toHaveBeenCalledWith(`${mockUrl}?siteId=${mockSite.id}`, {
                method: 'POST',
                body,
                headers: {
                    'Content-Type': 'application/json',
                    authorization: `Bearer ${mockToken}`,
                    custom: 'header'
                }
            })
        })
    })

    describe('get method', () => {
        it('should call base with GET method', async () => {
            const mockResponse = {status: 200, json: () => Promise.resolve({data: 'test'})}
            const mockFetch = jest.fn().mockResolvedValue(mockResponse)
            global.fetch = mockFetch

            const spy = jest.spyOn(apiClient, 'base')

            await apiClient.get({param: 'value'})

            expect(spy).toHaveBeenCalledWith('get', {param: 'value'})
        })
    })

    describe('post method', () => {
        it('should call base with POST method', async () => {
            const mockResponse = {status: 200, json: () => Promise.resolve({data: 'test'})}
            const mockFetch = jest.fn().mockResolvedValue(mockResponse)
            global.fetch = mockFetch

            const spy = jest.spyOn(apiClient, 'base')

            await apiClient.post({param: 'value'})

            expect(spy).toHaveBeenCalledWith('post', {param: 'value'})
        })
    })
})
