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

describe('OpenTelemetry Utilities', () => {
    let mockTracer
    let mockSpan
    let mockContext
    let mockTrace
    let mockCore
    let mockLogger
    let opentelemetryUtils

    beforeEach(() => {
        jest.clearAllMocks()

        // Get mocked modules
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const api = require('@opentelemetry/api')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const core = require('@opentelemetry/core')
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

        mockCore = core
        mockLogger = logger

        // Configure span mock
        mockTracer.startSpan.mockReturnValue(mockSpan)

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
            expect(mockLogger.info).toHaveBeenCalledWith('OpenTelemetry span data', {
                namespace: 'opentelemetry.logSpanData',
                additionalProperties: expect.objectContaining({
                    traceId: 'test-trace-id',
                    name: 'test-span'
                })
            })
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
            expect(mockLogger.info).toHaveBeenCalledWith('OpenTelemetry span data', {
                namespace: 'opentelemetry.logSpanData',
                additionalProperties: expect.objectContaining({
                    traceId: 'test-trace-id',
                    name: 'test-span'
                })
            })
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
            expect(mockLogger.info).toHaveBeenCalledTimes(2) // start and end
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
            const originalEnv = process.env.DISABLE_B3_TRACING
            process.env.DISABLE_B3_TRACING = 'false'

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

            process.env.DISABLE_B3_TRACING = originalEnv
        })

        test('should not inject B3 headers when tracing is disabled', async () => {
            const originalEnv = process.env.DISABLE_B3_TRACING
            process.env.DISABLE_B3_TRACING = 'true'

            const mockFn = jest.fn().mockResolvedValue('test-result')
            const mockRes = {
                setHeader: jest.fn()
            }

            // Mock context.with to execute the function
            mockContext.with.mockImplementation((ctx, fn) => fn())

            await opentelemetryUtils.tracePerformance('perf-test', mockFn, mockRes)

            expect(mockRes.setHeader).not.toHaveBeenCalled()

            process.env.DISABLE_B3_TRACING = originalEnv
        })
    })

    describe('logPerformanceMetric', () => {
        test('should log performance metric successfully', () => {
            opentelemetryUtils.logPerformanceMetric('test-metric', 150, {
                test: 'value'
            })

            expect(mockTracer.startSpan).toHaveBeenCalledWith(
                'test-metric',
                {
                    attributes: {
                        'service.name': 'pwa-kit-react-sdk',
                        'metric.duration': 150,
                        test: 'value'
                    }
                },
                'test-context'
            )
            expect(mockSpan.end).toHaveBeenCalled()
            expect(mockLogger.info).toHaveBeenCalledWith('OpenTelemetry span data', {
                namespace: 'opentelemetry.logSpanData',
                additionalProperties: expect.objectContaining({
                    traceId: 'test-trace-id',
                    name: 'test-span'
                })
            })
        })

        test('should handle performance mark attributes', () => {
            opentelemetryUtils.logPerformanceMetric('test-metric', 150, {
                performance_mark: 'test-mark',
                performance_detail: 'test-detail',
                other: 'value'
            })

            expect(mockTracer.startSpan).toHaveBeenCalledWith(
                'test-metric',
                {
                    attributes: {
                        'service.name': 'pwa-kit-react-sdk',
                        'metric.duration': 150,
                        'performance.mark': 'test-mark',
                        'performance.type': 'end',
                        'performance.detail': 'test-detail',
                        other: 'value'
                    }
                },
                'test-context'
            )
        })

        test('should handle performance mark with non-string detail in metric', () => {
            opentelemetryUtils.logPerformanceMetric('test-metric', 150, {
                performance_mark: 'test-mark',
                performance_detail: {key: 'value'},
                other: 'value'
            })

            expect(mockTracer.startSpan).toHaveBeenCalledWith(
                'test-metric',
                {
                    attributes: {
                        'service.name': 'pwa-kit-react-sdk',
                        'metric.duration': 150,
                        'performance.mark': 'test-mark',
                        'performance.type': 'end',
                        'performance.detail': '{"key":"value"}',
                        other: 'value'
                    }
                },
                'test-context'
            )
        })

        test('should warn when no parent span is found', () => {
            mockTrace.getSpan.mockReturnValue(null)

            opentelemetryUtils.logPerformanceMetric('test-metric', 150)

            expect(mockLogger.warn).toHaveBeenCalledWith('No parent span found in context', {
                namespace: 'opentelemetry',
                additionalProperties: {metricName: 'test-metric'}
            })
            expect(mockTracer.startSpan).not.toHaveBeenCalled()
        })

        test('should handle errors gracefully', () => {
            // Reset the mock to throw an error
            mockTracer.startSpan.mockImplementationOnce(() => {
                throw new Error('Metric logging failed')
            })

            opentelemetryUtils.logPerformanceMetric('test-metric', 150)

            expect(mockLogger.error).toHaveBeenCalledWith('Error logging performance metric', {
                namespace: 'opentelemetry',
                additionalProperties: {
                    metricName: 'test-metric',
                    error: 'Metric logging failed',
                    stack: expect.any(String)
                }
            })
        })

        test('should handle errors when span creation fails in logPerformanceMetric', () => {
            // Mock getSpan to return a span, but startSpan to throw
            mockTrace.getSpan.mockReturnValue(mockSpan)
            mockTracer.startSpan.mockImplementationOnce(() => {
                throw new Error('Span creation failed in metric')
            })

            opentelemetryUtils.logPerformanceMetric('test-metric', 150)

            expect(mockLogger.error).toHaveBeenCalledWith('Error logging performance metric', {
                namespace: 'opentelemetry',
                additionalProperties: {
                    metricName: 'test-metric',
                    error: 'Span creation failed in metric',
                    stack: expect.any(String)
                }
            })
        })
    })

    describe('traceChildPerformance', () => {
        test('should trace child performance successfully', async () => {
            const mockFn = jest.fn().mockResolvedValue('child-result')

            const result = await opentelemetryUtils.traceChildPerformance('child-perf', mockFn)

            expect(mockTracer.startSpan).toHaveBeenCalledWith(
                'child-perf',
                {
                    attributes: {
                        'service.name': 'pwa-kit-react-sdk'
                    }
                },
                'test-context'
            )
            expect(mockFn).toHaveBeenCalled()
            expect(result).toBe('child-result')
            expect(mockSpan.end).toHaveBeenCalled()
        })

        test('should handle function errors', async () => {
            const mockFn = jest.fn().mockRejectedValue(new Error('Child function failed'))

            await expect(
                opentelemetryUtils.traceChildPerformance('child-perf', mockFn)
            ).rejects.toThrow('Child function failed')

            expect(mockSpan.setStatus).toHaveBeenCalledWith({
                code: 2, // ERROR
                message: 'Child function failed'
            })
            expect(mockSpan.end).toHaveBeenCalled()
        })

        test('should fallback to function execution when span creation fails', async () => {
            mockTracer.startSpan.mockImplementation(() => {
                throw new Error('Span creation failed')
            })

            const mockFn = jest.fn().mockResolvedValue('fallback-result')

            const result = await opentelemetryUtils.traceChildPerformance('child-perf', mockFn)

            expect(result).toBe('fallback-result')
            expect(mockFn).toHaveBeenCalled()
            expect(mockSpan.end).not.toHaveBeenCalled()
        })
    })
})
