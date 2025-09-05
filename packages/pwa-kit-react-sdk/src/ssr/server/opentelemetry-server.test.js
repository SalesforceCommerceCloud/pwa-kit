/**
 * @jest-environment node
 */
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// The @jest-environment comment block *MUST* be the first line of the file for the tests to pass.
// That conflicts with the monorepo header rule, so we must disable the rule!
/* eslint-disable header/header */

// Mock OpenTelemetry dependencies
jest.mock('@opentelemetry/sdk-trace-node', () => ({
    NodeTracerProvider: jest.fn()
}))

jest.mock('@opentelemetry/sdk-trace-base', () => ({
    SimpleSpanProcessor: jest.fn()
}))

jest.mock('@opentelemetry/propagator-b3', () => ({
    B3Propagator: jest.fn()
}))

jest.mock('@opentelemetry/resources', () => ({
    Resource: jest.fn()
}))

jest.mock('@opentelemetry/api', () => ({
    propagation: {
        setGlobalPropagator: jest.fn()
    }
}))

jest.mock('../../utils/logger-instance', () => ({
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
}))

// Mock the opentelemetry utils
jest.mock('../../utils/opentelemetry', () => ({
    getServiceName: jest.fn(() => 'pwa-kit-react-sdk'),
    OTEL_CONFIG: {
        serviceName: 'pwa-kit-react-sdk',
        enabled: true
    }
}))

jest.mock('../../utils/opentelemetry-config', () => ({
    getOTELConfig: jest.fn(() => ({
        enabled: true,
        serviceName: 'pwa-kit-react-sdk'
    })),
    getServiceName: jest.fn(() => 'pwa-kit-react-sdk')
}))

jest.mock('../../utils/opentelemetry', () => ({
    logSpanData: jest.fn()
}))

jest.mock('@opentelemetry/api', () => ({
    trace: {
        getTracer: jest.fn(),
        setSpan: jest.fn()
    },
    context: {
        active: jest.fn(),
        with: jest.fn()
    },
    propagation: {
        setGlobalPropagator: jest.fn()
    },
    SpanStatusCode: {
        UNSET: 0,
        OK: 1,
        ERROR: 2
    }
}))

