/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Queue from '../../vendor/queue.src.js'
import {Frame, DEFAULT_EVENTS} from './common'

/**
 * Initialize the FrameBridge
 *
 * @param {object} [options={}] - options object for configuring the bridge
 *   @param {string} [origin=window.location.origin] - used to listen to messages only sent over the same domain
 *   @param {boolean} [debug=false] - whether to log messages to console and display the iframe contents
 *   @param {string} [src=window.location.href] - the starting href of the child frame
 * @returns {this}
 */
const FrameBridge = function(options) {
    // Since we could be running in completely separate modules (i.e. loader.js
    // as well as main.js) we need to attach ourselves to window object to
    // properly create an instance
    if (window.Progressive && window.Progressive.FrameBridge) {
        return window.Progressive.FrameBridge
    } else {
        window.Progressive = window.Progressive || {}
        window.Progressive.FrameBridge = this
    }

    // Call the Frame constructor and provide it the correct `this` context
    Frame.call(this)
    // Populate our own properties
    this.options.src = window.location.href
    this.options = Object.assign({}, this.options, options)
    this.childFrame = null
    this.eventQueue = new Queue()

    // Method for telling if we should process the received message
    this._isSameOrigin = (event) =>
        event.origin === this.options.origin && event.source === this.childFrame.contentWindow

    // Add `[Parent]` before every call to _log
    this._log = this._log.bind(this, '[Parent]')

    // Unique ID to apply to RPC calls to child frame
    let callCount = 0
    this.uid = () => callCount++

    return this._start()
}

// Inherit the prototype from our common Frame module
FrameBridge.prototype = new Frame()

// Private method for initializing the parent module
FrameBridge.prototype._start = function() {
    // Set up parent message listener
    window.addEventListener('message', this._eventReceived.bind(this, this._isSameOrigin), false)

    // Listen for child frame loading complete
    this.on(DEFAULT_EVENTS.CHILD_READY, this._childReadyHandler)

    // When the child frame navigates, we need to wait for it to be initialized
    // again after it's finished loading (i.e. `DEFAULT_EVENTS.CHILD_READY`)
    this.on(DEFAULT_EVENTS.CHILD_NAVIGATING, this._navigateHandler)

    this._createChildFrame()

    this._bindChildFrameWindowToSendMessage()

    return this
}

FrameBridge.prototype._bindChildFrameWindowToSendMessage = function() {
    // Bind `this` to the iframe bridge instance, and bind the first argument to the iframe window.
    this._sendMessage = this._sendMessage.bind(this, this.childFrame.contentWindow)
}

FrameBridge.prototype._childReadyHandler = function() {
    this.isReady = true
    this._log('bridge ready')
    this._drainQueue()
}

FrameBridge.prototype._navigateHandler = function() {
    this._log('bridge waiting')
    this.isReady = false
}

// Private method for creating the child iframe element
FrameBridge.prototype._createChildFrame = function() {
    this.childFrame = document.createElement('iframe')
    this.childFrame.setAttribute('id', 'progressive-frame-bridge')
    /**
     * Sandboxing the child frame lets us disable things like alerts and new windows
     * from being shown from within the child frame - but we need to:
     *
     * allow-scripts - scripts are still run in the child frame
     * allow-same-origin - without this, origin is set to null and causes a wide variety of broken behavior
     * allow-forms - allow forms to be submitted within the child frame
     *
     * @url: https://developer.mozilla.org/en/docs/Web/HTML/Element/iframe#attr-sandbox
     */
    this.childFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms')

    if (this.options.debug) {
        this.childFrame.style.height = '600px'
        this.childFrame.style.width = '100%'
    } else {
        this.childFrame.style.display = 'none'
    }

    document.body.appendChild(this.childFrame)
    this.childFrame.setAttribute('src', this.options.src)
}

