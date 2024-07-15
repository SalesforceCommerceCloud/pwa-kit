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
// export const PERFORMANCE_MARKS = {
//     totalStart: `${PERFORMANCE_MEASUREMENTS.total}:start`,
//     totalEnd: `${PERFORMANCE_MEASUREMENTS.total}:end`,
//     renderToStringStart: `${PERFORMANCE_MEASUREMENTS.renderToString}:start`,
//     renderToStringEnd: `${PERFORMANCE_MEASUREMENTS.renderToString}:end`,
//     routeMatchingStart: `${PERFORMANCE_MEASUREMENTS.routeMatching}:start`,
//     routeMatchingEnd: `${PERFORMANCE_MEASUREMENTS.routeMatching}:end`,
//     loadComponentStart: `${PERFORMANCE_MEASUREMENTS.loadComponent}:start`,
//     loadComponentEnd: `${PERFORMANCE_MEASUREMENTS.loadComponent}:end`,
//     fetchStrategiesStart: `${PERFORMANCE_MEASUREMENTS.fetchStrategies}:start`,
//     fetchStrategiesEnd: `${PERFORMANCE_MEASUREMENTS.fetchStrategies}:end`,
//     reactQueryPrerenderStart: `${PERFORMANCE_MEASUREMENTS.reactQueryPrerender}:start`,
//     reactQueryPrerenderEnd: `${PERFORMANCE_MEASUREMENTS.reactQueryPrerender}:end`,
//     reactQueryUseQueryStart: `${PERFORMANCE_MEASUREMENTS.reactQueryUseQuery}:start`,
//     reactQueryUseQueryEnd: `${PERFORMANCE_MEASUREMENTS.reactQueryUseQuery}:end`,
//     getPropsStart: `${PERFORMANCE_MEASUREMENTS.getProps}:start`,
//     getPropsEnd: `${PERFORMANCE_MEASUREMENTS.getProps}:end`
// }

/**
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

    buildServerTimingHeader() {
        const header = this.metrics
            .map((metric) => {
                return `${metric.name};dur=${metric.duration}`
            })
            .join(', ')

        return header
    }

    log() {
        this.metrics.forEach((metric) => {
            logger.debug(`${metric.name} - ${metric.duration}ms ${metric.detail || ''}`, {
                namespace: 'performance'
            })
        })
    }

    mark(name, type, options = {}) {
        if (!this.enabled) {
            return
        }

        if (!name) {
            console.warn('Performance mark cannot be created because the name is undefined.')
            return
        }

        if (type !== this.MARKER_TYPES.START && type !== this.MARKER_TYPES.END) {
            console.warn(
                'Performance mark cannot be created because the type must be either "start" or "end".'
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