describe('OpenTelemetry Server Tracing', () => {
    let mockNodeTracerProvider
    let mockSimpleSpanProcessor
    let mockB3Propagator
    let mockResource
    let mockPropagation
    let mockLogger
    let initializeServerTracing
    let shutdownServerTracing
    let isServerTracingInitialized
    let defaultOptions

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks()

        // Get mocked constructors
        /* eslint-disable @typescript-eslint/no-var-requires */
        const {NodeTracerProvider} = require('@opentelemetry/sdk-trace-node')
        const {SimpleSpanProcessor} = require('@opentelemetry/sdk-trace-base')
        const {B3Propagator} = require('@opentelemetry/propagator-b3')
        const {Resource} = require('@opentelemetry/resources')
        const {propagation} = require('@opentelemetry/api')
        const logger = require('../../utils/logger-instance')

        const opentelemetryServer = require('./opentelemetry-server')
        /* eslint-enable @typescript-eslint/no-var-requires */

        mockNodeTracerProvider = NodeTracerProvider
        mockSimpleSpanProcessor = SimpleSpanProcessor
        mockB3Propagator = B3Propagator
        mockResource = Resource
        mockPropagation = propagation
        mockLogger = logger
        defaultOptions = {enabled: true}

        // Set up mock instances
        const mockProviderInstance = {
            register: jest.fn(),
            shutdown: jest.fn()
        }

        const mockResourceInstance = {}
        const mockSpanProcessorInstance = {}
        const mockB3PropagatorInstance = {}

        // Configure mocks
        mockNodeTracerProvider.mockImplementation(() => mockProviderInstance)
        mockResource.mockImplementation(() => mockResourceInstance)
        mockSimpleSpanProcessor.mockImplementation(() => mockSpanProcessorInstance)
        mockB3Propagator.mockImplementation(() => mockB3PropagatorInstance)

        // Import the functions after mocks are set up
        initializeServerTracing = opentelemetryServer.initializeServerTracing
        shutdownServerTracing = opentelemetryServer.shutdownServerTracing
        isServerTracingInitialized = opentelemetryServer.isServerTracingInitialized
    })

    afterEach(async () => {
        // Clean up any existing provider
        if (shutdownServerTracing) {
            await shutdownServerTracing()
        }

        // Reset module state to ensure clean state between tests
        jest.resetModules()
    })

    describe('initializeServerTracing', () => {
        test('should successfully initialize OpenTelemetry tracing with default options', () => {
            const result = initializeServerTracing(defaultOptions)

            // Verify NodeTracerProvider was called with correct resource and span processor
            expect(mockNodeTracerProvider).toHaveBeenCalledWith({
                resource: expect.any(Object),
                spanProcessor: expect.any(Object)
            })

            // Verify Resource was created with correct service name only (no version by default)
            expect(mockResource).toHaveBeenCalledWith({
                'service.name': 'pwa-kit-react-sdk'
            })

            // Verify span processor was created
            expect(mockSimpleSpanProcessor).toHaveBeenCalled()

            // Verify B3 propagator was set globally
            expect(mockB3Propagator).toHaveBeenCalled()
            expect(mockPropagation.setGlobalPropagator).toHaveBeenCalledWith(expect.any(Object))

            // Verify provider was registered
            expect(result.register).toHaveBeenCalled()

            // Verify the provider was returned
            expect(result).toBeDefined()

            // Verify initialization state
            expect(isServerTracingInitialized()).toBe(true)
        })

        test('should initialize with custom service name', () => {
            const customServiceName = 'my-custom-service'
            const result = initializeServerTracing({
                ...defaultOptions,
                serviceName: customServiceName
            })

            // Verify Resource was created with custom service name only
            expect(mockResource).toHaveBeenCalledWith({
                'service.name': customServiceName
            })

            expect(result).toBeDefined()
        })

        test('should initialize with service version', () => {
            const serviceVersion = '1.2.3'
            const result = initializeServerTracing({...defaultOptions, serviceVersion})

            // Verify Resource was created with service version
            expect(mockResource).toHaveBeenCalledWith({
                'service.name': 'pwa-kit-react-sdk',
                'service.version': serviceVersion
            })

            expect(result).toBeDefined()
        })

        test('should initialize with both service name and version', () => {
            const customServiceName = 'my-service'
            const serviceVersion = '2.0.0'
            const result = initializeServerTracing({
                ...defaultOptions,
                serviceName: customServiceName,
                serviceVersion
            })

            // Verify Resource was created with both attributes
            expect(mockResource).toHaveBeenCalledWith({
                'service.name': customServiceName,
                'service.version': serviceVersion
            })

            expect(result).toBeDefined()
        })

        test('should return null when tracing is disabled', () => {
            const result = initializeServerTracing({enabled: false})

            // Verify no provider was created
            expect(mockNodeTracerProvider).not.toHaveBeenCalled()
            expect(mockResource).not.toHaveBeenCalled()
            expect(result).toBeNull()
            expect(isServerTracingInitialized()).toBe(false)
        })

        test('should handle initialization errors gracefully', () => {
            // Mock NodeTracerProvider to throw an error
            mockNodeTracerProvider.mockImplementation(() => {
                throw new Error('OpenTelemetry initialization failed')
            })

            const result = initializeServerTracing(defaultOptions)

            // Verify error was logged
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to initialize OpenTelemetry provider',
                {
                    namespace: 'opentelemetry-server.initializeServerTracing',
                    additionalProperties: {error: 'OpenTelemetry initialization failed'}
                }
            )

            // Verify null was returned
            expect(result).toBeNull()

            // Verify initialization state
            expect(isServerTracingInitialized()).toBe(false)
        })

        test('should handle resource creation errors', () => {
            // Mock Resource to throw an error
            mockResource.mockImplementation(() => {
                throw new Error('Resource creation failed')
            })

            const result = initializeServerTracing(defaultOptions)

            // Verify error was logged
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to initialize OpenTelemetry provider',
                {
                    namespace: 'opentelemetry-server.initializeServerTracing',
                    additionalProperties: {error: 'Resource creation failed'}
                }
            )

            // Verify null was returned
            expect(result).toBeNull()
        })

        test('should handle provider registration errors', () => {
            // Set up mock provider that throws on register
            const mockProviderInstance = {
                register: jest.fn().mockImplementation(() => {
                    throw new Error('Provider registration failed')
                }),
                shutdown: jest.fn()
            }
            mockNodeTracerProvider.mockImplementation(() => mockProviderInstance)

            const result = initializeServerTracing(defaultOptions)

            // Verify error was logged
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to initialize OpenTelemetry provider',
                {
                    namespace: 'opentelemetry-server.initializeServerTracing',
                    additionalProperties: {error: 'Provider registration failed'}
                }
            )

            // Verify null was returned
            expect(result).toBeNull()
        })

        describe('environment variable handling', () => {
            const originalEnv = process.env

            beforeEach(() => {
                jest.resetModules()
                process.env = {...originalEnv}
            })

            afterEach(() => {
                process.env = originalEnv
            })

            test('should use custom service name when provided', () => {
                // Clear previous mock calls
                mockResource.mockClear()
                mockNodeTracerProvider.mockClear()

                const result = initializeServerTracing({
                    enabled: true,
                    serviceName: 'custom-service-name'
                })

                expect(mockResource).toHaveBeenCalledWith({
                    'service.name': 'custom-service-name'
                })
                expect(result).toBeDefined()
            })

            test('should use getServiceName when no service name provided', () => {
                // Clear previous mock calls
                mockResource.mockClear()
                mockNodeTracerProvider.mockClear()

                const result = initializeServerTracing({enabled: true})

                expect(mockResource).toHaveBeenCalledWith({
                    'service.name': 'pwa-kit-react-sdk'
                })
                expect(result).toBeDefined()
            })

            test('should enable tracing when enabled is true', () => {
                // Clear previous mock calls
                mockResource.mockClear()
                mockNodeTracerProvider.mockClear()

                const result = initializeServerTracing({enabled: true})

                expect(mockNodeTracerProvider).toHaveBeenCalled()
                expect(result).toBeDefined()
            })

            test('should disable tracing when enabled is false', () => {
                const result = initializeServerTracing({enabled: false})

                expect(mockNodeTracerProvider).not.toHaveBeenCalled()
                expect(result).toBeNull()
            })
        })
    })

    describe('shutdownServerTracing', () => {
        test('should successfully shutdown OpenTelemetry provider when provider exists', async () => {
            // First initialize to create a provider
            const provider = initializeServerTracing(defaultOptions)
            expect(provider).toBeDefined()

            // Then shutdown
            await shutdownServerTracing()

            // Verify shutdown was called
            expect(provider.shutdown).toHaveBeenCalled()

            // Verify provider is cleaned up
            expect(isServerTracingInitialized()).toBe(false)
        })

        test('should handle shutdown when no provider exists', async () => {
            // Don't initialize first, so no provider exists
            expect(isServerTracingInitialized()).toBe(false)

            await shutdownServerTracing()

            // Verify no error was logged (graceful handling)
            expect(mockLogger.warn).not.toHaveBeenCalled()
        })

        test('should handle shutdown errors gracefully', async () => {
            // Set up mock provider that throws on shutdown
            const mockProviderInstance = {
                register: jest.fn(),
                shutdown: jest.fn().mockRejectedValue(new Error('Shutdown failed'))
            }
            mockNodeTracerProvider.mockImplementation(() => mockProviderInstance)

            // Initialize to create provider
            const provider = initializeServerTracing(defaultOptions)
            expect(provider).toBeDefined()

            // Shutdown should not throw
            await expect(shutdownServerTracing()).resolves.not.toThrow()

            // Verify error was logged
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Failed to shutdown OpenTelemetry provider',
                {
                    namespace: 'opentelemetry-server.shutdownServerTracing',
                    additionalProperties: {error: 'Shutdown failed'}
                }
            )
        })
    })

    describe('isServerTracingInitialized', () => {
        test('should return true when provider is initialized', () => {
            initializeServerTracing(defaultOptions)
            expect(isServerTracingInitialized()).toBe(true)
        })

        test('should return false when not initialized', () => {
            expect(isServerTracingInitialized()).toBe(false)
        })

        test('should return false after shutdown', async () => {
            initializeServerTracing(defaultOptions)
            expect(isServerTracingInitialized()).toBe(true)

            await shutdownServerTracing()
            expect(isServerTracingInitialized()).toBe(false)
        })
    })

    describe('integration scenarios', () => {
        test('should handle complete lifecycle: initialize -> shutdown', async () => {
            // Initialize
            const provider = initializeServerTracing(defaultOptions)
            expect(provider).toBeDefined()
            expect(isServerTracingInitialized()).toBe(true)

            // Verify all setup was done
            expect(mockNodeTracerProvider).toHaveBeenCalled()
            expect(mockResource).toHaveBeenCalled()
            expect(mockSimpleSpanProcessor).toHaveBeenCalled()
            expect(mockB3Propagator).toHaveBeenCalled()
            expect(mockPropagation.setGlobalPropagator).toHaveBeenCalled()
            expect(provider.register).toHaveBeenCalled()

            // Shutdown
            await shutdownServerTracing()
            expect(provider.shutdown).toHaveBeenCalled()
            expect(isServerTracingInitialized()).toBe(false)
        })

        test('should handle failed initialization followed by shutdown', async () => {
            // Mock initialization to fail
            mockNodeTracerProvider.mockImplementation(() => {
                throw new Error('Initialization failed')
            })

            // Initialize should fail
            const provider = initializeServerTracing(defaultOptions)
            expect(provider).toBeNull()
            expect(isServerTracingInitialized()).toBe(false)
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to initialize OpenTelemetry provider',
                {
                    namespace: 'opentelemetry-server.initializeServerTracing',
                    additionalProperties: {error: 'Initialization failed'}
                }
            )

            // Shutdown should still work gracefully
            await expect(shutdownServerTracing()).resolves.not.toThrow()
        })
    })

    describe('tracePerformance', () => {
        let tracePerformance
        let mockSpan, mockTracer

        beforeEach(() => {
            // Setup span mock
            mockSpan = {
                spanContext: jest.fn(() => ({
                    traceId: 'test-trace-id',
                    spanId: 'test-span-id'
                })),
                end: jest.fn(),
                setStatus: jest.fn(),
                parentSpanId: 'test-parent-span-id'
            }

            // Setup tracer mock
            mockTracer = {
                startSpan: jest.fn(() => mockSpan)
            }

            // Get the mocked OpenTelemetry API and configure it
            const otelApi = jest.requireMock('@opentelemetry/api')
            otelApi.trace.getTracer.mockReturnValue(mockTracer)
            otelApi.trace.setSpan.mockImplementation((ctx, span) => ({...ctx, span}))
            otelApi.context.active.mockReturnValue({})
            otelApi.context.with.mockImplementation((ctx, fn) => fn())

            // Import tracePerformance after setting up mocks
            const opentelemetryServer = jest.requireActual('./opentelemetry-server')
            tracePerformance = opentelemetryServer.tracePerformance
        })

        test('should trace performance successfully', async () => {
            const mockFn = jest.fn().mockResolvedValue('test-result')
            const mockRes = {
                setHeader: jest.fn()
            }
            const mockReq = {
                query: {__server_timing: ''}
            }

            const result = await tracePerformance('perf-test', mockFn, mockRes, mockReq)

            expect(mockTracer.startSpan).toHaveBeenCalledWith('perf-test', {
                attributes: {
                    'service.name': 'pwa-kit-react-sdk'
                }
            })
            const otelApi = jest.requireMock('@opentelemetry/api')
            expect(otelApi.context.with).toHaveBeenCalled()
            expect(mockFn).toHaveBeenCalled()
            expect(result).toBe('test-result')
            expect(mockSpan.end).toHaveBeenCalled()
        })

        test('should handle function errors', async () => {
            const mockFn = jest.fn().mockRejectedValue(new Error('Function failed'))
            const mockRes = {
                setHeader: jest.fn()
            }
            const mockReq = {
                query: {__server_timing: ''}
            }

            await expect(tracePerformance('perf-test', mockFn, mockRes, mockReq)).rejects.toThrow(
                'Function failed'
            )

            expect(mockSpan.setStatus).toHaveBeenCalledWith({
                code: 2, // ERROR
                message: 'Function failed'
            })
            expect(mockSpan.end).toHaveBeenCalled()
        })

        test('should inject B3 headers when tracing is enabled', async () => {
            const originalEnv = process.env.OTEL_TRACING_ENABLED
            process.env.OTEL_TRACING_ENABLED = 'true'

            // Ensure the mock returns enabled B3 tracing
            const opentelemetryConfig = jest.requireMock('../../utils/opentelemetry-config')
            opentelemetryConfig.getOTELConfig.mockReturnValue({
                serviceName: 'pwa-kit-react-sdk',
                enabled: true
            })

            const mockFn = jest.fn().mockResolvedValue('test-result')
            const mockRes = {
                setHeader: jest.fn()
            }
            const mockReq = {
                query: {__server_timing: ''}
            }

            await tracePerformance('perf-test', mockFn, mockRes, mockReq)

            expect(mockRes.setHeader).toHaveBeenCalledWith('x-b3-traceid', 'test-trace-id')
            expect(mockRes.setHeader).toHaveBeenCalledWith('x-b3-spanid', 'test-span-id')
            expect(mockRes.setHeader).toHaveBeenCalledWith('x-b3-sampled', '1')

            process.env.OTEL_TRACING_ENABLED = originalEnv
        })

        test('should not inject B3 headers when tracing is disabled', async () => {
            const originalEnv = process.env.OTEL_TRACING_ENABLED
            process.env.OTEL_TRACING_ENABLED = 'false'

            // Update the mock to return disabled B3 tracing
            const opentelemetryConfig = jest.requireMock('../../utils/opentelemetry-config')
            opentelemetryConfig.getOTELConfig.mockReturnValue({
                serviceName: 'pwa-kit-react-sdk',
                enabled: false
            })

            const mockFn = jest.fn().mockResolvedValue('test-result')
            const mockRes = {
                setHeader: jest.fn()
            }
            const mockReq = {
                query: {__server_timing: ''}
            }

            await tracePerformance('perf-test', mockFn, mockRes, mockReq)

            expect(mockRes.setHeader).not.toHaveBeenCalled()

            // Restore the original mock
            opentelemetryConfig.getOTELConfig.mockReturnValue({
                enabled: true,
                serviceName: 'pwa-kit-react-sdk'
            })
            process.env.OTEL_TRACING_ENABLED = originalEnv
        })
    })
})
