const NAMESPACE = 'pwa-kit-react-sdk:ssr'
const PERFORMANCE_MEASUREMENTS = {
    total: `${NAMESPACE}:total`,
    renderToString: `${NAMESPACE}:render-to-string`,
    routeMatching: `${NAMESPACE}:route-matching`,
    loadComponent: `${NAMESPACE}:load-component`,
    fetchStrategies: `${NAMESPACE}:fetch-stragegies`,
    reactQueryPrerender: `${NAMESPACE}:fetch-stragegies:react-query:pre-render`,
    reactQueryUseQuery: `${NAMESPACE}:fetch-stragegies:react-query:use-query`,
    getProps: `${NAMESPACE}:fetch-stragegies:get-props`
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
    fetchStragegiesStart: `${PERFORMANCE_MEASUREMENTS.fetchStrategies}:start`,
    fetchStragegiesEnd: `${PERFORMANCE_MEASUREMENTS.fetchStrategies}:end`,
    reactQueryPrerenderStart: `${PERFORMANCE_MEASUREMENTS.reactQueryPrerender}:start`,
    reactQueryPrerenderEnd: `${PERFORMANCE_MEASUREMENTS.reactQueryPrerender}:end`,
    reactQueryUseQueryStart: `${PERFORMANCE_MEASUREMENTS.reactQueryUseQuery}:start`,
    reactQueryUseQueryEnd: `${PERFORMANCE_MEASUREMENTS.reactQueryUseQuery}:end`,
    getPropsStart: `${PERFORMANCE_MEASUREMENTS.getProps}:start`,
    getPropsEnd: `${PERFORMANCE_MEASUREMENTS.getProps}:end`
}

/**
 * This is a utility function to get the SSR performance metrics.
 * The function returns an array of performance measurements.
 * The data is embedded in the HTML response and will be used to analyze the SSR performance.
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
                    name: mark.name.replace(':end', ''),
                    duration: mark.startTime - startMark.startTime,
                    detail: mark.detail || null
                }
                result.push(measurement)
            }
        }
    })

    return result
}
