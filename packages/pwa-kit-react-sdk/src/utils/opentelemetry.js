/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {trace, context, SpanStatusCode} from '@opentelemetry/api'
import {hrTimeToTimeStamp} from '@opentelemetry/core'
import logger from './logger-instance'
import {getOTELConfig, getServiceName} from './opentelemetry-config'

export const logSpanData = (span, event = 'start') => {
    if (!getOTELConfig().enabled) {
        return
    }

    const spanContext = span.spanContext()
    const startTime = span.startTime
    const endTime = event === 'start' ? startTime : span.endTime
    const duration = event === 'start' ? 0 : span.duration

    if (
        !Array.isArray(startTime) ||
        startTime.length !== 2 ||
        (duration !== 0 && (!Array.isArray(duration) || duration.length !== 2))
    ) {
        logger.warn(
            'Invalid timing data detected - OpenTelemetry may not be properly initialized',
            {
                namespace: 'opentelemetry',
                additionalProperties: {
                    span_name: span.name,
                    event: event,
                    startTime_valid: Array.isArray(startTime) && startTime.length === 2,
                    duration_valid:
                        duration === 0 || (Array.isArray(duration) && duration.length === 2),
                    otel_enabled: getOTELConfig().enabled,
                    startTime_type: typeof startTime,
                    startTime_value: startTime
                }
            }
        )
    }

    // Create the span data object that matches the expected format
    const spanData = {
        traceId: spanContext.traceId,
        parentId: span.parentSpanId,
        name: span.name,
        id: spanContext.spanId,
        kind: span.kind,
        timestamp: startTime ? hrTimeToTimeStamp(startTime) : undefined,
        duration: duration,
        attributes: {
            'service.name': getServiceName(),
            ...span.attributes,
            event: event // Add event type to distinguish start/end
        },
        status: {code: event === 'start' ? SpanStatusCode.UNSET : SpanStatusCode.OK},
        events: [],
        links: [],
        start_time: startTime,
        end_time: endTime,
        forwardTrace: getOTELConfig().enabled
    }

    if (event === 'end') {
        console.info(JSON.stringify(spanData))
    }
}

/**
 * Creates a new span with the given name and options
 * @param {string} name - The name of the span
 * @param {Object} options - Span options
 * @returns {Span} The created span
 */
export const createSpan = (name, options = {}) => {
    try {
        const tracer = trace.getTracer(getServiceName())

        // Create a new span with the current context
        const span = tracer.startSpan(
            name,
            {
                ...options,
                attributes: {
                    ...options.attributes,
                    'service.name': getServiceName()
                }
            },
            context.active()
        )

        return trace.setSpan(context.active(), span)
    } catch (error) {
        logger.error('Failed to create span', {
            namespace: 'opentelemetry',
            additionalProperties: {
                spanName: name,
                error: error.message
            }
        })
        return null
    }
}

/**
 * Creates a child span with the given name and attributes
 * @param {string} name - The name of the span
 * @param {Object} attributes - The attributes to add to the span
 * @returns {Span} The created span
 */
export const createChildSpan = (name, attributes = {}) => {
    try {
        // Check if OpenTelemetry is properly configured
        const otelConfig = getOTELConfig()
        if (!otelConfig.enabled) {
            logger.warn('OpenTelemetry is disabled - spans will not have proper timing data', {
                namespace: 'opentelemetry',
                additionalProperties: {
                    span_name: name,
                    otel_enabled: otelConfig.enabled,
                    otel_service_name: otelConfig.serviceName,
                    suggestion: 'Set OTEL_TRACING_ENABLED=true to enable proper timing'
                }
            })
        }

        const tracer = trace.getTracer(getServiceName())
        const ctx = context.active()
        const parentSpan = trace.getSpan(ctx)

        // Don't create duplicate spans
        if (parentSpan?.attributes?.performance_mark === name) {
            return parentSpan
        }

        const {performance_mark, performance_detail, ...otherAttributes} = attributes

        const spanAttributes = {
            'service.name': getServiceName(),
            ...otherAttributes
        }

        if (performance_mark) {
            spanAttributes['performance.mark'] = performance_mark
            spanAttributes['performance.type'] = 'start'
            spanAttributes['performance.detail'] =
                typeof performance_detail === 'string'
                    ? performance_detail
                    : JSON.stringify(performance_detail)
        }

        const span = tracer.startSpan(
            name,
            {
                attributes: spanAttributes
            },
            parentSpan ? ctx : undefined
        )

        return span
    } catch (error) {
        logger.error('Error creating OpenTelemetry span', {
            namespace: 'opentelemetry',
            additionalProperties: {
                spanName: name,
                error: error.message
            }
        })
        return null
    }
}

/**
 * Ends a span and logs its data
 * @param {Span} span - The span to end
 */
export const endSpan = (span) => {
    if (!span) {
        return
    }

    try {
        span.end()

        // Log completion data
        logSpanData(span, 'end')
    } catch (error) {
        logger.error('Error ending OpenTelemetry span', {
            namespace: 'opentelemetry',
            additionalProperties: {
                error: error.message
            }
        })
    }
}
