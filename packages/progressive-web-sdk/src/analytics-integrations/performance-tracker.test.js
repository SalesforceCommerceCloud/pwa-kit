/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {AnalyticsManager} from './analytics-manager'
import {PerformanceTracker} from './performance-tracker'
import ttiPolyfill from 'tti-polyfill'
import {PERFORMANCE} from './types'
import {advanceTo} from 'jest-date-mock'

class Connector {
    load() {
        return Promise.resolve()
    }

    track(type, data) {
        return data
    }
}

describe('Performance Tracker', () => {
    let am
    let connector
    let mainScript

    beforeEach(() => {
        ttiPolyfill.getFirstConsistentlyInteractive = jest.fn(() => 0)
        ;[...document.getElementsByTagName('script')].forEach((script) => {
            document.body.removeChild(script)
        })

        window.Progressive = {}

        if (document.getElementsByClassName('react-target').length !== 0) {
            document.body.removeChild(document.getElementsByClassName('react-target')[0])
        }

        // Build react-target DOM element
        const reactRoot = document.createElement('div')
        reactRoot.className = 'react-target'
        document.body.appendChild(reactRoot)

        mainScript = document.createElement('script')
        mainScript.id = 'progressive-web-main'
        mainScript.src = '/test.js'
        document.body.appendChild(mainScript)

        window.Progressive.PerformanceTiming = {
            timingStart: 0,
            pageStart: 0,
            mobifyStart: 0,
            appStart: 0,
            firstPaint: 0,
            firstContentfulPaint: 0
        }

        connector = new Connector()
        connector.load = jest.fn(() => {
            return Promise.resolve()
        })
        am = new AnalyticsManager({
            connectors: [connector]
        })
    })

    test('Tracker is instantiated with Analytics Manager', () => {
        const pt = am.performanceTracker
        expect(pt).toBeInstanceOf(PerformanceTracker)
        expect(pt.analytics).toBe(am)
        expect(pt.firstLoad).toBeTruthy()
        expect(pt.bundle).toBe('development')
    })

    test('If the main script (#progressive-web-main) has an src with string `production` in it, the `bundle` property is `production`', () => {
        mainScript.src = '/asdf-production.js'
        am = new AnalyticsManager({
            connectors: [connector]
        })
        expect(am.performanceTracker.bundle).toBe('production')
    })

    test('trackPageLoad() calls Analytics Manager track() with type `performance` and a set of metrics', () => {
        am.track = jest.fn()
        am.performanceTracker.analytics.track = jest.fn()

        expect.assertions(13)

        return am.performanceTracker.trackPageLoad(Promise.resolve()).then(() => {
            expect(am.performanceTracker.analytics.track).toHaveBeenCalledTimes(1)
            expect(am.track).toHaveBeenCalledTimes(1)
            expect(am.track.mock.calls[0][0]).toBe(PERFORMANCE)
            const metrics = am.track.mock.calls[0][1]
            expect(metrics.bundle).toEqual(expect.any(String))
            expect(metrics.page_start).toEqual(expect.any(Number))
            expect(metrics.timing_start).toEqual(expect.any(Number))
            expect(metrics.mobify_start).toEqual(expect.any(Number))
            expect(metrics.app_start).toEqual(expect.any(Number))
            expect(metrics.full_page_load).toEqual(expect.any(Number))
            expect(metrics.first_paint).toEqual(expect.any(Number))
            expect(metrics.first_contentful_paint).toEqual(expect.any(Number))
            expect(metrics.time_to_interactive).toEqual(expect.any(Number))
            expect(metrics.is_first_load).toEqual(expect.any(Boolean))
        })
    })

    test('After calling trackPageLoad on a first page load, property `firstLoad` should turn false and should not call ttiPolyfill', () => {
        am.track = jest.fn()
        expect(am.performanceTracker.firstLoad).toBeTruthy()
        expect.assertions(4)

        return am.performanceTracker
            .trackPageLoad(Promise.resolve())
            .then(() => {
                expect(ttiPolyfill.getFirstConsistentlyInteractive).toHaveBeenCalled()
                expect(am.performanceTracker.firstLoad).toBeFalsy()
            })
            .then(() => {
                ttiPolyfill.getFirstConsistentlyInteractive.mockClear()
                am.performanceTracker.trackPageLoad(Promise.resolve())
            })
            .then(() => {
                expect(ttiPolyfill.getFirstConsistentlyInteractive).not.toHaveBeenCalled()
            })
    })

    test('getPerformanceTime() uses performance.now() time if performance timing API is defined, otherwise uses Date.now()', () => {
        const now = Date.now()
        advanceTo(now)

        expect(window.performance.timing).toBeUndefined()
        expect(am.performanceTracker.getPerformanceTime()).toBe(now)

        window.performance.timing = {navigationStart: 0}
        window.performance.now = jest.fn()

        expect(am.performanceTracker.getPerformanceTime()).not.toBe(now)
        expect(window.performance.now).toHaveBeenCalledTimes(1)
    })

    test('if initPagePromise fails, throw error', () => {
        console.error = jest.fn()

        expect.assertions(1)
        return am.performanceTracker.trackPageLoad(Promise.reject('someError')).catch(() => {
            expect(console.error).toBeCalledWith('someError')
        })
    })
})
