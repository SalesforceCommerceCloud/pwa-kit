/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * The `analytics-manager` module contains the `AnalyticsManager` class, the
 * main entry point to Mobify's analytics framework. You can use it to send
 * analytics data to several analytics connectors at the same time.
 * @module progressive-web-sdk/dist/analytics-integrations/analytics-manager
 */

import {DOMTracker} from './dom-tracker'
import {PerformanceTracker} from './performance-tracker'
import {
    PAGEVIEW,
    OFFLINE,
    UIINTERACTION,
    PERFORMANCE,
    ADDTOCART,
    REMOVEFROMCART,
    ADDTOWISHLIST,
    REMOVEFROMWISHLIST,
    PURCHASE,
    PRODUCTIMPRESSION,
    APPLEPAYOPTIONDISPLAYED,
    APPLEPAYBUTTONDISPLAYED,
    APPLEPAYBUTTONCLICKED,
    performance,
    uiInteraction,
    offline,
    page,
    purchase,
    shoppingList,
    product,
    validate,
    error,
    ERROR,
    LOCALE,
    locale
} from './types'

/* istanbul ignore next */
const ENV = process.env.NODE_ENV || 'development'

/**
 * This is a composite class. When you call `track('event', {payload})` on
 * the AnalyticsManager, it will call the `track()` method on every configured
 * Connector, in turn.
 *
 * @implements {module:progressive-web-sdk/dist/analytics-integrations/interface.AnalyticsConnector}
 */
export class AnalyticsManager {
    /**
     * @constructor
     *
     * @param {Object} options Analytics Manager options
     * @param {Array<module:progressive-web-sdk/dist/analytics-integrations/interface.AnalyticsConnector>} options.connectors
     *     An array of Connectors to register with the Analytics Manager. These must
     *     implement the AnalyticsConnector interface.
     * @param {Boolean} options.debug debug mode flag. `true` will turn the logger on.
     */
    constructor({connectors = [], debug = false} = {}) {
        if (connectors.length <= 0) throw new Error(`At least one connector is required`)
        this.debug = debug
        this.connectors = connectors
        this.performanceTracker = new PerformanceTracker(this)
        this.domTracker = new DOMTracker(this)
        this.queue = []
        this.loaded = false
        this.load()
            .then(() => {
                this.loaded = true
                this.drainQueue()
            })
            .catch((e) => console.error(e))
    }

    /**
     * @inheritDoc
     */
    load() {
        return Promise.all(this.connectors.map((connector) => connector.load())).catch(() => {
            return Promise.reject('Error loading analytics')
        })
    }

    /**
     * Validate and transform the analytics event and send it to its analytics connectors.
     * @inheritDoc
     */
    track(type, data) {
        if (!type) {
            throw new Error('Please specify Analytics type to track.')
        }

        /* istanbul ignore else */
        if (ENV !== 'production') {
            switch (type) {
                case PAGEVIEW:
                    data = validate(page, data)
                    break
                case OFFLINE:
                    data = validate(offline, data)
                    break
                case UIINTERACTION:
                    data = validate(uiInteraction, data)
                    break
                case PERFORMANCE:
                    data = validate(performance, data)
                    break
                case ADDTOCART:
                case REMOVEFROMCART:
                case ADDTOWISHLIST:
                case REMOVEFROMWISHLIST:
                    data = validate(shoppingList, data)
                    break
                case PURCHASE:
                    data = validate(purchase, data)
                    break
                case PRODUCTIMPRESSION:
                    data = validate(product, data)
                    break
                case ERROR:
                    data = validate(error, data)
                    break
                case APPLEPAYOPTIONDISPLAYED:
                case APPLEPAYBUTTONDISPLAYED:
                case APPLEPAYBUTTONCLICKED:
                    // these events do not require any further data.
                    break
                case LOCALE:
                    data = validate(locale, data)
                    break
                default:
                    break
            }
        }

        this.queue.push({type, data})

        if (!window.navigator.onLine || !this.loaded) {
            console.info(`Event '${type}' is pushed to queue`)
            return
        }

        this.drainQueue()

        return data
    }

    /**
     * @private
     */
    drainQueue() {
        while (this.queue.length) {
            const {type, data} = this.queue.shift()
            this.connectors.forEach((connector) => {
                const trackedData = connector.track(type, data)
                if (this.debug && trackedData) this.log(connector, type, trackedData)
            })
        }
    }

    /**
     * Log an analytics event to console.
     *
     * @param {String} connector The connector for an analytics provider.
     * @param {String<progressive-web-sdk/dist/analytics-integrations/types>} type Analytics event type.
     * @param {Object} data The data sent for tracking for the analytics event.
     *
     * @private
     */
    log(connector, type, data) {
        console.groupCollapsed(
            '%c%s%c sends a %c%s%c event',
            'color: #006EFF; font-size: 13px; line-height:30px;',
            connector.constructor.name,
            'color: inherit',
            'color: #FF566A; font-size: 13px',
            type,
            'color: inherit'
        )
        console.log(data)
        console.groupEnd()
    }

    /**
     * Record performance metrics from initializing a page.
     *
     * @param {Promise} initPagePromise The promise that initializes a page.
     * @returns {Promise} The response from an initialized page.
     */
    trackPageLoad(initPagePromise) {
        return this.performanceTracker.trackPageLoad(initPagePromise)
    }
}
