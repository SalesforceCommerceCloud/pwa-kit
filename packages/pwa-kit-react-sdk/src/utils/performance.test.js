import {performance} from 'perf_hooks'
import {getPerformanceMetrics} from './performance'

describe('getPerformanceMetrics', () => {
    let getEntriesByType

    beforeAll(() => {
        // Store the original performance.mark
        getEntriesByType = performance.getEntriesByType
    })

    beforeEach(() => {
        // Mock performance.mark using Object.defineProperty
        Object.defineProperty(performance, 'getEntriesByType', {
            configurable: true,
            writable: true,
            value: jest.fn().mockReturnValue([
                {
                    name: 'pwa-kit-react-sdk:ssr:total:start',
                    startTime: 100
                },
                {
                    name: 'pwa-kit-react-sdk:ssr:total:end',
                    startTime: 2000
                },
                {
                    name: 'pwa-kit-react-sdk:ssr:fetch-stragegies:react-query:use-query:start:0',
                    startTime: 500
                },
                {
                    name: 'pwa-kit-react-sdk:ssr:fetch-stragegies:react-query:use-query:end:0',
                    startTime: 1500,
                    detail: 'useProduct'
                }
            ])
        })
    })

    afterEach(() => {
        // Restore the original performance.mark after each test
        Object.defineProperty(performance, 'getEntriesByType', {
            configurable: true,
            writable: true,
            value: getEntriesByType
        })
    })

    test('should return performance metrics', () => {
        const result = getPerformanceMetrics()
        expect(result).toEqual([
            {detail: null, duration: 1900, name: 'pwa-kit-react-sdk:ssr:total'},
            {
                detail: 'useProduct',
                duration: 1000,
                name: 'pwa-kit-react-sdk:ssr:fetch-stragegies:react-query:use-query:0'
            }
        ])
    })
})
