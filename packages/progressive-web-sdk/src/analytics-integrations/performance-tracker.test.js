/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {PerformanceTracker} from './performance-tracker'
import {PERFORMANCE} from './types'

describe('PerformanceTracker', () => {
    test('Sends the correct performance data to the analytics manager', () => {
        const navigationStart = 10
        const fp = 20
        const fcp = 30
        const appStart = 40
        const tti = 50

        const ttiPolyfillMock = {
            getFirstConsistentlyInteractive: jest.fn(() => Promise.resolve(tti))
        }

        const performanceMock = {
            now: jest.fn(() => 1),
            timing: {
                navigationStart
            },
            getEntriesByName: jest.fn((name) => {
                const values = {
                    'first-paint': fp,
                    'first-contentful-paint': fcp
                }
                return [values[name]]
            })
        }

        const analyticsMock = {
            track: jest.fn()
        }
        const opts = {
            performance: performanceMock,
            appStart: appStart,
            bundle: 'some-bundle-name',
            ttiPolyfill: ttiPolyfillMock
        }
        const pt = new PerformanceTracker(analyticsMock, opts)
        const firstLoad = {start: 3333, end: 4444}
        const subsequentLoad = {start: 5555, end: 6666}

        return Promise.resolve()
            .then(() => pt.trackPageLoad(firstLoad))
            .then(() => pt.trackPageLoad(subsequentLoad))
            .then(() => {
                expect(analyticsMock.track.mock.calls).toEqual([
                    [
                        PERFORMANCE,
                        {
                            app_start: appStart,
                            bundle: opts.bundle,
                            first_contentful_paint: fcp,
                            first_paint: fp,
                            full_page_load: firstLoad.end - firstLoad.start,
                            time_to_interactive: tti,
                            timing_start: navigationStart,
                            is_first_load: true
                        }
                    ],
                    [
                        PERFORMANCE,
                        {
                            app_start: appStart,
                            bundle: opts.bundle,
                            first_contentful_paint: fcp,
                            first_paint: fp,
                            full_page_load: subsequentLoad.end - subsequentLoad.start,
                            time_to_interactive: null,
                            timing_start: navigationStart,
                            is_first_load: false
                        }
                    ]
                ])
            })
    })

    test('Does nothing if the performance APIs are unavailable', () => {
        const analyticsMock = {
            track: jest.fn()
        }
        const opts = {performance: null}
        const pt = new PerformanceTracker(analyticsMock, opts)
        const firstLoad = {start: 1, end: 2}
        return Promise.resolve()
            .then(() => pt.trackPageLoad(firstLoad))
            .then(() => {
                expect(analyticsMock.track.mock.calls).toEqual([])
            })
    })
})
