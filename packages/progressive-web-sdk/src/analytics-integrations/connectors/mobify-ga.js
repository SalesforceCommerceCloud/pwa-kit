/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/** @module progressive-web-sdk/dist/analytics-integrations/connectors/mobify-ga
 * @private
 **/
import {GoogleAnalyticsConnector} from './google-analytics'
import {PAGEVIEW, ADDTOCART, REMOVEFROMCART} from '../types'

/**
 * A Connector for Mobify's Google Analytics.
 *
 * @implements {module:progressive-web-sdk/dist/analytics-integrations/interface.AnalyticsConnector}
 * @extends {module:progressive-web-sdk/dist/analytics-integrations/connectors/google-tag-manager.GoogleAnalyticsConnector}
 */
export class MobifyGoogleAnalyticsConnector extends GoogleAnalyticsConnector {
    /**
     * @constructor
     *
     * @param {Object} options
     * @param {Object} options Mobify Google Analytics options.
     * @param {String} options.trackerName (default: 'mobifyTracker') Mobify Google Analytics Tracker name.GoogleAnalyticsConnector.GoogleAnalyticsConnector.GoogleAnalyticsConnector.
     * @param {String} options.trackerId (required) Mobify Google Analytics Tracker id.
     * @param {String} options.ecommerceLibrary The name of the Google Analytics ecommerce library to load.
     */
    constructor({trackerName = 'mobifyTracker', trackerId, ecommerceLibrary}) {
        super({trackerName, trackerId, ecommerceLibrary})
    }

    load() {
        return super.load().then(() => {
            this.tracker.set(`dimension1`, `1`)
            return Promise.resolve()
        })
    }

    track(type, data) {
        switch (type) {
            case PAGEVIEW:
                data = this.trackPageview(data)
                break
            case ADDTOCART:
                data = this.trackCart(type, data)
                break
            case REMOVEFROMCART:
                data = this.trackCart(type, data)
                break
            default:
                data = super.track(type, data)
                break
        }

        return data
    }

    trackPageview(data) {
        this.tracker.set(`dimension2`, data.templateName)
        return super.trackPageview()
    }

    trackCart(type, data) {
        if (this.ecommerceLibrary === 'ec') {
            const isAdd = type === ADDTOCART
            const addProduct = [`${this.trackerName}.ec:addProduct`, data.product]
            const setAction = isAdd
                ? [`${this.trackerName}.ec:setAction`, 'add']
                : [`${this.trackerName}.ec:setAction`, 'remove']
            const sendEvent = isAdd
                ? ['event', 'UX', 'click', 'add to cart']
                : ['event', 'UX', 'click', 'remove from cart']
            this.ga(...addProduct)
            this.ga(...setAction)
            this.tracker.send(...sendEvent)

            return [addProduct, setAction, sendEvent]
        }

        return null
    }
}
