/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import GoogleAnalytics from './connector'
import {EVENT_ACTION, Page, Product} from '../../data-objects/'

let ga

const cleanProduct = (product) => {
    return product ? new Product(product, [], {}, false) : undefined
}

export default class MobifyGA extends GoogleAnalytics {
    constructor(options) {
        super('🐯 Mobify Google Analytics', 'mobifyTracker', options)

        if (!this.options.mobifyGAID) {
            throw new Error(
                `options cannot be undefined and must have "mobifyGAID" property defined`
            )
        }
    }

    ready() {
        ga = window.ga

        ga('create', this.options.mobifyGAID, 'auto', {name: this.trackerName})

        super.ready(() => {
            this.setDimension(1, '1')
        })
    }

    debugCallback(type) {
        switch (type) {
            case EVENT_ACTION.pageview: {
                console.log(`Template Name:\t\t ${this.tracker.get('dimension2')}`)
                break
            }
        }

        console.groupEnd()
    }

    pageviewEvent(payload) {
        const page = new Page(payload, [Page.TEMPLATENAME], {}, false)

        this.setDimension(2, page.templateName)

        return super.pageviewEvent(payload)
    }

    addToCartEvent(payload) {
        this.ecAddProductAction('add', cleanProduct(payload.product))

        return ['send', 'event', 'UX', 'click', 'add to cart']
    }

    removeFromCartEvent(payload) {
        this.ecAddProductAction('remove', cleanProduct(payload.product))

        return ['send', 'event', 'UX', 'click', 'remove from cart']
    }
}
