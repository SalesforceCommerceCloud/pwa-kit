/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Connector from '../connector'
import {EVENT_ACTION, Transaction} from '../../data-objects/'
import {hasUrlDebugFlag} from '../../utils'

let ga

const checkForLoadedGAPlugins = (plugin) => {
    let pluginIsLoaded = false
    /* istanbul ignore else */
    if (ga) {
        ga.getAll().forEach((tracker) => {
            if (tracker.plugins_ && tracker.plugins_.get(plugin)) {
                pluginIsLoaded = true
            }
        })
    }
    return pluginIsLoaded
}

const outputHeader = (name, type) => {
    console.groupCollapsed(...Connector.debugHeading(`${name}`, type))
}

export default class GoogleAnalytics extends Connector {
    constructor(displayName = 'Google Analytics', trackerName, options) {
        super(displayName, options)

        if (!trackerName) {
            throw new Error(`trackerName cannot be undefined`)
        }

        if (!this.options.ecommerceLibrary) {
            throw new Error(
                `options cannot be undefined and must have and "ecommerceLibrary" property defined`
            )
        }

        if (
            !(
                this.options.ecommerceLibrary === 'ec' ||
                this.options.ecommerceLibrary === 'ecommerce'
            )
        ) {
            throw new Error(`"ecommerceLibrary" property must be either "ec" or "ecommerce"`)
        }

        this.trackerName = trackerName

        // Load Google Analytics
        const scriptSrc = 'https://www.google-analytics.com/analytics'
        if (options.gaDebug || hasUrlDebugFlag()) {
            window.ga_debug = {trace: true}
            Connector.loadScript(`${scriptSrc}_debug.js`, this)
        } else {
            Connector.loadScript(`${scriptSrc}.js`, this)
        }
    }

    getActionName(action) {
        return `${this.trackerName}.${action}`
    }

    setSplitTestTracking() {
        ga(this.getActionName('set'), 'customTask', (model) => {
            const {
                clientIDDimension,
                bucketDimension,
                bucketValue
            } = this.options.splitTestTrackingConfig

            if (clientIDDimension) {
                this.setDimension(clientIDDimension, model.get('clientId'))
            }

            if (bucketDimension) {
                this.setDimension(bucketDimension, bucketValue)
            }
        })
    }

    ready(gaReadyCallback) {
        ga = window.ga

        ga(() => {
            this.tracker = ga.getByName(this.trackerName)

            if (!this.tracker) {
                throw new Error(`ready function should be overloaded with ga tracker creation`)
            }

            if (this.options.splitTestTrackingConfig) {
                this.setSplitTestTracking()
            }

            gaReadyCallback && gaReadyCallback()
            super.ready()
        })
    }

    setDimension(index, value) {
        ga(this.getActionName('set'), `dimension${index}`, value)
    }

    // Ecommerce library initialization
    initEcommerceLib() {
        // Ensure the desired plugin is not loaded
        if (this.tracker.plugins_ && this.tracker.plugins_.get(this.options.ecommerceLibrary)) {
            return
        }

        this.ecommerceLibraryInitialized = true

        // Ensure only one of these two libraryies is loaded across all ga trackers
        const isECLoaded = checkForLoadedGAPlugins('ec')
        const isEcommerceLoaded = checkForLoadedGAPlugins('ecommerce')

        if (
            (!isECLoaded && !isEcommerceLoaded) ||
            (isECLoaded && this.options.ecommerceLibrary === 'ec') ||
            (isEcommerceLoaded && this.options.ecommerceLibrary === 'ecommerce')
        ) {
            this.send('Setup', ['require', this.options.ecommerceLibrary])
        } else {
            throw new Error(
                'Attempting to load GA "ec" and "ecommerce" plugin. Please make sure all GA trackers are using either "ec" or "ecommerce" plugin and not both'
            )
        }
    }

    isEC() {
        const isEC = this.options.ecommerceLibrary === 'ec'

        if (isEC && !this.ecommerceLibraryInitialized) {
            this.initEcommerceLib()
        }

        return isEC
    }

