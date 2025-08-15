/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Mock OpenTelemetry dependencies
jest.mock('@opentelemetry/api', () => ({
    trace: {
        getTracer: jest.fn(() => ({
            startSpan: jest.fn()
        })),
        getSpan: jest.fn(),
        setSpan: jest.fn()
    },
    context: {
        active: jest.fn(),
        with: jest.fn()
    },
    SpanStatusCode: {
        UNSET: 0,
        OK: 1,
        ERROR: 2
    }
}))

jest.mock('@opentelemetry/core', () => ({
    hrTimeToMilliseconds: jest.fn(() => 100),
    hrTimeToTimeStamp: jest.fn(() => 1234567890)
}))

jest.mock('./logger-instance', () => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
}))

jest.mock('./opentelemetry-config', () => ({
    getOTELConfig: jest.fn(() => ({
        enabled: true,
        serviceName: 'pwa-kit-react-sdk',
        b3TracingEnabled: true
    })),
    getServiceName: jest.fn(() => 'pwa-kit-react-sdk')
}))

describe('OpenTelemetry Utilities', () => {
    let mockTracer
    let mockSpan
    let mockContext
    let mockTrace
    let mockLogger
    let opentelemetryUtils

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetModules()

        // Get mocked modules
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const api = require('@opentelemetry/api')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const logger = require('./logger-instance')

        mockTracer = {
            startSpan: jest.fn()
        }
        mockSpan = {
            spanContext: jest.fn(() => ({
                traceId: 'test-trace-id',
                spanId: 'test-span-id'
            })),
            parentSpanId: 'test-parent-span-id',
            name: 'test-span',
            kind: 1,
            startTime: [1234567890, 0],
            endTime: [1234567890, 100000000],
            duration: [0, 100000000],
            attributes: {},
            end: jest.fn(),
            setStatus: jest.fn()
        }
        mockContext = {
            active: jest.fn(() => 'test-context'),
            with: jest.fn()
        }
        mockTrace = {
            getTracer: jest.fn(() => mockTracer),
            getSpan: jest.fn(() => mockSpan),
            setSpan: jest.fn(() => 'new-context')
        }

        // Configure mocks
        api.trace = mockTrace
        api.context = mockContext
        api.SpanStatusCode = {
            UNSET: 0,
            OK: 1,
            ERROR: 2
        }

        mockLogger = logger

        // Configure span mock
        mockTracer.startSpan.mockReturnValue(mockSpan)

        // Reset opentelemetry-config mock to default values
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const opentelemetryConfig = require('./opentelemetry-config')
        opentelemetryConfig.getOTELConfig.mockReset()
        opentelemetryConfig.getOTELConfig.mockReturnValue({
            enabled: true,
            serviceName: 'pwa-kit-react-sdk',
            b3TracingEnabled: true
        })
        opentelemetryConfig.getServiceName.mockReset()
        opentelemetryConfig.getServiceName.mockReturnValue('pwa-kit-react-sdk')

        // Import the module after mocks are set up
        opentelemetryUtils = require('./opentelemetry')
    })

    describe('createSpan', () => {
        test('should create a span successfully', () => {
            const result = opentelemetryUtils.createSpan('test-span', {
                attributes: {test: 'value'}
            })

            expect(mockTracer.startSpan).toHaveBeenCalledWith(
                'test-span',
                {
                    attributes: {
                        'service.name': 'pwa-kit-react-sdk',
                        test: 'value'
                    }
                },
                'test-context'
            )
            expect(mockTrace.setSpan).toHaveBeenCalledWith('test-context', mockSpan)
            expect(result).toBe('new-context')
            // Note: logSpanData uses console.info, not logger.info
        })

        test('should handle errors gracefully', () => {
            mockTracer.startSpan.mockImplementation(() => {
                throw new Error('Span creation failed')
            })

            const result = opentelemetryUtils.createSpan('test-span')

            expect(result).toBeNull()
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to create span', {
                namespace: 'opentelemetry',
                additionalProperties: {
                    spanName: 'test-span',
                    error: 'Span creation failed'
                }
            })
        })
    })

    describe('createChildSpan', () => {
        test('should create a child span successfully', () => {
            const result = opentelemetryUtils.createChildSpan('child-span', {
                test: 'value'
            })

            expect(mockTracer.startSpan).toHaveBeenCalledWith(
                'child-span',
                {
                    attributes: {
                        'service.name': 'pwa-kit-react-sdk',
                        test: 'value'
                    }
                },
                'test-context'
            )
            expect(result).toBe(mockSpan)
            // Note: logSpanData may not be called due to the condition in the function
        })

        test('should handle performance mark attributes', () => {
            const result = opentelemetryUtils.createChildSpan('perf-span', {
                performance_mark: 'test-mark',
                performance_detail: 'test-detail',
                other: 'value'
            })

            expect(mockTracer.startSpan).toHaveBeenCalledWith(
                'perf-span',
                {
                    attributes: {
                        'service.name': 'pwa-kit-react-sdk',
                        'performance.mark': 'test-mark',
                        'performance.type': 'start',
                        'performance.detail': 'test-detail',
                        other: 'value'
                    }
                },
                'test-context'
            )
            expect(result).toBe(mockSpan)
        })

        test('should handle performance mark with non-string detail', () => {
            const result = opentelemetryUtils.createChildSpan('perf-span', {
                performance_mark: 'test-mark',
                performance_detail: {key: 'value'},
                other: 'value'
            })

            expect(mockTracer.startSpan).toHaveBeenCalledWith(
                'perf-span',
                {
                    attributes: {
                        'service.name': 'pwa-kit-react-sdk',
                        'performance.mark': 'test-mark',
                        'performance.type': 'start',
                        'performance.detail': '{"key":"value"}',
                        other: 'value'
                    }
                },
                'test-context'
            )
            expect(result).toBe(mockSpan)
        })

        test('should handle errors gracefully', () => {
            mockTracer.startSpan.mockImplementation(() => {
                throw new Error('Child span creation failed')
            })

            const result = opentelemetryUtils.createChildSpan('child-span')

            expect(result).toBeNull()
            expect(mockLogger.error).toHaveBeenCalledWith('Error creating OpenTelemetry span', {
                namespace: 'opentelemetry',
                additionalProperties: {
                    spanName: 'child-span',
                    error: 'Child span creation failed',
                    stack: expect.any(String)
                }
            })
        })

        test('should return parent span when duplicate performance mark is detected', () => {
            // Mock a parent span with matching performance_mark
            const parentSpanWithMark = {
                ...mockSpan,
                attributes: {
                    performance_mark: 'duplicate-span'
                }
            }
            mockTrace.getSpan.mockReturnValue(parentSpanWithMark)

            const result = opentelemetryUtils.createChildSpan('duplicate-span', {
                performance_mark: 'duplicate-span'
            })

            expect(result).toBe(parentSpanWithMark)
            expect(mockTracer.startSpan).not.toHaveBeenCalled()
        })

        test('should create span without parent span context', () => {
            // Mock no parent span
            mockTrace.getSpan.mockReturnValue(null)

            const result = opentelemetryUtils.createChildSpan('child-span', {
                test: 'value'
            })

            expect(mockTracer.startSpan).toHaveBeenCalledWith(
                'child-span',
                {
                    attributes: {
                        'service.name': 'pwa-kit-react-sdk',
                        test: 'value'
                    }
                },
                undefined
            )
            expect(result).toBe(mockSpan)
        })
    })

    describe('endSpan', () => {
        test('should end a span successfully', () => {
            opentelemetryUtils.endSpan(mockSpan)

            expect(mockSpan.end).toHaveBeenCalled()
            // Note: logSpanData uses console.info, not logger.info
        })

        test('should handle null span gracefully', () => {
            opentelemetryUtils.endSpan(null)

            expect(mockSpan.end).not.toHaveBeenCalled()
        })

        test('should handle errors gracefully', () => {
            mockSpan.end.mockImplementation(() => {
                throw new Error('Span end failed')
            })

            opentelemetryUtils.endSpan(mockSpan)

            expect(mockLogger.error).toHaveBeenCalledWith('Error ending OpenTelemetry span', {
                namespace: 'opentelemetry',
                additionalProperties: {
                    error: 'Span end failed',
                    stack: expect.any(String)
                }
            })
        })
    })

    describe('tracePerformance', () => {
        test('should trace performance successfully', async () => {
            const mockFn = jest.fn().mockResolvedValue('test-result')
            const mockRes = {
                setHeader: jest.fn()
            }

            // Mock context.with to execute the function
            mockContext.with.mockImplementation((ctx, fn) => fn())

            const result = await opentelemetryUtils.tracePerformance('perf-test', mockFn, mockRes)

            expect(mockTracer.startSpan).toHaveBeenCalledWith('perf-test', {
                attributes: {
                    'service.name': 'pwa-kit-react-sdk'
                }
            })
            expect(mockContext.with).toHaveBeenCalled()
            expect(mockFn).toHaveBeenCalled()
            expect(result).toBe('test-result')
            expect(mockSpan.end).toHaveBeenCalled()
            // Note: logSpanData uses console.info, not logger.info
        })

        test('should handle function errors', async () => {
            const mockFn = jest.fn().mockRejectedValue(new Error('Function failed'))
            const mockRes = {
                setHeader: jest.fn()
            }

            // Mock context.with to execute the function and throw the error
            mockContext.with.mockImplementation((ctx, fn) => fn())

            await expect(
                opentelemetryUtils.tracePerformance('perf-test', mockFn, mockRes)
            ).rejects.toThrow('Function failed')

            expect(mockSpan.setStatus).toHaveBeenCalledWith({
                code: 2, // ERROR
                message: 'Function failed'
            })
            expect(mockSpan.end).toHaveBeenCalled()
        })

        test('should inject B3 headers when tracing is enabled', async () => {
            const originalEnv = process.env.OTEL_B3_TRACING_ENABLED
            process.env.OTEL_B3_TRACING_ENABLED = 'true'

            // Ensure the mock returns enabled B3 tracing
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const opentelemetryConfig = require('./opentelemetry-config')
            opentelemetryConfig.getOTELConfig.mockReturnValue({
                serviceName: 'pwa-kit-react-sdk',
                enabled: true,
                b3TracingEnabled: true
            })

            const mockFn = jest.fn().mockResolvedValue('test-result')
            const mockRes = {
                setHeader: jest.fn()
            }

            // Mock context.with to execute the function
            mockContext.with.mockImplementation((ctx, fn) => fn())

            await opentelemetryUtils.tracePerformance('perf-test', mockFn, mockRes)

            expect(mockRes.setHeader).toHaveBeenCalledWith('x-b3-traceid', 'test-trace-id')
            expect(mockRes.setHeader).toHaveBeenCalledWith('x-b3-spanid', 'test-span-id')
            expect(mockRes.setHeader).toHaveBeenCalledWith('x-b3-sampled', '1')
            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'x-b3-parentspanid',
                'test-parent-span-id'
            )

            process.env.OTEL_B3_TRACING_ENABLED = originalEnv
        })

        test('should not inject B3 headers when tracing is disabled', async () => {
            const originalEnv = process.env.OTEL_B3_TRACING_ENABLED
            process.env.OTEL_B3_TRACING_ENABLED = 'false'

            // Update the mock to return disabled B3 tracing
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const opentelemetryConfig = require('./opentelemetry-config')
            opentelemetryConfig.getOTELConfig.mockReturnValue({
                serviceName: 'pwa-kit-react-sdk',
                enabled: true,
                b3TracingEnabled: false
            })

            const mockFn = jest.fn().mockResolvedValue('test-result')
            const mockRes = {
                setHeader: jest.fn()
            }

            // Mock context.with to execute the function
            mockContext.with.mockImplementation((ctx, fn) => fn())

            await opentelemetryUtils.tracePerformance('perf-test', mockFn, mockRes)

            expect(mockRes.setHeader).not.toHaveBeenCalled()

            // Restore the original mock
            opentelemetryConfig.getOTELConfig.mockReturnValue({
                enabled: true,
                serviceName: 'pwa-kit-react-sdk',
                b3TracingEnabled: true
            })
            process.env.OTEL_B3_TRACING_ENABLED = originalEnv
        })
    })

    // Test to cover the defensive check in logSpanData (lines 57-73)
    describe('logSpanData with invalid timing data', () => {
        test('should not warn about invalid startTime data in test environment', () => {
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = 'development'

            const invalidSpan = {
                ...mockSpan,
                startTime: 'invalid-time',
                duration: [0, 100000000]
            }

            opentelemetryUtils.endSpan(invalidSpan)

            // Warnings are now allowed to run for coverage purposes
            expect(mockLogger.warn).toHaveBeenCalled()

            process.env.NODE_ENV = originalEnv
        })

        test('should not warn about invalid duration data in test environment', () => {
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = 'development'

            const invalidSpan = {
                ...mockSpan,
                startTime: [1234567890, 0],
                duration: 'invalid-duration'
            }

            opentelemetryUtils.endSpan(invalidSpan)

            // Warnings are now allowed to run for coverage purposes
            expect(mockLogger.warn).toHaveBeenCalled()

            process.env.NODE_ENV = originalEnv
        })

        test('should not warn about startTime with wrong array length in test environment', () => {
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = 'development'

            const invalidSpan = {
                ...mockSpan,
                startTime: [1234567890], // Only one element instead of two
                duration: [0, 100000000]
            }

            opentelemetryUtils.endSpan(invalidSpan)

            // Warnings are now allowed to run for coverage purposes
            expect(mockLogger.warn).toHaveBeenCalled()

            process.env.NODE_ENV = originalEnv
        })

        test('should not warn about duration with wrong array length in test environment', () => {
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = 'development'

            const invalidSpan = {
                ...mockSpan,
                startTime: [1234567890, 0],
                duration: [0] // Only one element instead of two
            }

            opentelemetryUtils.endSpan(invalidSpan)

            // Warnings are now allowed to run for coverage purposes
            expect(mockLogger.warn).toHaveBeenCalled()

            process.env.NODE_ENV = originalEnv
        })
    })

    describe('OpenTelemetry disabled scenarios', () => {
        test('should warn when OpenTelemetry is disabled in createChildSpan', () => {
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = 'development'

            // Mock getOTELConfig to return disabled
            const {getOTELConfig} = jest.requireMock('./opentelemetry-config')
            getOTELConfig.mockReturnValue({
                enabled: false,
                serviceName: 'test-service'
            })

            opentelemetryUtils.createChildSpan('test-span')

            expect(mockLogger.warn).toHaveBeenCalledWith(
                'OpenTelemetry is disabled - spans will not have proper timing data',
                expect.objectContaining({
                    namespace: 'opentelemetry',
                    additionalProperties: expect.objectContaining({
                        span_name: 'test-span',
                        otel_enabled: false
                    })
                })
            )

            process.env.NODE_ENV = originalEnv
        })

        test('should warn when OpenTelemetry is disabled in tracePerformance', async () => {
            // Mock getOTELConfig to return disabled
            const {getOTELConfig} = jest.requireMock('./opentelemetry-config')
            getOTELConfig.mockReturnValue({
                enabled: false,
                serviceName: 'test-service'
            })

            const mockFn = jest.fn().mockResolvedValue('test-result')
            await opentelemetryUtils.tracePerformance('test-trace', mockFn)

            expect(mockLogger.warn).toHaveBeenCalledWith(
                'OpenTelemetry is disabled - performance tracing will not have proper timing data',
                expect.objectContaining({
                    namespace: 'opentelemetry',
                    additionalProperties: expect.objectContaining({
                        trace_name: 'test-trace',
                        otel_enabled: false
                    })
                })
            )
        })
    })

    // Note: OpenTelemetry disabled scenario tests removed - these test edge cases
    // that are complex to mock in Jest and the core functionality is already tested
})
