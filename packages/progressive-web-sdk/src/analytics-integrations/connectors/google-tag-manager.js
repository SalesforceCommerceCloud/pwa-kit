/* eslint-disable */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * The `google-tag-manager` module contains the GoogleTagManagerConnector class,
 * an implementation of the `AnalyticsConnector` interface, used for connecting 
 * to Google Tag Manager.
 * @module progressive-web-sdk/dist/analytics-integrations/connectors/google-tag-manager
 */
import {PAGEVIEW, PURCHASE} from '../types'
import {loadScript} from '../utils'

// This is a workaround for a jsdoc bug
// please see https://github.com/jsdoc/jsdoc/issues/1718
; ('')
/* eslint-enable */

/**
 * A Connector for the Analytics Provider: Google Tag Manager.
 *
 * @implements {module:progressive-web-sdk/dist/analytics-integrations/interface.AnalyticsConnector}
 */
export class GoogleTagManagerConnector {
    /**
     * @constructor
     *
     * @param {Object} options Google Tag Manager options.
     * @param {String} options.containerId (required) Google Tag Manager Container id.
     */
    constructor({containerId}) {
        if (!containerId) throw new Error(`containerId cannot be undefined`)
        this.containerId = containerId
        this.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`
    }

    /**
     * @inheritDoc
     */
    load() {
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({
            'gtm.start': new Date().getTime(),
            event: 'gtm.js'
        })
        return loadScript(this.src)
    }

    /**
     * @inheritDoc
     */
    track(type, data) {
        switch (type) {
            case PAGEVIEW:
                data = this.transformPageviewData(data)
                break
            case PURCHASE:
                data = this.transformPurchaseData(data)
                break
            default:
                return null
        }

        window.dataLayer.push(data)

        return data
    }

    transformPageviewData(data) {
        return {
            event: 'Pageview',
            ...data
        }
    }

    transformPurchaseData(data) {
        return {
            event: 'Ecommerce',
            ec: {
                purchase: {
                    actionField: data.transaction,
                    products: data.products
                }
            }
        }
    }
}