// Private method for emptying the queue of events after child has signaled it's
// ready to receive them
FrameBridge.prototype._drainQueue = function() {
    // Child iFrame loading time is our bottleneck.
    // Often there will be multiple navigation event queue up.
    // Previously we have to wait for previous page to load and
    // we have to wait previous events to finish execute before we can
    // navigate to next page.

    // Improvement: in order to respond to user interaction asap
    // we abandon previous container events and start loading new events
    // that are after the LAST navigation event that is in the queue.

    let tempQueue = new Queue()
    let hasNavigationEvent = false

    while (!this.eventQueue.isEmpty()) {
        const event = this.eventQueue.dequeue()
        const {eventName} = event

        // scan the entire queue, find the last navigation event
        // and abandon all previous events
        if (eventName === DEFAULT_EVENTS.NAVIGATE) {
            hasNavigationEvent = true
            tempQueue = new Queue()
        }

        tempQueue.enqueue(event)
    }

    if (hasNavigationEvent) {
        const navigationEvent = tempQueue.dequeue()
        this._sendMessage(navigationEvent.eventName, navigationEvent.data)

        this.eventQueue = tempQueue
        return
    }

    while (!tempQueue.isEmpty()) {
        const {eventName, data} = tempQueue.dequeue()
        this._sendMessage(eventName, data)
    }
}

FrameBridge.prototype._setChildFrameUrl = function(url) {
    // Stop the current page load with multiple strategies
    this.childFrame.contentWindow.stop()
    this.childFrame.contentWindow.document.location.replace('about:blank')

    setTimeout(() => {
        // Avoid setting document.location.href = url
        // Otherwise, it will break the back button behaviour
        // because it adds a new entry in the history.
        // Note that the iframe and top document both share
        // the same history.
        this.childFrame.contentWindow.document.location.replace(url)
    })
}

FrameBridge.prototype._quicklyNavigateChildFrame = function(url) {
    this._navigateHandler()
    this._setChildFrameUrl(url)

    // Abandon the previous events.
    // We don't need them anymore because they were intended for the old page.
    this.eventQueue = new Queue()
}

/**
 * Send an event to the child frame
 *
 * @param {string} eventName - the name of the event to trigger
 * @param {object} [data] - key/value pair containing information to send
 * @returns {this}
 */
FrameBridge.prototype.trigger = function(eventName, data) {
    if (this.isReady) {
        if (eventName === DEFAULT_EVENTS.NAVIGATE) {
            this._quicklyNavigateChildFrame(data.url)

            // Queue up the redundant navigation event
            // in case the iframe does not catch up
            this.eventQueue.enqueue({
                eventName,
                data
            })
        } else {
            // Since the bridge frame has loaded, send the event immediately
            Frame.prototype.trigger.call(this, eventName, data)
        }
    } else {
        if (eventName === DEFAULT_EVENTS.NAVIGATE) {
            // The key here is to force the child iframe to navigate immediately
            // even when it's not ready yet. Once a navigation event happens,
            // abandon the previous page events.
            this._quicklyNavigateChildFrame(data.url)
        }

        // Add the event (including the redundant navigation event)
        // to a queue to be drained later
        this.eventQueue.enqueue({
            eventName,
            data
        })
    }

    return this
}

/**
 * Tell the child frame to navigate to the given url
 *
 * @param {string} url - the url that should be set as `window.location.href` of the child frame
 * @returns {this}
 */
FrameBridge.prototype.navigate = function(url) {
    return this.trigger(DEFAULT_EVENTS.NAVIGATE, {url})
}

/**
 * Invoke a method that was registered in the child frame
 *
 * @param {string} fnName - the name of the registered method to invoke
 * @params {...*} args - the arguments accepted by the registered method
 * @returns {Promise} - a thenable Promise that resolves after the child method returns or resolves
 */
FrameBridge.prototype.callMethod = function(fnName, ...args) {
    const uid = this.uid()
    return new Promise((resolve) => {
        this.trigger(DEFAULT_EVENTS.RPC_CALL, {
            uid,
            fnName,
            args
        })

        this.on(`${DEFAULT_EVENTS.RPC_CALL}:${uid}`, (data, eventName, eventData) => {
            resolve({data, eventName, eventData})
        })
    })
}

export default FrameBridge
