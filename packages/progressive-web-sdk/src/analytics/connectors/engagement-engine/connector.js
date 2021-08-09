/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Connector from '../connector'
import {
    EVENT_ACTION,
    Page,
    Transaction,
    ShoppingList,
    Product,
    UIInteraction
} from '../../data-objects/'
import {PLATFORMS} from '../../constants'

const SANDY_ECOMMERCE_CATEGORY = 'ecommerce'
const SANDY_TIMING_CATEGORY = 'timing'

const createSandyPayload = (action, category, dimensions) => ({
    data: {
        action,
        category
    },
    dimensions
})

const createUIInteractionEvent = (payload) => {
    const uiInteraction = new UIInteraction(payload, [], {}, false)

    return createSandyPayload(
        `${uiInteraction.subject}${uiInteraction.action}${uiInteraction.object}`,
        SANDY_TIMING_CATEGORY,
        {
            container_name: uiInteraction.name,
            content: uiInteraction.content
        }
    )
}

const createShoppingListPayload = (action, payload) => {
    const cart = new ShoppingList(payload.cart, [], {}, false)
    const product = payload.product ? new Product(payload.product, [], {}, false) : {}

    return createSandyPayload(action, SANDY_TIMING_CATEGORY, {
        product_name: product.name,
        product_category: product.category,
        product_id: product.id,
        cart_items: cart.count,
        value: cart.subtotal
    })
}

const consoleLogIfExist = (string, value) => {
    if (typeof value !== 'undefined') {
        console.log(`${string}${value}`)
    }
}

export default class EngagementEngine extends Connector {
    constructor(options) {
        super('💍 Engagement Engine', options)

        if (!this.options.projectSlug) {
            throw new Error(
                `options cannot be undefined and must have "projectSlug" property defined`
            )
        }

        // We are leveraging off the sandy tracking pixel client loaded by loader.js in project
        if (window.sandy) {
            this.ready()
        } else {
            console.error('Sandy instance does not exist')
        }
    }

    ready() {
        // Initialize Sandy
        this.sandy = window.sandy.instance
        this.sandy.create(this.options.projectSlug, 'auto')

        // Get default tracker
        this.tracker = this.sandy.trackers[this.sandy.DEFAULT_TRACKER_NAME]

        this.tracker.set('mobify_adapted', true)
        if (!this.tracker.dimensions.platform) {
            // Only set the platform to PWA if it hasn't been set to something already
            this.tracker.set('platform', PLATFORMS.PWA)
        }

        // Initial page dimension setup
        this.tracker.set({
            page: this.sandy._global.location.pathname,
            title: this.sandy._global.document.title,
            location: this.sandy._global.location.href,
            referrer: this.sandy._global.document.referrer
        })

        super.ready()
    }

    debug(eventType, payload) {
        const type = payload.data.action
        const data = payload.dimensions

        console.groupCollapsed(...Connector.debugHeading(`${this.displayName}`, type))

        switch (eventType) {
            case EVENT_ACTION.pageview:
                console.log(`Project ID:\t\t\t ${this.tracker.slug}`)
                console.log(`Url:\t\t\t\t ${this.tracker.get('location')}`)
                console.log(`Path:\t\t\t\t ${this.tracker.get('page')}`)
                console.log(`Template Name:\t\t ${this.tracker.get('templateName')}`)
                console.log(`Page Title:\t\t\t ${this.tracker.get('title')}`)
                console.log(`Status:\t\t\t ${this.tracker.get('status')}`)
                break
            case `${EVENT_ACTION.purchase}.product`:
                console.log(`Transaction ID:\t\t ${data.transaction_id}`)
                console.log(`Product ID:\t\t\t ${data.product_id}`)
                console.log(`Product Name:\t\t ${data.name}`)
                console.log(`Product Price:\t\t ${data.price}`)
                console.log(`Product Quantity:\t ${data.quantity}`)
                break
            case EVENT_ACTION.addToCart:
            case EVENT_ACTION.removeFromCart:
                console.log(`Cart Count:\t\t ${data.cart_items}`)
                console.log(`Subtotal:\t\t ${data.value}`)
                break
            case EVENT_ACTION.addToWishlist:
            case EVENT_ACTION.removeFromWishlist:
                console.log(`Wishlist Count:\t\t ${data.cart_items}`)
                break
            case EVENT_ACTION.purchase:
                console.log(`Transaction ID:\t\t ${data.transaction_id}`)
                console.log(`Revenue:\t\t\t ${data.revenue}`)
                break
            case EVENT_ACTION.uiInteraction:
                console.log(`Name:\t\t\t\t ${data.container_name}`)
                consoleLogIfExist('Content:\t\t\t', data.content)
                break
            case EVENT_ACTION.search:
                console.log(`Content:\t\t\t ${data.content}`)
                break
            case EVENT_ACTION.performance:
                consoleLogIfExist('Page Start:\t\t\t\t', data.page_start)
                consoleLogIfExist('Mobify Start:\t\t\t', data.mobify_start)
                consoleLogIfExist('First Paint:\t\t\t', data.first_paint)
                consoleLogIfExist('First Contentful Paint:\t', data.first_contentful_paint)
                consoleLogIfExist('App Start:\t\t\t\t', data.app_start)
                consoleLogIfExist('Page Paint:\t\t\t\t', data.page_paint)
                consoleLogIfExist('Page Contentful Paint:\t', data.page_contentful_paint)
                consoleLogIfExist('Page Content Load:\t\t', data.page_content_load)
                consoleLogIfExist('Full Page Load:\t\t\t', data.full_page_load)
                consoleLogIfExist('Time to Interactive:\t', data.time_to_interactive)
                consoleLogIfExist('Is saved page:\t\t\t', data.is_saved_page)
                break
            case EVENT_ACTION.offlineModeUsed:
                consoleLogIfExist('Offline session duration:\t', data.value)
                consoleLogIfExist('Failed Pages:\t\t\t\t', data.offlinePageFailed)
                consoleLogIfExist('Viewed Pages:\t\t\t\t', data.offlinePageSuccess)
                break
            default:
                console.log(`Add relevant debugging information with regards to ${type} event`)
                break
        }
        console.groupEnd()
    }