    debug(type, ...args) {
        switch (type) {
            case EVENT_ACTION.pageview: {
                outputHeader(this.displayName, type)
                console.log(`GA ID:\t\t\t\t ${this.tracker.get('trackingId')}`)
                console.log(`Location:\t\t\t ${this.tracker.get('location')}`)
                console.log(`Page:\t\t\t\t ${this.tracker.get('page')}`)
                break
            }

            case EVENT_ACTION.purchase: {
                let actionType

                if (
                    (args[0] === 'ec:setAction' && args[1] === 'purchase') ||
                    args[0] === 'ecommerce:addTransaction'
                ) {
                    actionType = 'transaction'
                } else if (args[0] === 'ec:addProduct' || args[0] === 'ecommerce:addItem') {
                    actionType = 'product'
                }

                switch (actionType) {
                    case 'transaction': {
                        outputHeader(this.displayName, type)
                        const data = args[0] === 'ec:setAction' ? args[2] : args[1]
                        console.log(`Transaction ID:\t\t ${data.id}`)
                        console.log(`Revenue:\t\t\t ${data.revenue}`)
                        break
                    }

                    case 'product': {
                        outputHeader(this.displayName, `${type}.product`)
                        console.log(
                            `Product ID:\t\t\t ${
                                args[0] === 'ec:addProduct' ? args[1].id : args[1].sku
                            }`
                        )
                        console.log(`Product Name:\t\t ${args[1].name}`)
                        console.log(`Product Price:\t\t ${args[1].price}`)
                        console.log(`Product Quantity:\t ${args[1].quantity}`)
                        break
                    }
                }
                break
            }
        }

        if (this.debugCallback) {
            this.debugCallback(type, ...args)
        } else {
            console.groupEnd()
        }
    }

    pageviewEvent() {
        ga(this.getActionName('set'), 'page', window.document.location.pathname)
        return ['send', EVENT_ACTION.pageview]
    }

    setCurrencyEvent(payload) {
        return ['set', 'currencyCode', payload.currencyCode]
    }

    ecSetAction(...args) {
        /* istanbul ignore else */
        if (this.isEC()) {
            this.send('setAction', ['ec:setAction', ...args])
        }
    }

    ecAddProduct(product) {
        if (this.isEC() && product) {
            this.send('addProduct', ['ec:addProduct', product])
        }
    }

    ecAddProductAction(action, product) {
        if (this.isEC()) {
            this.ecAddProduct(product)
            this.ecSetAction(action)
        }
    }

    ecAddImpressionAction(product) {
        if (this.isEC()) {
            this.send(EVENT_ACTION.productImpression, ['ec:addImpression', product])
        }
    }

    applePayOptionDisplayedEvent() {
        return [
            'send',
            'event',
            'ecommerce',
            'apple pay payment option displayed',
            {nonInteraction: 1}
        ]
    }

    applePayButtonDisplayedEvent() {
        return ['send', 'event', 'ecommerce', 'apple pay button displayed', {nonInteraction: 1}]
    }

    applePayButtonClickedEvent() {
        return ['send', 'event', 'ecommerce', 'apple pay clicked']
    }

    purchaseEvent(payload) {
        this.initEcommerceLib()

        if (this.isEC()) {
            const purchaseInfo = new Transaction(payload.transaction, payload.products, [
                Transaction.REVENUE
            ])

            purchaseInfo.products.forEach((product) => {
                this.send(EVENT_ACTION.purchase, ['ec:addProduct', product])
            })

            this.send(EVENT_ACTION.purchase, [
                'ec:setAction',
                EVENT_ACTION.purchase,
                purchaseInfo.transaction
            ])

            return ['send', 'event', 'Ecommerce', 'Purchase', {nonInteraction: 1}]
        } else {
            const purchaseInfo = new Transaction(
                payload.transaction,
                payload.products,
                [Transaction.REVENUE],
                [],
                undefined,
                {
                    id: {
                        name: 'sku'
                    }
                }
            )

            purchaseInfo.products.forEach((product) => {
                this.send(EVENT_ACTION.purchase, [
                    'ecommerce:addItem',
                    {
                        id: purchaseInfo.transaction.id,
                        ...product
                    }
                ])
            })

            this.send(EVENT_ACTION.purchase, ['ecommerce:addTransaction', purchaseInfo.transaction])
            return ['ecommerce:send']
        }
    }

    send(type, args) {
        if (args && args.length) {
            ga.apply(ga, [this.getActionName(args[0]), ...args.slice(1)])
            super.send.apply(this, [type, ...args])
        }
    }
}
