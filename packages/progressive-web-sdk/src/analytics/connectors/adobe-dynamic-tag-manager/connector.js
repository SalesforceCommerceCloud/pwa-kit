/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Connector from '../connector'

const DTMEvents = {
    ADD_TO_CART: 'scAdd',
    CHECKOUT: 'scCheckout',
    PAGE_VIEW: 'pageView',
    PURCHASE: 'purchase',
    REMOVE_FROM_CART: 'scRemove',
    SHOW_CART: 'scView'
}

const SEMICOLON_REPLACEMENT = ' '

export default class AdobeDynamicTagManager extends Connector {
    constructor(displayName = 'Adobe Dynamic Tag Manager', satelliteLibUrl, suiteId, options) {
        if (!satelliteLibUrl) {
            throw new Error(`satelliteLibUrl cannot be undefined`)
        }
        if (!suiteId) {
            throw new Error(`suiteId cannot be undefined`)
        }

        super(displayName, options)

        this.suiteId = suiteId

        // Load Adobe Dynamic Tag Manager
        Connector.loadScript(satelliteLibUrl, this)
    }

    debug(type, payload) {
        console.groupCollapsed(...Connector.debugHeading(`${this.displayName}`, type))
        console.log(`DataLayer ${payload}`)
        console.groupEnd()
    }

    ready() {
        const {_satellite} = window

        if (!_satellite) {
            return
        }

        // Monkey patch the `onSCodeLoaded` to call `super.ready`
        const sc = _satellite.getToolsByType('sc')[0]

        this.patchSCode(sc)

        // Finalize intitialization of the adobe dtm.
        _satellite.pageBottom()
    }

    patchSCode(sc) {
        if (!sc) {
            throw new Error(`must provide sc object to function`)
        }

        const onSCodeLoadedOld = sc.onSCodeLoaded

        sc.onSCodeLoaded = (...rest) => {
            // Ensure we still call the original function.
            const result = onSCodeLoadedOld.apply(sc, rest)

            // Assign the scode libarary
            this.s = window.s_gi(this.suiteId)

            // We are initialized, so we can continue to empty the queue.
            super.ready()

            return result
        }
    }

    pageviewEvent({templateName}) {
        if (!templateName) {
            throw new Error(`page view template name must be defined`)
        }

        // Clear out page variables before sending event
        this.clear()

        this.s.pageName = templateName

        this.send()
    }

    purchaseEvent({transaction, products = []}) {
        if (!transaction || !products.length) {
            throw new Error(`transaction and products must be defined`)
        }

        const serializedProducts = products.map(({name = '', quantity, price}) => {
            // Sanitize the textual information
            name = name.replace(';', SEMICOLON_REPLACEMENT)

            return `;${name};${quantity};${price * quantity}`
        })

        // Clear out page variables before sending event
        this.clear()

        Object.assign(this.s, {
            events: DTMEvents.PURCHASE,
            purchaseID: transaction.id,
            products: serializedProducts.toString()
        })

        this.send()
    }

    addToCartEvent({product}) {
        if (!product) {
            throw new Error(`product must be defined`)
        }

        let {category = '', title = ''} = product
        const {id, quantity, price} = product

        // Sanitize the textual information
        category = category.replace(';', SEMICOLON_REPLACEMENT)
        title = `${title.replace(';', SEMICOLON_REPLACEMENT)}${id ? `(${id})` : ''}`

        console.warn(`
            The data requirements for the '${DTMEvents.ADD_TO_CART}' event cannot be fully satisfied
            with the data provided. The optional 'category' will be left blank.
        `)

        // Clear out page variables before sending event
        this.clear()

        // 'Category;Product;Quantity;Price'
        Object.assign(this.s, {
            events: DTMEvents.ADD_TO_CART,
            products: `${category};${title};${quantity};${price}`
        })

        this.send()
    }

    removeFromCartEvent({product}) {
        if (!product) {
            throw new Error(`product must be defined`)
        }

        let {category = '', title = ''} = product
        const {id, quantity, price} = product

        // Sanitize the textual information
        category = category.replace(';', SEMICOLON_REPLACEMENT)
        title = `${title.replace(';', SEMICOLON_REPLACEMENT)}${id ? `(${id})` : ''}`

        console.warn(`
            The data requirements for the '${DTMEvents.REMOVE_FROM_CART}' event cannot be fully satisfied
            with the data provided. The optional 'category' will be left blank.
        `)

        // Clear out page variables before sending event
        this.clear()

        Object.assign(this.s, {
            events: DTMEvents.REMOVE_FROM_CART,
            products: `${category};${title};${quantity};${price}`
        })

        this.send()
    }

    clear() {
        const {s} = this

        // Clean out variables for next call.
        s.clearVars()
    }

    send(type, payload) {
        const {s} = this

        // Error out if the app AppMeasurement isn't available.
        if (!s) {
            throw new Error('AppMeasurement must be initialized before sending data.')
        }

        // Send tracking data
        s.t()

        // Call parent send (this will do a console log when in debug mode).
        super.send(type, payload)
    }
}
