/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {enhancedFetch, createContextualFetch} from './enhanced-fetch'
import PerformanceTimer from './performance'

// Mock fetch
global.fetch = jest.fn()

// Mock logger
jest.mock('./logger-instance', () => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
}))

// Mock opentelemetry functions
jest.mock('./opentelemetry', () => ({
    createChildSpan: jest.fn(() => ({
        setAttributes: jest.fn(),
        recordException: jest.fn()
    })),
    endSpan: jest.fn()
}))

describe('Enhanced Fetch', () => {
    let mockPerformanceTimer
    let mockResponse
    let mockContext

    beforeEach(() => {
        jest.clearAllMocks()
        
        mockPerformanceTimer = new PerformanceTimer({enabled: true})
        mockPerformanceTimer.addApiTimingFromResponse = jest.fn()
        
        mockResponse = {
            status: 200,
            headers: {
                get: jest.fn((name) => {
                    if (name === 'Server-Timing') {
                        return 'db;dur=53.2, cache;dur=2.1, app;dur=123.45'
                    }
                    if (name === 'content-length') {
                        return '1234'
                    }
                    return null
                })
            }
        }
        
        mockContext = {
            performanceTimer: mockPerformanceTimer,
            req: {
                query: {__server_timing: true}
            }
        }
        
        global.fetch.mockResolvedValue(mockResponse)
    })

    describe('enhancedFetch', () => {
        it('should add sfdc_server_timing header when performance tracking is enabled', async () => {
            const url = 'https://example.com/api/test'
            const options = {
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            }

            await enhancedFetch(url, options, mockContext)

            expect(global.fetch).toHaveBeenCalledWith(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'sfdc_server_timing': '1'
                }
            })
        })

        it('should capture API timing from response headers', async () => {
            const url = 'https://kv7kzm78.api.commercecloud.salesforce.com/commerce/shopper-products/v1/organizations/f_ecom_zzrf_001/product-search'

            await enhancedFetch(url, {}, mockContext)

            expect(mockPerformanceTimer.addApiTimingFromResponse).toHaveBeenCalledWith(
                mockResponse,
                'scapi'
            )
        })

        it('should identify different API sources correctly', async () => {
            const testCases = [
                {url: 'https://zzrf-001.dx.commercecloud.salesforce.com/ocapi/shop/v22_10', expected: 'ocapi'},
                {url: 'https://kv7kzm78.api.commercecloud.salesforce.com/slas/oauth2/token', expected: 'slas'},
                {url: 'https://kv7kzm78.api.commercecloud.salesforce.com/commerce/shopper-products/v1', expected: 'scapi'},
                {url: 'https://some-other-api.com/api/data', expected: 'api'}
            ]

            for (const {url, expected} of testCases) {
                await enhancedFetch(url, {}, mockContext)
                expect(mockPerformanceTimer.addApiTimingFromResponse).toHaveBeenCalledWith(
                    mockResponse,
                    expected
                )
                jest.clearAllMocks()
            }
        })

        it('should not add sfdc_server_timing header when performance tracking is disabled', async () => {
            const contextWithoutTiming = {
                performanceTimer: mockPerformanceTimer,
                req: {query: {}}
            }

            const options = {headers: {'Content-Type': 'application/json'}}
            await enhancedFetch('https://example.com/api/test', options, contextWithoutTiming)

            expect(global.fetch).toHaveBeenCalledWith('https://example.com/api/test', {
                headers: {'Content-Type': 'application/json'}
            })
        })
    })

    describe('createContextualFetch', () => {
        it('should create a bound fetch function with context', async () => {
            const contextualFetch = createContextualFetch(mockContext)
            const url = 'https://example.com/api/test'
            const options = {method: 'POST'}

            await contextualFetch(url, options)

            expect(global.fetch).toHaveBeenCalledWith(url, {
                method: 'POST',
                headers: {'sfdc_server_timing': '1'}
            })
        })
    })
})
