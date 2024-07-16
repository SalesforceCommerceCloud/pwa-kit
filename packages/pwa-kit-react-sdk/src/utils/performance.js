/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import logger from './logger-instance'
export const PERFORMANCE_MARKS = {
    total: 'ssr:total',
    renderToString: 'ssr:render-to-string',
    routeMatching: 'ssr:route-matching',
    loadComponent: 'ssr:load-component',
    fetchStrategies: 'ssr:fetch-strategies',
    reactQueryPrerender: 'ssr:fetch-strategies:react-query:pre-render',
    reactQueryUseQuery: 'ssr:fetch-strategies:react-query:use-query',
    getProps: 'ssr:fetch-strategies:get-prop'
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
                return `${metric.name};dur=${metric.duration}`
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
     * @function
     * @private
     */
    mark(name, type, options = {}) {
        if (!this.enabled) {
            return
        }

        if (!name) {
            logger.warn('Performance mark cannot be created because the name is undefined.', {
                namespace: 'performance'
            })
            return
        }

        if (type !== this.MARKER_TYPES.START && type !== this.MARKER_TYPES.END) {
            logger.warn(
                'Performance mark cannot be created because the type must be either "start" or "end".',
                {
                    namespace: 'performance'
                }
            )
            return
        }

        const timestamp = performance.now()
        const isEnd = type === this.MARKER_TYPES.END
        const storage = isEnd ? this.marks.end : this.marks.start
        storage.set(name, {
            name,
            timestamp,
            detail: options.detail
        })

        if (isEnd) {
            const startMark = this.marks.start.get(name)
            if (startMark) {
                const measurement = {
                    name,
                    duration: (timestamp - startMark.timestamp).toFixed(2),
                    detail: options.detail
                }
                this.metrics.push(measurement)
            }
        }
    }
}
