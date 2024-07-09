const NAMESPACE = 'pwa-kit-react-sdk:ssr'
export const PERFORMANCE_MARKS = {
    totalStart: `${NAMESPACE}:total:start`,
    totalEnd: `${NAMESPACE}:total:end`,
    renderToStringStart: `${NAMESPACE}:render-to-string:start`,
    renderToStringEnd: `${NAMESPACE}:render-to-string:end`,
    routeMatchingStart: `${NAMESPACE}:route-matching:start`,
    routeMatchingEnd: `${NAMESPACE}:route-matching:end`,
    loadComponentStart: `${NAMESPACE}:load-component:start`,
    loadComponentEnd: `${NAMESPACE}:load-component:end`,
    asyncOperationsStart: `${NAMESPACE}:async-operations:start`,
    asyncOperationsEnd: `${NAMESPACE}:async-operations:end`,
    reactQueryPrerenderStart: `${NAMESPACE}:async-operations:react-query:pre-render:start`,
    reactQueryPrerenderEnd: `${NAMESPACE}:async-operations:react-query:pre-render:end`,
    reactQueryUseQueryStart: `${NAMESPACE}:async-operations:react-query:use-query:start`,
    reactQueryUseQueryEnd: `${NAMESPACE}:async-operations:react-query:use-query:end`
}

/**
 * This is a utility function to measure the performance of a specific performance mark.
 *
 * @param name - string (name of the performance mark)
 * @param detail - string (description of the performance mark)
 *
 * @function
 * @private
 *
 * @return {PerformanceMeasure}
 */
const measurePerformance = (name, detail) => {
    let _detail = detail
    if (!detail) {
        const endMark = performance.getEntriesByName(`${name}:end`, 'mark')[0]
        _detail = endMark?.detail || undefined
    }
    return performance.measure(name, {start: `${name}:start`, end: `${name}:end`, _detail})
}

/**
 * This is a utility function to get the SSR performance metrics.
 * The function returns a map of performance measurements.
 * The data is embedded in the HTML response and will be used by the client-side code to analyze the SSR performance.
 *
 * @function
 * @private
 *
 * @return {Object}
 */
export const getPerformanceMetrics = () => {
    const a = performance.getEntriesByType('mark')
    console.log(a)

    // TODO: calculate durations
    // dynamically calculate useQuery and getProps
    return {
        total: measurePerformance('pwa-kit-react-sdk:ssr:total')
    }
}
