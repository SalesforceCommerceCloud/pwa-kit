/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import logger from './logger-instance'
import {createChildSpan, endSpan, logPerformanceMetric} from './opentelemetry'

export const PERFORMANCE_MARKS = {
    total: 'ssr.total',
    renderToString: 'ssr.render-to-string',
    routeMatching: 'ssr.route-matching',
    loadComponent: 'ssr.load-component',
    fetchStrategies: 'ssr.fetch-strategies',
    reactQueryPrerender: 'ssr.fetch-strategies.react-query.pre-render',
    reactQueryUseQuery: 'ssr.fetch-strategies.react-query.use-query',
    getProps: 'ssr.fetch-strategies.get-prop'
}

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
        this.marks = {
            start: new Map(),
            end: new Map()
        }
        this.metrics = []
        this.spans = new Map()
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
     * Logs all performance metrics
     */
    log() {
        // Log each metric once with the standardized format
        this.metrics.forEach((metric) => {
            logPerformanceMetric(metric.name, metric.duration, {
                'performance.detail': metric.detail || ''
            })
        })

        // Clear the metrics after logging
        this.metrics = []
    }

    /**
     * This is a utility function to create performance marks.
     * The data will be used in console logs and the http response header `server-timing`.
     *
     * @function
     * @private
     */
    mark(name, type, detail = '') {
        if (!name || !type || !this.enabled) {
            return
        }

        try {
            // Format detail as a string if it's an object
            const formattedDetail = typeof detail === 'object' ? JSON.stringify(detail) : detail

            const mark = {
                name: `${name}.${type}`,
                entryType: 'mark',
                startTime: performance.now(),
                detail: formattedDetail
            }

            performance.mark(mark.name, {
                detail: mark.detail
            })

            // Only create spans for 'start' events and store them for later use
            if (type === 'start') {
                if (!this.spans.has(name)) {
                    const span = createChildSpan(name, {
                        performance_mark: name,
                        performance_type: type,
                        performance_detail: formattedDetail
                    })
                    if (span) {
                        this.spans.set(name, span)
                    }
                }
            } else if (type === 'end') {
                const startMark = `${name}.start`
                const endMark = `${name}.end`

                try {
                    const measure = performance.measure(name, startMark, endMark)

                    // Add the metric to the metrics array for Server-Timing header
                    this.metrics.push({
                        name,
                        duration: measure.duration,
                        detail: formattedDetail
                    })

                    // End the corresponding span if it exists
                    const span = this.spans.get(name)
                    if (span) {
                        endSpan(span)
                        this.spans.delete(name)
                    }

                    // Clear the marks
                    performance.clearMarks(startMark)
                    performance.clearMarks(endMark)
                    performance.clearMeasures(name)
                } catch (error) {
                    logger.warn('Failed to measure performance mark', {
                        name,
                        error: error.message,
                        startMark,
                        endMark
                    })
                }
            }
        } catch (error) {
            logger.error('Error creating performance mark', {
                name,
                type,
                error: error.message,
                stack: error.stack
            })
        }
    }
}