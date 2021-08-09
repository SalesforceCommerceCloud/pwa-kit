/* eslint-disable */

/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * The `engagement-engine` module contains the `EngagementEngineConnector` class,
 * an implementation of the `AnalyticsConnector` interface, used for connecting
 * to Mobify's Engagement Engine provider.
 * @module progressive-web-sdk/dist/analytics-integrations/connectors/engagement-engine
 */
import {
    PAGEVIEW,
    OFFLINE,
    UIINTERACTION,
    PERFORMANCE,
    PURCHASE,
    ADDTOCART,
    REMOVEFROMCART,
    ADDTOWISHLIST,
    REMOVEFROMWISHLIST,
    renameKey,
    APPLEPAYOPTIONDISPLAYED,
    APPLEPAYBUTTONDISPLAYED,
    APPLEPAYBUTTONCLICKED,
    ERROR,
    LOCALE
} from '../types'

// This is a workaround for jsdoc bug, please see https://github.com/jsdoc/jsdoc/issues/1718
; ('')
/* eslint-enable */

/**
 * An analytics Connector for Mobify's analytics backend, the Engagement Engine.
 *
 * @implements {module:progressive-web-sdk/dist/analytics-integrations/interface.AnalyticsConnector}
 */
export class EngagementEngineConnector {
    /**
     * @constructor
     *
     * @param {Object} options Engagement Engine options.
     * @param {String} options.projectSlug (required) The project slug.
     */
    constructor({projectSlug}) {
        if (!projectSlug) throw new Error(`options.projectSlug must be defined`)
        this.projectSlug = projectSlug
    }

    /**
     * @inheritDoc
     */
    load() {
        return import('sandy-tracking-pixel-client').then((Sandy) => {
            Sandy.init(window)
            Sandy.create(this.projectSlug, 'auto') // eslint-disable-line no-undef

            // The act of running Sandy.init() blows away the binding of
            // window.sandy.instance in the pixel client. We are restoring it
            // here for now and will revisit this when we rewrite the Sandy
            // tracking pixel client
            window.sandy.instance = Sandy

            this.sandy = window.sandy.instance
            this.tracker = Sandy.default.trackers[Sandy.DEFAULT_TRACKER_NAME]
            this.tracker.set('mobify_adapted', 'true')
            this.tracker.set('referrer', Sandy._global.document.referrer)
            this.tracker.set('platform', 'PWA')

            return Promise.resolve()
        })
    }

    /**
     * @inheritDoc
     */
    track(type, data) {
        this.tracker.set({
            page: this.sandy._global.location.pathname,
            title: this.sandy._global.document.title,
            location: this.sandy._global.location.href,
            referrer: this.sandy._global.document.referrer
        })
        switch (type) {
            case PAGEVIEW:
                data = this.transformPageviewData(data)
                break
            case PERFORMANCE:
                data = this.transformPerformanceData(data)
                break
            case UIINTERACTION:
                data = this.transformUIInteractionData(data)
                break
            case OFFLINE:
                data = this.transformOfflineData(data)
                break
            case PURCHASE:
                data = this.trackPurchaseData(data)
                return data
            case ADDTOCART:
            case REMOVEFROMCART:
            case ADDTOWISHLIST:
            case REMOVEFROMWISHLIST:
                data = this.transformShoppingListData(type, data)
                break
            case APPLEPAYOPTIONDISPLAYED:
            case APPLEPAYBUTTONDISPLAYED:
            case APPLEPAYBUTTONCLICKED:
                data = this.transformApplePayAction(type)
                break
            case ERROR:
                data = this.transformAppError(data)
                break
            case LOCALE:
                this.tracker.set('site_locale', data.locale)
                return null // site locale is set on the tracker, but nothing sent to EE.
            default:
                return null
        }

        if (data) this.tracker.sendEvent(data)
        return data
    }

    transformPageviewData(data) {
        return {
            data: {
                action: PAGEVIEW,
                category: 'pageview'
            },
            dimensions: {
                templateName: data.templateName
            }
        }
    }

    transformPerformanceData(metrics) {
        return {
            data: {
                action: PERFORMANCE,
                category: 'timing'
            },
            dimensions: metrics
        }
    }

    transformUIInteractionData(data) {
        const {subject, action, object, name, content} = data
        return {
            data: {
                action: `${subject}${action}${object}`,
                category: 'timing'
            },
            dimensions: {
                container_name: name,
                content: content
            }
        }
    }

    transformOfflineData(data) {
        if (!data.startTime) return null
        return {
            data: {
                action: OFFLINE,
                category: 'timing'
            },
            dimensions: {
                value: data.startTime
            }
        }
    }

    trackPurchaseData(data) {
        let dataSent = []

        renameKey(data.transaction, 'id', 'transaction_id')

        data.products.forEach((product) => {
            renameKey(product, 'id', 'product_id')

            const productData = {
                data: {
                    action: 'purchase.product',
                    category: 'ecommerce'
                },
                dimensions: {
                    transaction_id: data.transaction.transaction_id,
                    ...product
                }
            }
            dataSent.push(productData)
            this.tracker.sendEvent(productData)
        })

        const transactionData = {
            data: {
                action: 'purchase',
                category: 'ecommerce'
            },
            dimensions: data.transaction
        }

        dataSent.push(transactionData)
        this.tracker.sendEvent(transactionData)

        return dataSent
    }

    transformShoppingListData(type, data) {
        const {id, name, category} = data.product
        const {count, subtotal} = data
        return {
            data: {
                action: type,
                category: 'timing'
            },
            dimensions: {
                product_id: id,
                product_name: name,
                product_category: category,
                cart_items: count,
                value: subtotal
            }
        }
    }

    transformApplePayAction(type) {
        const applePayAction = {
            [APPLEPAYOPTIONDISPLAYED]: 'apple pay payment option displayed',
            [APPLEPAYBUTTONDISPLAYED]: 'apple pay button displayed',
            [APPLEPAYBUTTONCLICKED]: 'apple pay clicked'
        }

        const action = applePayAction[type]

        if (!action) throw new Error('Apple pay action not supported')

        return {
            data: {
                action,
                category: 'ecommerce'
            },
            dimensions: {}
        }
    }

    transformAppError(data) {
        const {name, content} = data
        return {
            data: {
                action: `appRecieveError`,
                category: 'timing'
            },
            dimensions: {
                container_name: name,
                content: content
            }
        }
    }
}
