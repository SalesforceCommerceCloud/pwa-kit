/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import PerformanceTimer from './performance'

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

describe('PerformanceTimer API Timing', () => {
    let timer

    beforeEach(() => {
        timer = new PerformanceTimer({enabled: true})
        jest.clearAllMocks()
    })

    describe('addServerTimingMetrics', () => {
        it('should parse and store Server-Timing header values', () => {
            const serverTimingHeader =
                'db;dur=53.2, cache;dur=2.1, app;dur=123.45;desc=Application processing'

            timer.addServerTimingMetrics(serverTimingHeader, 'scapi')

            expect(timer.apiMetrics).toHaveLength(3)
            expect(timer.apiMetrics[0]).toEqual({
                name: 'scapi-db',
                duration: 53.2,
                detail: '',
                source: 'scapi'
            })
            expect(timer.apiMetrics[1]).toEqual({
                name: 'scapi-cache',
                duration: 2.1,
                detail: '',
                source: 'scapi'
            })
            expect(timer.apiMetrics[2]).toEqual({
                name: 'scapi-app',
                duration: 123.45,
                detail: 'Application processing',
                source: 'scapi'
            })
        })

        it('should handle malformed Server-Timing headers gracefully', () => {
            const malformedHeader = 'invalid-format'

            timer.addServerTimingMetrics(malformedHeader, 'api')

            // Should not throw and should create a metric with zero duration
            expect(timer.apiMetrics).toHaveLength(1)
            expect(timer.apiMetrics[0]).toEqual({
                name: 'api-invalid-format',
                duration: 0,
                detail: '',
                source: 'api'
            })
        })

        it('should not process metrics when timer is disabled', () => {
            const disabledTimer = new PerformanceTimer({enabled: false})
            const serverTimingHeader = 'db;dur=53.2'

            disabledTimer.addServerTimingMetrics(serverTimingHeader, 'scapi')

            expect(disabledTimer.apiMetrics).toHaveLength(0)
        })
    })

    describe('addApiTimingFromResponse', () => {
        it('should extract timing from fetch Response object', () => {
            const mockResponse = {
                headers: {
                    get: jest.fn((name) => {
                        if (name === 'Server-Timing') {
                            return 'api-call;dur=150.5'
                        }
                        return null
                    })
                }
            }

            timer.addApiTimingFromResponse(mockResponse, 'scapi')

            expect(timer.apiMetrics).toHaveLength(1)
            expect(timer.apiMetrics[0]).toEqual({
                name: 'scapi-api-call',
                duration: 150.5,
                detail: '',
                source: 'scapi'
            })
        })

        it('should extract timing from plain object headers', () => {
            const mockResponse = {
                headers: {
                    'Server-Timing': 'render;dur=45.3'
                }
            }

            timer.addApiTimingFromResponse(mockResponse, 'ocapi')

            expect(timer.apiMetrics).toHaveLength(1)
            expect(timer.apiMetrics[0]).toEqual({
                name: 'ocapi-render',
                duration: 45.3,
                detail: '',
                source: 'ocapi'
            })
        })

        it('should handle responses without Server-Timing headers', () => {
            const mockResponse = {
                headers: {
                    get: jest.fn(() => null)
                }
            }

            timer.addApiTimingFromResponse(mockResponse, 'api')

            expect(timer.apiMetrics).toHaveLength(0)
        })
    })

    describe('buildServerTimingHeader', () => {
        it('should combine SSR and API metrics in the header', () => {
            // Add SSR metric
            timer.metrics.push({
                name: 'ssr-render',
                duration: 250.5,
                detail: 'SSR rendering'
            })

            // Add API metrics
            timer.apiMetrics.push({
                name: 'scapi-products',
                duration: 120.3,
                detail: 'Product search',
                source: 'scapi'
            })
            timer.apiMetrics.push({
                name: 'scapi-promotions',
                duration: 45.7,
                detail: '',
                source: 'scapi'
            })

            const header = timer.buildServerTimingHeader()

            expect(header).toBe(
                'ssr-render;dur=250.50, scapi-products;dur=120.3, scapi-promotions;dur=45.7'
            )
        })

        it('should handle empty metrics gracefully', () => {
            const header = timer.buildServerTimingHeader()
            expect(header).toBe('')
        })
    })

    describe('cleanup', () => {
        it('should clear both SSR and API metrics', () => {
            timer.metrics.push({name: 'test-ssr', duration: 100})
            timer.apiMetrics.push({name: 'test-api', duration: 50, source: 'api'})

            timer.cleanup()

            expect(timer.metrics).toHaveLength(0)
            expect(timer.apiMetrics).toHaveLength(0)
        })
    })
})
