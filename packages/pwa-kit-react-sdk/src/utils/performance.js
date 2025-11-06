/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import logger from './logger-instance'
import {createChildSpan, endSpan} from './opentelemetry'

/**
 * This is an SDK internal class that is responsible for measuring server side performance.
 *
 * This class manages two types of performance marks: start and end.
 *
 * By default, this timer is disabled. Only certain environment variables and feature flags turns it on.
 *
 * @private
 */
export default class PerformanceTimer {
    MARKER_TYPES = {
        START: 'start',
        END: 'end'
    }
    constructor(options = {}) {
        this.enabled = options.enabled || false
        this.metrics = []
        this.spans = new Map()
        this.spanTimeouts = new Map()
        this.maxSpanDuration = options.maxSpanDuration || 30000 // 30 seconds default
    }

    /**
     * This is a utility function to build the Server-Timing header.
     * The function receives an array of performance metrics and returns a string that represents the Server-Timing header.
     *
     * see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing
     *
     * @function
     * @private
     *
     * @return {String}
     */
    buildServerTimingHeader() {
        const header = this.metrics
            .map((metric) => {
                return `${metric.name};dur=${metric.duration.toFixed(2)}`
            })
            .join(', ')

        return header
    }

    /**
     * A utility function to format and log the performance metrics.
     *
     * @function
     * @private
     */
    log() {
        this.metrics.forEach((metric) => {
            logger.info(`${metric.name} - ${metric.duration}ms ${metric.detail || ''}`, {
                namespace: 'performance'
            })
        })
    }

    /**
     * This is a utility function to create performance marks.
     * The data will be used in console logs and the http response header `server-timing`.
     *
     * @param {string} name - Unique identifier for the performance measurement.
     * Must be the same for both start and end marks of a pair. E.g. 'ssr.render-to-string'
     *
     * @param {string} type - Mark type, either 'start' or 'end'. 'start' creates spans and browser marks,
     * 'end' completes measurement and cleanup.
     *
     * @param {Object} [options={}] - Optional configuration object
     * @param {string|Object} [options.detail=''] - Additional metadata for the mark
     * included in logs and tracing attributes.
     */
    mark(name, type, options = {}) {
        const {detail = ''} = options
        if (!this.enabled || !name || !type) {
            return
        }

        if (type !== this.MARKER_TYPES.START && type !== this.MARKER_TYPES.END) {
            logger.warn('Invalid mark type', {type, name, namespace: 'PerformanceTimer.mark'})
            return
        }

        try {
            performance.mark(`${name}.${type}`, {
                detail: detail
            })

            // Only create spans for 'start' events and store them for later use
            if (type === this.MARKER_TYPES.START) {
                if (!this.spans.has(name)) {
                    const span = createChildSpan(name, {
                        performance_mark: name,
                        performance_type: type,
                        performance_detail: detail
                    })
                    if (span) {
                        this.spans.set(name, span)

                        // Set up automatic cleanup for orphaned spans
                        const timeoutId = setTimeout(() => {
                            this._cleanupOrphanedSpan(name, 'timeout')
                        }, this.maxSpanDuration)
                        this.spanTimeouts.set(name, timeoutId)
                    }
                } else {
                    logger.warn('Span already exists', {
                        name,
                        namespace: 'PerformanceTimer.mark'
                    })
                }
            } else if (type === this.MARKER_TYPES.END) {
                const startMark = `${name}.${this.MARKER_TYPES.START}`
                const endMark = `${name}.${this.MARKER_TYPES.END}`

                try {
                    const measure = performance.measure(name, startMark, endMark)

                    // Add the metric to the metrics array for Server-Timing header
                    this.metrics.push({
                        name,
                        duration: measure.duration,
                        detail: detail
                    })

                    // End the corresponding span if it exists and clear timeout
                    const span = this.spans.get(name)
                    if (span) {
                        endSpan(span)
                        this.spans.delete(name)

                        // Clear the timeout since span completed normally
                        const timeoutId = this.spanTimeouts.get(name)
                        if (timeoutId) {
                            clearTimeout(timeoutId)
                            this.spanTimeouts.delete(name)
                        }
                    }

                    // Clear the marks
                    performance.clearMarks(startMark)
                    performance.clearMarks(endMark)
                    performance.clearMeasures(name)
                } catch (error) {
                    logger.error('Failed to measure performance mark', {
                        name,
                        error: error.message,
                        startMark,
                        endMark,
                        namespace: 'PerformanceTimer.mark'
                    })
                }
            }
        } catch (error) {
            if (error.name === 'SyntaxError') {
                logger.error('Invalid performance mark name', {name, error: error.message})
            } else {
                logger.error('Error creating performance mark:', {
                    name,
                    type,
                    error: error.message,
                    namespace: 'PerformanceTimer.mark'
                })
            }
        }
    }

    /**
     * Helper method to clean up a specific orphaned span
     * @private
     */
    _cleanupOrphanedSpan(name, reason = 'manual') {
        const span = this.spans.get(name)
        if (span) {
            logger.warn('Cleaning up orphaned span', {
                name,
                error: 'Deleting orphaned span (reason: ' + reason + ' cleanup)',
                namespace: 'PerformanceTimer._cleanupOrphanedSpan'
            })
            endSpan(span)
            this.spans.delete(name)
        }

        // Clear the timeout
        const timeoutId = this.spanTimeouts.get(name)
        if (timeoutId) {
            clearTimeout(timeoutId)
            this.spanTimeouts.delete(name)
        }
    }

    /**
     * Clean up all orphaned spans and clear all timeouts
     * Call this when the timer is no longer needed or when you want to force cleanup
     */
    cleanup() {
        // Clean up any orphaned spans
        this.spans.forEach((span, name) => {
            this._cleanupOrphanedSpan(name, 'manual_cleanup')
        })

        // Clear any remaining timeouts
        this.spanTimeouts.forEach((timeoutId) => {
            clearTimeout(timeoutId)
        })
        this.spanTimeouts.clear()

        // Clear metrics as well
        this.metrics = []
    }
}
