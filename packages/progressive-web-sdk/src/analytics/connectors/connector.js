/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

class Connector {
    static loadScript(src, connector) {
        const boundOnload = connector.ready.bind(connector)

        const existingScript = document.querySelectorAll(`script[src="${src}"]`)
        if (existingScript.length > 0) {
            console.warn('You are attemping to load the same script more than once.')
            if (existingScript[0].ready) {
                boundOnload()
            } else {
                existingScript[0].loadQueue.push(boundOnload)
            }
            return
        }

        const script = document.createElement('script')

        // Building the onload queue - this is to ensure that race condition doesn't happen
        // This is simpler than binding load event using addEventListener/addEvent(MS)
        script.ready = false
        script.loadQueue = []
        script.loadQueue.push(boundOnload)

        script.onload = () => {
            script.ready = true
            let onloadCallback
            while ((onloadCallback = script.loadQueue.shift())) {
                onloadCallback()
            }
        }
        script.async = 1
        script.src = src

        const firstScript = document.getElementsByTagName('script')[0]
        firstScript.parentNode.insertBefore(script, firstScript)
    }

    static debugHeading(name, type) {
        return [
            '%c%s%c sends a %c%s%c event',
            'color: #006EFF; font-size: 13px; line-height:30px;',
            name,
            'color: inherit',
            'color: #FF566A; font-size: 13px',
            type,
            'color: inherit'
        ]
    }

    constructor(displayName = this.constructor.name, options) {
        this.isReady = false

        this.name = displayName.replace(/[\W\s]*/g, '')
        this.displayName = displayName
        this.restrictedMethods = []

        // Initialize queue
        this.q = []

        this.options = {
            debug: false,
            ...options
        }
    }

    ready() {
        this.isReady = true
        this.receive()
    }

    pageviewEvent() {}

    /**
     * Performance Timings in order
     *
     * pageStart            When user navigates to this page (When the source document gets request to download)
     *                      No support for iOS Safari 10.3, Safari 10.1 - Safaris will have support at version 11
     * mobifyStart          Timing when tag initiates
     * firstPaint /         When first render is detected - Support Chrome 60+
     * firstContentfulPaint When first contentful render is detected - Support Chrome 60+
     * appStart             When loader.js initiates
     * templateWillMount    When view starts to render
     * templateDidMount     When view finishes render
     * templateAPIEnd       When view completes core data fetch
     * timeToInteractive    When there is no long task in execution
     *                      Support for PerformanceObserver Chrome 52.0+
     *
     * Resources:
     * PerformanceTiming    https://developer.mozilla.org/en-US/docs/Web/API/PerformanceTiming/navigationStart
     * Paint Timing API     https://jmperezperez.com/paint-timing-api/
     * PerformanceObserver  https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver
     */
    performanceEvent() {}

    setCurrencyEvent() {}

    addToCartEvent() {}

    removeFromCartEvent() {}

    addToWishlistEvent() {}

    removeFromWishlistEvent() {}

    launchedFromHomeScreenEvent() {}

    uiInteractionEvent() {}

    offlineModeUsedEvent() {}

    purchaseEvent() {}

    send(...args) {
        if (this.options.debug) {
            this.debug(...args)
        }
    }

    debug(type) {
        console.log(...Connector.debugHeading(this.displayName, type))
    }

    _receive(type, metaPayload, state) {
        const methodName = `${type}Event`
        if (this[methodName]) {
            const eventSent = this[methodName](metaPayload, state)
            if (eventSent) {
                this.send(type, eventSent)
            }
        }
    }

    receive(...args) {
        if (this.isReady) {
            // Drain queue
            if (this.q.length) {
                let command
                while ((command = this.q.shift())) {
                    this._receive(...command)
                }
            }

            // Propagate event
            if (args.length) {
                this._receive(...args)
            }
        } else {
            // Push to queue
            console.info(`${this.displayName} is not ready. Event '${args[0]}' is pushed to queue`)
            this.q.push(args)
        }
    }
}

export default Connector
