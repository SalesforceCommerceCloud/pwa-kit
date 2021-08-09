/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Connector from '../connector'

export default class GoogleTagManager extends Connector {
    constructor(displayName = 'Google Tag Manager', containerId, options) {
        super(displayName, options)

        if (!containerId) {
            throw new Error(`containerId cannot be undefined`)
        }

        window.dataLayer = [
            {
                'gtm.start': new Date().getTime(),
                event: 'gtm.js'
            }
        ]

        // Load Google Analytics
        Connector.loadScript(`https://www.googletagmanager.com/gtm.js?id=${containerId}`, this)
    }

    debug(type, payload) {
        console.groupCollapsed(...Connector.debugHeading(`${this.displayName}`, type))
        console.log(`DataLayer ${payload}`)
        console.groupEnd()
    }

    pageviewEvent(payload) {
        return {
            event: 'Pageview',
            ...payload
        }
    }

    purchaseEvent(payload) {
        return {
            event: 'Ecommerce',
            ec: {
                purchase: {
                    actionField: payload.transaction,
                    products: payload.products
                }
            }
        }
    }

    send(type, payload) {
        window.dataLayer.push(payload)

        super.send(type, payload)
    }
}