    performanceEvent(payload) {
        let metrics = {
            bundle: payload.bundle,
            timing_start: payload.timingStart,
            page_contentful_paint: payload.templateDidMount,
            page_content_load: payload.templateAPIEnd,
            full_page_load: payload.fullPageLoad,
            is_saved_page: payload.isSavedPage
        }

        if (payload.mobifyStart) {
            metrics = {
                page_start: payload.pageStart,
                mobify_start: payload.mobifyStart,
                first_paint: payload.firstPaint,
                first_contentful_paint: payload.firstContentfulPaint,
                app_start: payload.appStart,
                page_paint: payload.templateWillMount,
                time_to_interactive: payload.timeToInteractive,
                ...metrics
            }
        }

        this.send(
            EVENT_ACTION.performance,
            createSandyPayload(EVENT_ACTION.performance, SANDY_TIMING_CATEGORY, metrics)
        )
    }

    setCurrencyEvent(payload) {
        this.tracker.set('currency_code', payload.currencyCode)
    }

    setPageTemplateNameEvent(payload) {
        const page = new Page(payload, [Page.TEMPLATENAME])
        this.tracker.set(page)
    }

    // eslint-disable-next-line no-unused-vars
    pageviewEvent(payload, state) {
        const page = new Page(
            payload,
            [Page.TEMPLATENAME],
            {
                path: {
                    name: 'page',
                    defaultValue: this.sandy._global.location.pathname
                },
                title: {
                    defaultValue: this.sandy._global.document.title
                },
                location: {
                    defaultValue: this.sandy._global.location.href
                }
            },
            false
        )

        this.tracker.set(page)

        return createSandyPayload(
            EVENT_ACTION.pageview,
            SANDY_TIMING_CATEGORY,
            payload.status ? {status: payload.status} : {}
        )
    }

    searchEvent(payload) {
        return createSandyPayload(EVENT_ACTION.search, SANDY_TIMING_CATEGORY, {
            content: payload.query
        })
    }

    addToCartEvent(payload) {
        return createShoppingListPayload(EVENT_ACTION.addToCart, payload)
    }

    removeFromCartEvent(payload) {
        return createShoppingListPayload(EVENT_ACTION.removeFromCart, payload)
    }

    addToWishlistEvent(payload) {
        return createShoppingListPayload(EVENT_ACTION.addToWishlist, payload)
    }

    removeFromWishlistEvent(payload) {
        return createShoppingListPayload(EVENT_ACTION.removeFromWishlist, payload)
    }

    launchedFromHomeScreenEvent(payload) {
        this.tracker.set('platform', PLATFORMS.PWA_STANDALONE)
        return createUIInteractionEvent(payload)
    }

    applePayOptionDisplayedEvent() {
        return createSandyPayload(
            'apple pay payment option displayed',
            SANDY_ECOMMERCE_CATEGORY,
            {}
        )
    }

    applePayButtonDisplayedEvent() {
        return createSandyPayload('apple pay button displayed', SANDY_ECOMMERCE_CATEGORY, {})
    }

    applePayButtonClickedEvent() {
        return createSandyPayload('apple pay clicked', SANDY_ECOMMERCE_CATEGORY, {})
    }

    offlineModeUsedEvent(payload) {
        const {offlinePageSuccess, offlinePageFailed, durationOfOffline} = payload
        return createSandyPayload(EVENT_ACTION.offlineModeUsed, SANDY_TIMING_CATEGORY, {
            page_success: offlinePageSuccess,
            page_failed: offlinePageFailed,
            value: durationOfOffline
        })
    }

    purchaseEvent(payload) {
        const purchaseInfo = new Transaction(
            payload.transaction,
            payload.products,
            [Transaction.REVENUE],
            [Product.PRICE, Product.QUANTITY],
            {
                id: {
                    name: 'transaction_id'
                }
            },
            {
                id: {
                    name: 'product_id'
                }
            },
            false
        )

        purchaseInfo.products.forEach((product) => {
            const eventType = `${EVENT_ACTION.purchase}.product`
            this.send(
                eventType,
                createSandyPayload(eventType, SANDY_ECOMMERCE_CATEGORY, {
                    transaction_id: purchaseInfo.transaction.transaction_id,
                    ...product
                })
            )
        })

        return createSandyPayload(
            EVENT_ACTION.purchase,
            SANDY_ECOMMERCE_CATEGORY,
            purchaseInfo.transaction
        )
    }

    uiInteractionEvent(payload) {
        return createUIInteractionEvent(payload)
    }

    send(type, payload) {
        if (this.options.debug) {
            payload.channel = 'test'
        }

        this.tracker.sendEvent(payload)
        super.send(type, payload)
    }
}
