/* eslint-disable */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * The `google-analytics` module contains the `GoogleAnalyticsConnector` class,
 * an implementation of the `AnalyticsConnector` interface, used for connecting 
 * to Google Analytics.
 * @module progressive-web-sdk/dist/analytics-integrations/connectors/google-analytics
 */
import {
    PAGEVIEW,
    PRODUCTIMPRESSION,
    PURCHASE,
    APPLEPAYOPTIONDISPLAYED,
    APPLEPAYBUTTONDISPLAYED,
    APPLEPAYBUTTONCLICKED,
    renameKey
} from '../types'
import {loadScript} from '../utils'

// This is a workaround for jsdoc bug
// please see https://github.com/jsdoc/jsdoc/issues/1718
; ('')
/* eslint-enable */

/**
 * @implements {module:progressive-web-sdk/dist/analytics-integrations/interface.AnalyticsConnector}
 */
export class GoogleAnalyticsConnector {
    /**
     * @constructor
     *
     * @param {Object} options Google Analytics options.
     * @param {String} options.trackerName (required) Google Analytics Tracker name.
     * @param {String} options.trackerId (required) Google Analytics Tracker id.
     * @param {Object} options.splitTestConfig configuration values required to set up split test: `clientIdDimension, bucketDimension, bucketValue`.
     * @param {String} options.ecommerceLibrary The name of the Google Analytics ecommerce library to load.
     * @param {Boolean} options.gaDebug (default: false) GA debug flag. `true` will load the ga library that enables debugging.
     */
    constructor({trackerName, trackerId, ecommerceLibrary, splitTestConfig, gaDebug = false}) {
        if (!trackerId) throw new Error('trackerId must be defined')
        if (!trackerName) throw new Error('trackerName must be defined')
        if (ecommerceLibrary && ecommerceLibrary !== 'ec' && ecommerceLibrary !== 'ecommerce')
            throw new Error(`ecommerceLibrary must be defined and either 'ec' or 'ecommerce'`)
        this.trackerName = trackerName
        this.trackerId = trackerId
        this.ecommerceLibrary = ecommerceLibrary || null
        this.gaDebug = gaDebug
        this.splitTestConfig = splitTestConfig || null
        this.ga = null
        this.src = `https://www.google-analytics.com/analytics${this.gaDebug ? '_debug' : ''}.js`
    }

    /**
     * @inheritDoc
     */
    load() {
        return loadScript(this.src).then(() => {
            const ga = (this.ga = window.ga)
            ga('create', this.trackerId, 'auto', {name: this.trackerName})
            ga(() => {
                this.tracker = ga.getByName(this.trackerName)
                if (!this.tracker) throw new Error('Could not create Google Analytics tracker')
                if (this.splitTestConfig) this.setupSplitTest()
                if (this.ecommerceLibrary) this.loadEcommerceLibrary()
                return Promise.resolve()
            })
        })
    }

    /**
     * Spit test set up.
     * @returns {undefined}
     */
    setupSplitTest() {
        const ga = this.ga
        const {clientIdDimension, bucketDimension, bucketValue} = this.splitTestConfig

        if (!clientIdDimension || !bucketDimension || !bucketValue) {
            throw new Error('Missing configuration values needed to set up split test')
        }

        ga(`${this.trackerName}.set`, 'customTask', (model) => {
            ga(`${this.trackerName}.set`, `dimension${clientIdDimension}`, model.get('clientId'))

            ga(`${this.trackerName}.set`, `dimension${bucketDimension}`, bucketValue)
            console.log(`Split test was successfully setup`)
        })
    }

    /**
     * Ecommerce library initialization.
     * @returns {undefined}
     **/
    loadEcommerceLibrary() {
        const ga = this.ga
        const ecommerceLibrary = this.ecommerceLibrary

        // return an ecommerce library is already loaded.
        if (
            this.tracker.plugins_ &&
            (this.tracker.plugins_.get('ec') || this.tracker.plugins_.get('ecommerce'))
        )
            return

        ga(`${this.trackerName}.require`, ecommerceLibrary)

        if (!this.tracker.plugins_ || !this.tracker.plugins_.get(ecommerceLibrary))
            throw new Error(`${ecommerceLibrary} library could not be loaded`)
    }

    /**
     * @inheritDoc
     */
    track(type, data) {
        switch (type) {
            case PAGEVIEW:
                data = this.trackPageview()
                break
            case PRODUCTIMPRESSION:
                data = this.trackProductImpression(data)
                break
            case PURCHASE:
                data = this.trackPurchase(data)
                break
            case APPLEPAYOPTIONDISPLAYED:
                data = this.trackApplePayOptionDisplayed()
                break
            case APPLEPAYBUTTONDISPLAYED:
                data = this.trackApplePayButtonDisplayed()
                break
            case APPLEPAYBUTTONCLICKED:
                data = this.trackApplePayButtonClicked()
                break
            default:
                return null
        }

        return data
    }

    trackPageview() {
        this.tracker.set('page', window.document.location.pathname)
        this.tracker.send('pageview')
        return window.document.location.pathname
    }

    trackPurchase(data) {
        const dataSent = []

        let productData
        let transactionData
        let actionData

        data.products.forEach((product) => {
            /* istanbul ignore else */
            if (this.ecommerceLibrary === 'ec') {
                productData = [`${this.trackerName}.ec:addProduct`, product]
            } else if (this.ecommerceLibrary === 'ecommerce') {
                renameKey(product, 'id', 'sku')
                productData = [
                    `${this.trackerName}.ecommerce:addItem`,
                    {id: data.transaction.id, ...product}
                ]
            }

            this.ga(...productData)
            dataSent.push(productData)
        })

        /* istanbul ignore else */
        if (this.ecommerceLibrary === 'ec') {
            transactionData = [`${this.trackerName}.ec:setAction`, 'purchase', data.transaction]
            actionData = [
                `${this.trackerName}.send`,
                'event',
                'Ecommerce',
                'Purchase',
                {nonInteraction: 1}
            ]
        } else if (this.ecommerceLibrary === 'ecommerce') {
            transactionData = [`${this.trackerName}.ecommerce:addTransaction`, data.transaction]
            actionData = [`${this.trackerName}.ecommerce:send`]
        }

        this.ga(...transactionData)
        this.ga(...actionData)
        dataSent.push(transactionData, actionData)

        return dataSent
    }

    trackProductImpression(data) {
        if (this.ecommerceLibrary === 'ec') {
            const productImpressionData = [`${this.trackerName}.ec:addImpression`, data]
            this.ga(...productImpressionData)
            return productImpressionData
        }

        return null
    }

    trackApplePayOptionDisplayed() {
        const data = [
            'event',
            'ecommerce',
            'apple pay payment option displayed',
            {nonInteraction: 1}
        ]

        this.tracker.send(...data)
        return data
    }

    trackApplePayButtonDisplayed() {
        const data = ['event', 'ecommerce', 'apple pay button displayed', {nonInteraction: 1}]

        this.tracker.send(...data)
        return data
    }

    trackApplePayButtonClicked() {
        const data = ['event', 'ecommerce', 'apple pay clicked']

        this.tracker.send(...data)
        return data
    }
}
