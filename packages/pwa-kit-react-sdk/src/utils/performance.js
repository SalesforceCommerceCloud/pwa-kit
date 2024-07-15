/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const NAMESPACE = 'pwa-kit-react-sdk:ssr'
const PERFORMANCE_MEASUREMENTS = {
    total: `${NAMESPACE}:total`,
    renderToString: `${NAMESPACE}:render-to-string`,
    routeMatching: `${NAMESPACE}:route-matching`,
    loadComponent: `${NAMESPACE}:load-component`,
    fetchStrategies: `${NAMESPACE}:fetch-strategies`,
    reactQueryPrerender: `${NAMESPACE}:fetch-strategies:react-query:pre-render`,
    reactQueryUseQuery: `${NAMESPACE}:fetch-strategies:react-query:use-query`,
    getProps: `${NAMESPACE}:fetch-strategies:get-props`
}
export const PERFORMANCE_MARKS = {
    totalStart: `${PERFORMANCE_MEASUREMENTS.total}:start`,
    totalEnd: `${PERFORMANCE_MEASUREMENTS.total}:end`,
    renderToStringStart: `${PERFORMANCE_MEASUREMENTS.renderToString}:start`,
    renderToStringEnd: `${PERFORMANCE_MEASUREMENTS.renderToString}:end`,
    routeMatchingStart: `${PERFORMANCE_MEASUREMENTS.routeMatching}:start`,
    routeMatchingEnd: `${PERFORMANCE_MEASUREMENTS.routeMatching}:end`,
    loadComponentStart: `${PERFORMANCE_MEASUREMENTS.loadComponent}:start`,
    loadComponentEnd: `${PERFORMANCE_MEASUREMENTS.loadComponent}:end`,
    fetchStrategiesStart: `${PERFORMANCE_MEASUREMENTS.fetchStrategies}:start`,
    fetchStrategiesEnd: `${PERFORMANCE_MEASUREMENTS.fetchStrategies}:end`,
    reactQueryPrerenderStart: `${PERFORMANCE_MEASUREMENTS.reactQueryPrerender}:start`,
    reactQueryPrerenderEnd: `${PERFORMANCE_MEASUREMENTS.reactQueryPrerender}:end`,
    reactQueryUseQueryStart: `${PERFORMANCE_MEASUREMENTS.reactQueryUseQuery}:start`,
    reactQueryUseQueryEnd: `${PERFORMANCE_MEASUREMENTS.reactQueryUseQuery}:end`,
    getPropsStart: `${PERFORMANCE_MEASUREMENTS.getProps}:start`,
    getPropsEnd: `${PERFORMANCE_MEASUREMENTS.getProps}:end`
}

export default class PerformanceTimer {
    buildServerTimingHeader(metrics) {
        const header = metrics
            .map((metric) => {
                return `${metric.name};dur=${metric.duration}`
            })
            .join(', ')

        return header
    }

    clearPerformanceMarks() {
        const marks = performance.getEntriesByType('mark')

        marks.forEach((mark) => {
            if (mark.name.includes(NAMESPACE)) {
                performance.clearMarks(mark.name)
            }
        })
    }

    getPerformanceMetrics() {
        // all marks follow the same pattern: pwa-kit-react-sdk:<name>:<start|end>(:<index>)
        // name components:
        // 1. namespace: pwa-kit-react-sdk
        // 2. event <name>
        // 3. <start|end>
        // 4. <index> (optional)
        const marks = performance.getEntriesByType('mark')
        const startMarks = new Map()
        const result = []

        marks.forEach((mark) => {
            if (!mark.name.includes('pwa-kit-react-sdk')) {
                return
            }

            if (mark.name.includes(':start')) {
                startMarks.set(mark.name, mark)
            }

            if (mark.name.includes(':end')) {
                const correspondingStartMarkName = mark.name.replace(':end', ':start')
                const startMark = startMarks.get(correspondingStartMarkName)
                if (startMark) {
                    const measurement = {
                        name: mark.name.replace(':end', '').replace(`${NAMESPACE}:`, ''),
                        duration: (mark.startTime - startMark.startTime).toFixed(2),
                        detail: mark.detail || null
                    }
                    result.push(measurement)
                }
            }
        })

        return result
    }

    mark(name, detail) {
        performance.mark(name, detail)
    }
}

/**
 * This is a utility function to get the SSR performance metrics.
 * The function returns an array of performance measurements.
 * The data is available in console logs and the http response header `server-timing`.
 *
 * @function
 * @private
 *
 * @return {Array}
 */
export const getPerformanceMetrics = () => {
    // all marks follow the same pattern: pwa-kit-react-sdk:<name>:<start|end>(:<index>)
    // name components:
    // 1. namespace: pwa-kit-react-sdk
    // 2. event <name>
    // 3. <start|end>
    // 4. <index> (optional)
    const marks = performance.getEntriesByType('mark')
    const startMarks = new Map()
    const result = []

    marks.forEach((mark) => {
        if (!mark.name.includes('pwa-kit-react-sdk')) {
            return
        }

        if (mark.name.includes(':start')) {
            startMarks.set(mark.name, mark)
        }

        if (mark.name.includes(':end')) {
            const correspondingStartMarkName = mark.name.replace(':end', ':start')
            const startMark = startMarks.get(correspondingStartMarkName)
            if (startMark) {
                const measurement = {
                    name: mark.name.replace(':end', '').replace(`${NAMESPACE}:`, ''),
                    duration: (mark.startTime - startMark.startTime).toFixed(2),
                    detail: mark.detail || null
                }
                result.push(measurement)
            }
        }
    })

    return result
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
export const buildServerTimingHeader = (metrics) => {
    const header = metrics
        .map((metric) => {
            return `${metric.name};dur=${metric.duration}`
        })
        .join(', ')

    return header
}

/**
 * This is a utility function that clears all performance marks created by the sdk.
 *
 * @function
 * @private
 *
 * @return {String}
 */
export const clearPerformanceMarks = () => {
    const marks = performance.getEntriesByType('mark')

    marks.forEach((mark) => {
        if (mark.name.includes(NAMESPACE)) {
            performance.clearMarks(mark.name)
        }
    })
}
