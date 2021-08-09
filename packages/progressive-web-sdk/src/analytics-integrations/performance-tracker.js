/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import ttiPolyfill from 'tti-polyfill'
import {PERFORMANCE} from './types'

/**
 * A tracker registered with the Analytics Manager to track Performance Metrics.
 *
 * @private
 */
export class PerformanceTracker {
    /**
     * @constructor
     *
     * @param {module:analytics-manager.AnalyticsManager} analytics The Analytics Manager.
     */
    constructor(analytics) {
        this.analytics = analytics
        this.firstLoad = true

        const mainScript = document.querySelectorAll('#progressive-web-main')[0].src
        this.bundle = mainScript.indexOf('production') !== -1 ? 'production' : 'development'
    }

    /**
     * Get the current time using the Performance Timing API {@link https://developer.mozilla.org/en-US/docs/Web/API/Performance/timing}
     * If not available, use the Date time.
     *
     * @returns {Number}
     */
    getPerformanceTime() {
        if (window.performance && window.performance.timing) {
            return window.performance.timing.navigationStart + window.performance.now()
        }

        return Date.now()
    }

    /**
     * Record performance metrics from initializing a page.
     * Send these metrics to the Analytics Manager.
     *
     * @param {Promise} initPagePromise The promise that initializes a page.
     * @returns {Promise} The response from an initialized page.
     */
    trackPageLoad(initPagePromise) {
        const {
            timingStart,
            pageStart,
            mobifyStart,
            appStart,
            firstPaint,
            firstContentfulPaint
        } = window.Progressive.PerformanceTiming

        // Record the time it takes to load the page by taking the time before and after initPagePromise.
        // The end time does not include the time it takes to load all the assets that might be loaded after the DOM content is loaded.
        // These times coincide with values from the performance.timing API for a first page load
        // (namely, domContentLoadedEventStart and domContentLoadedEventEnd).
        const domContentLoadedTime = {
            start: this.getPerformanceTime(),
            end: null
        }

        let result
        return initPagePromise
            .then((res) => {
                result = res
                domContentLoadedTime.end = this.getPerformanceTime()

                return this.firstLoad
                    ? ttiPolyfill.getFirstConsistentlyInteractive()
                    : Promise.resolve(null)
            })
            .then((tti) => {
                const metrics = {
                    bundle: this.bundle,
                    page_start: pageStart,
                    timing_start: timingStart,
                    mobify_start: mobifyStart,
                    app_start: appStart,
                    full_page_load: domContentLoadedTime.end - domContentLoadedTime.start,
                    first_paint: firstPaint,
                    first_contentful_paint: firstContentfulPaint,
                    time_to_interactive: tti,
                    is_first_load: this.firstLoad
                }

                this.firstLoad = false

                this.analytics.track(PERFORMANCE, metrics)
                return Promise.resolve(result)
            })
            .catch((error) => {
                console.error(error)
                return Promise.reject(error)
            })
    }
}
