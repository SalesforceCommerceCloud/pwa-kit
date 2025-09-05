/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {NodeTracerProvider} from '@opentelemetry/sdk-trace-node'
import {SimpleSpanProcessor} from '@opentelemetry/sdk-trace-base'
import {B3Propagator} from '@opentelemetry/propagator-b3'
import {Resource} from '@opentelemetry/resources'
import {propagation} from '@opentelemetry/api'
import logger from '../../utils/logger-instance'
import {getServiceName, getOTELConfig} from '../../utils/opentelemetry-config'
import {trace, context, SpanStatusCode} from '@opentelemetry/api'
import {logSpanData} from '../../utils/opentelemetry'

let provider = null

/**
 * Initialize OpenTelemetry tracing for server-side rendering
 * @param {Object} options
 * @param {string} [options.serviceName]
 * @param {string} [options.serviceVersion]
 * @param {boolean} [options.enabled]
 * @returns {NodeTracerProvider|null}
 */
export const initializeServerTracing = (options = {}) => {
    const {
        serviceName = options.serviceName || getServiceName(),
        serviceVersion,
        enabled = getOTELConfig().enabled
    } = options
    // If tracing is disabled, return null without initializing
    if (!enabled) {
        return null
    }

    try {
        // Build resource attributes
        const resourceAttributes = {
            'service.name': serviceName
        }

        // Add service version if provided
        if (serviceVersion) {
            resourceAttributes['service.version'] = serviceVersion
        }

        // Initialize the tracer provider
        provider = new NodeTracerProvider({
            resource: new Resource(resourceAttributes),
            spanProcessor: new SimpleSpanProcessor()
        })

        // Add B3 propagator
        propagation.setGlobalPropagator(new B3Propagator())
        provider.register()

        return provider
    } catch (error) {
        // Log errors from OpenTelemetry initialization
        logger.error('Failed to initialize OpenTelemetry provider', {
            namespace: 'opentelemetry-server.initializeServerTracing',
            additionalProperties: {error: error.message}
        })
        return null
    }
}

/**
 * Shutdown OpenTelemetry tracing and clean up resources
 * @returns {Promise<void>}
 */
export const shutdownServerTracing = async () => {
    if (provider) {
        try {
            await provider.shutdown()
            provider = null // Clean up after successful shutdown
        } catch (error) {
            logger.warn('Failed to shutdown OpenTelemetry provider', {
                namespace: 'opentelemetry-server.shutdownServerTracing',
                additionalProperties: {error: error.message}
            })
        }
    }
}

/**
 * Get the current OpenTelemetry provider instance
 * @returns {NodeTracerProvider|null} The current provider or null if not initialized
 */
export const getServerTracingProvider = () => {
    return provider
}

/**
 * Check if OpenTelemetry tracing is currently initialized
 * @returns {boolean} True if tracing is initialized, false otherwise
 */
export const isServerTracingInitialized = () => {
    return provider !== null
}

/**
 * Creates a span for performance measurement
 * @param {string} name - The name of the performance span
 * @param {Function} fn - The function to measure
 * @param {Object} res - The response object (optional)
 * @returns {Promise<any>} The result of the function
 */
export const tracePerformance = async (name, fn, res = null, req = null) => {
    // Check if OpenTelemetry is properly configured
    const otelConfig = getOTELConfig()
    let rootSpan = null
    let ctx = null
    const includeServerTimingHeader = '__server_timing' in req.query
    const shouldTrackPerformance = includeServerTimingHeader || process.env.SERVER_TIMING
    if (otelConfig.enabled && shouldTrackPerformance) {
        // Initialize server tracing if needed for this request
        if (shouldTrackPerformance && !isServerTracingInitialized()) {
            initializeServerTracing()
        }

        const tracer = trace.getTracer(getServiceName())
        // Create the root span
        rootSpan = tracer.startSpan(name, {
            attributes: {
                'service.name': getServiceName()
            }
        })

        // Create a new context with the root span
        ctx = trace.setSpan(context.active(), rootSpan)

        // Inject B3 headers into response if available
        if (res && getOTELConfig().enabled && shouldTrackPerformance) {
            res.setHeader('x-b3-traceid', rootSpan.spanContext().traceId)
            res.setHeader('x-b3-spanid', rootSpan.spanContext().spanId)
            res.setHeader('x-b3-sampled', '1')
        }
    }

    try {
        // Run the function within the context of the root span (if ctx exists)
        const result = ctx
            ? await context.with(ctx, async () => {
                  try {
                      return await fn()
                  } catch (error) {
                      rootSpan.setStatus({
                          code: SpanStatusCode.ERROR,
                          message: error.message
                      })
                      throw error
                  }
              })
            : await fn()

        if (otelConfig.enabled && shouldTrackPerformance) {
            rootSpan.end()
            logSpanData(rootSpan, 'end', res)
        }

        return result
    } catch (error) {
        if (otelConfig.enabled && shouldTrackPerformance) {
            rootSpan.end()
            logSpanData(rootSpan, 'end', res)
        }

        throw error
    }
}
