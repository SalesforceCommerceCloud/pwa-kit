/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import ttiPolyfill from 'tti-polyfill'
import {PERFORMANCE} from './types'

const isClientSide = typeof window !== 'undefined'

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
     * @param {Object} opts - injectable dependencies, for easier testing.
     */
    constructor(analytics, opts = {}) {
        this.analytics = analytics
        this.firstLoad = true

        /* istanbul ignore else */
        const browserPerfAPI = isClientSide ? window.performance : undefined
        this.performance = opts.hasOwnProperty('performance') ? opts.performance : browserPerfAPI

        this.navigationStart =
            opts.navigationStart || ((this.performance || {}).timing || {}).navigationStart
        this.appStart = opts.appStart || ((this.performance || {}).now && this.performance.now())
        /* istanbul ignore next */
        this.bundle = opts.bundle || process.env.NODE_ENV || 'development'
        this.ttiPolyfill = opts.ttiPolyfill || ttiPolyfill
    }

    /**
     * Track performance metrics for page loads.
     *
     * If the window.performance API is unavailable, this does nothing.
     *
     * @param {Object} pageLoad
     * @param {Number} pageLoad.start
     * @param {Number} pageLoad.end
     * @returns {Promise}
     */
    trackPageLoad(pageLoad) {
        if (!this.performance) {
            return Promise.resolve()
        } else {
            return Promise.resolve()
                .then(() => {
                    return this.firstLoad
                        ? this.ttiPolyfill.getFirstConsistentlyInteractive()
                        : null
                })
                .then((tti) => {
                    /* istanbul ignore next */
                    const fp = this.performance.getEntriesByName('first-paint')[0] || null
                    /* istanbul ignore next */
                    const fcp =
                        this.performance.getEntriesByName('first-contentful-paint')[0] || null
                    const data = {
                        bundle: this.bundle,
                        timing_start: this.navigationStart,
                        app_start: this.appStart,
                        full_page_load: pageLoad.end - pageLoad.start,
                        first_paint: fp,
                        first_contentful_paint: fcp,
                        time_to_interactive: tti,
                        is_first_load: this.firstLoad
                    }

                    this.firstLoad = false
                    this.analytics.track(PERFORMANCE, data)
                    return data
                })
        }
    }
}
