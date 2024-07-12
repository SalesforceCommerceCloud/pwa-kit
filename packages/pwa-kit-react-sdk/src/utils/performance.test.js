/**
 * @jest-environment node
 */
import {getPerformanceMetrics, clearPerformanceMarks, buildServerTimingHeader} from './performance'

describe('getPerformanceMetrics', () => {
    afterEach(() => {
        performance.clearMarks()
    })

    test('should return performance metrics', () => {
        performance.mark('pwa-kit-react-sdk:ssr:total:start')
        performance.mark('pwa-kit-react-sdk:ssr:total:end')
        const result = getPerformanceMetrics()
        expect(result.length).toEqual(1)
        expect(result[0].name).toEqual('pwa-kit-react-sdk:ssr:total')
    })
})

describe('buildServerTimingHeader', () => {
    test('should return an empty string if no performance metrics are provided', () => {
        const result = buildServerTimingHeader([])
        expect(result).toBe('')
    })

    test('should build the Server-Timing header', () => {
        const metrics = [
            {
                name: 'pwa-kit-react-sdk:ssr:fetch-stragegies:react-query:use-query:0',
                duration: 1000,
                detail: 'useProduct'
            },
            {name: 'pwa-kit-react-sdk:ssr:total', duration: 1900, detail: null}
        ]
        const result = buildServerTimingHeader(metrics)
        expect(result).toBe(
            'fetch-stragegies:react-query:use-query:0;dur=1000;desc="useProduct", total;dur=1900'
        )
    })
})

describe('clearPerformanceMarks', () => {
    afterEach(() => {
        performance.clearMarks()
    })
    test('should clear all performance marks created by the sdk', () => {
        performance.mark('pwa-kit-react-sdk:ssr:total:start')
        performance.mark('non-sdk:random:mark')
        const marks = performance.getEntriesByType('mark')
        expect(marks).toHaveLength(2)
        clearPerformanceMarks()
        const clearedMarks = performance.getEntriesByType('mark')
        expect(clearedMarks).toHaveLength(1)
    })
})
