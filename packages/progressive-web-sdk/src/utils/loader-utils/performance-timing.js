/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* global Mobify */
import {loaderLog} from './loader-logging'
import Sandy from 'sandy-tracking-pixel-client'
import {isStandalone} from '../utils'

export const PLATFORMS = {
    UPWA: 'UPWA',
    PWA: 'PWA',
    NON_PWA: 'nonPWA',
    PWA_STANDALONE: 'PWA:standalone'
}

export const getPerformanceTiming = (type, timeDiff = 0, defaultValue) => {
    if (window.performance && performance.timing && performance.timing[type]) {
        return window.performance.timing[type] - timeDiff
    }
    return defaultValue
}

const navigationStart = getPerformanceTiming('navigationStart')
/* istanbul ignore next */
const mobifyStart = window.Mobify && Mobify.points && Mobify.points[0]
const timingStart = navigationStart || mobifyStart

/**
 * Sets peformance timing values on window. Progressive.
 * @function
 */
export const setPerformanceValues = () => {
    window.Progressive = window.Progressive || {}
    window.Progressive.PerformanceTiming = {
        pageStart: navigationStart,
        mobifyStart,
        timingStart
    }
}

/**
 * Sends a performance timing event through the provided sandy tracker
 * @function
 * @param {Object} tracker
 */
export const sendPerformanceEvent = (tracker) => {
    setTimeout(() => {
        if (!window.Progressive || !window.Progressive.PerformanceTiming) {
            // set Performance Values if they haven't been set already
            setPerformanceValues()
        }
        const timings = window.Progressive.PerformanceTiming

        tracker.sendEvent({
            channel: 'web',
            data: {
                action: 'performance',
                category: 'timing'
            },
            dimensions: {
                page_start: timings.pageStart,
                mobify_start: timings.mobifyStart,
                first_paint: timings.firstPaint,
                first_contentful_paint: timings.firstContentfulPaint,
                app_start: timings.appStart,
                timing_start: timings.timingStart,
                full_page_load: getPerformanceTiming(
                    'domContentLoadedEventEnd',
                    timings.timingStart,
                    'null'
                )
            }
        })
    }, 0)
}

/**
 * Track First Paint and First Contentful Paint for PWA and non-PWA
 * @function
 */
export const trackFirstPaints = () => {
    if (window.PerformanceObserver) {
        const paintObserver = new window.PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                const metricName = entry.name
                const timing = Math.round(entry.startTime + entry.duration)
                if (metricName === 'first-paint') {
                    window.Progressive.PerformanceTiming.firstPaint = timing
                } else if (metricName === 'first-contentful-paint') {
                    window.Progressive.PerformanceTiming.firstContentfulPaint = timing
                }
            }
        })
        try {
            paintObserver.observe({entryTypes: ['paint']})
        } catch (e) {
            // If the `entryTypes` doesn't contain any supported entries (e.g. Safari 11)
            // https://w3c.github.io/performance-timeline/#dom-performanceobserver-observe()
            if (e.name !== 'TypeError') {
                throw e
            }
        }
    }
}

export const trackTTI = () => {
    // Track Time to Interaction snippet for tti-ployfill
    // PWA only metric
    // Reference: https://github.com/GoogleChrome/tti-polyfill#usage
    if (window.PerformanceLongTaskTiming) {
        const ttiObserver = (window.__tti = {
            e: []
        })
        ttiObserver.o = new window.PerformanceObserver((list) => {
            ttiObserver.e = ttiObserver.e.concat(list.getEntries())
        })
        ttiObserver.o.observe({entryTypes: ['longtask']})
    }
}

export const triggerNonPWAPerformanceEvent = (tracker) => {
    /* istanbul ignore else */
    if (window.addEventListener) {
        window.addEventListener('load', () => {
            sendPerformanceEvent(tracker)
        })
    } else if (window.attachEvent) {
        // IE DOM
        window.attachEvent('onload', () => {
            sendPerformanceEvent(tracker)
        })
    }
}

/**
 * Determines which PWA the app is running as
 * @function
 * @returns {String} if isStandalone is true returns
 * 'PWA:standalone', otherwise returns 'PWA'
 */
export const getPWAType = () => {
    return isStandalone() ? PLATFORMS.PWA_STANDALONE : PLATFORMS.PWA
}

/**
 * A setTimeout wraps this trigger function in order to control the exact
 * timing that any tracking pixels are downloaded as the app initializes.
 * More specifically, downloading of any tracking pixels should not delay
 * the downloading of any other scripts (i.e. service workers, etc.)
 * @function
 * @param pwaMode {Boolean} true for PWA mode, false for nonPWA mode. This
 * affects the set of dimensions configured on the tracker, and whether
 * an initial timing point is collected (it's done in PWA mode only).
 *
 * @param aJsSlug {String} The A.js slug for the project
 *
 * @param platform {String} The platform dimension to set.
 * This should be: PWA, PWA:standalone, UPWA or nonPWA.
 * If no platform string is provided one will be determined based
 * on the value of pwaMode.
 *
 * @returns {Promise.<*>} resolved when setup is complete and any app
 * start events have been sent.
 */
export const triggerSandyAppStartEvent = (pwaMode, aJsSlug, platform) => {
    /* istanbul ignore else */
    if (!platform) {
        if (pwaMode) {
            platform = getPWAType()
        } else {
            platform = PLATFORMS.NON_PWA
        }
    }

    Sandy.init(window)
    Sandy.create(aJsSlug, 'auto') // eslint-disable-line no-undef

    // The act of running Sandy.init() blows away the binding of
    // window.sandy.instance in the pixel client. We are restoring it
    // here for now and will revisit this when we rewrite the Sandy
    // tracking pixel client
    window.sandy.instance = Sandy
    loaderLog('Sandy initialization done')

    const tracker = Sandy.trackers[Sandy.DEFAULT_TRACKER_NAME]

    tracker.set('mobify_adapted', pwaMode)
    tracker.set('referrer', Sandy._global.document.referrer)
    tracker.set('platform', platform)

    if (window.Progressive.PerformanceTiming.timingStart) {
        const timing = Date.now() - window.Progressive.PerformanceTiming.timingStart
        window.sandy('send', 'timing', 'timing', 'appStart', '', timing)
        window.Progressive.PerformanceTiming.appStart = timing
    }

    if (!pwaMode) {
        triggerNonPWAPerformanceEvent(tracker)
    }

    return Promise.resolve()
}
