/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {Frame, DEFAULT_EVENTS} from './common'

/**
 * Initialize the ChildFrame
 *
 * @param {object} [options={}] - options object for configuring the child frame
 *   @param {string} [origin=window.location.origin] - used to listen to messages only sent over the same domain
 *   @param {boolean} [debug=false] - whether to log messages to console and display the iframe contents
 *   @param {Promise} [readyCheck] - a Promise that resolves when the child frame content has loaded
 * @returns {this}
 */
const ChildFrame = function(options) {
    if (window.Progressive && window.Progressive.ChildFrame) {
        return window.Progressive.ChildFrame
    } else {
        window.Progressive = window.Progressive || {}
        window.Progressive.ChildFrame = this
    }

    // Call the Frame constructor and provide it the correct `this` context
    Frame.call(this)
    this.options = Object.assign({}, this.options, options)
    this.parentWindow = null
    this.rpcMethods = {}

    // Method for telling if we should process the received message
    this._isSameOrigin = (event) =>
        event.origin === this.options.origin && event.source === this.parentWindow

    // Bind handler methods to the new object
    this._navigateHandler = this._navigateHandler.bind(this)
    this._rpcHandler = this._rpcHandler.bind(this)

    // Add `[Child]` before every call to _log
    this._log = this._log.bind(this, '[Child]')

    return this._start()
}

// Inherit the prototype from our common Frame module
ChildFrame.prototype = new Frame()

// Private method for initializing the child module
ChildFrame.prototype._start = function() {
    // Set up child message listener
    window.addEventListener('message', this._eventReceived.bind(this, this._isSameOrigin), false)

    // We need a reference to the parent window to pass messages properly
    this.parentWindow = window.top
    this._sendMessage = this._sendMessage.bind(this, this.parentWindow)

    this.on(DEFAULT_EVENTS.NAVIGATE, this._navigateHandler)
    this.on(DEFAULT_EVENTS.RPC_CALL, this._rpcHandler)

    const ready = () => {
        this._log('ready')
        this.trigger(DEFAULT_EVENTS.CHILD_READY)
    }

    // User-supplied Promise for determining that the child frame has finished
    // loading
    if (this.options.readyCheck) {
        this.options.readyCheck.then(ready)
    } else if (document.readyState === 'interactive') {
        // If the document is already in 'interactive' we've passed the
        // DOMContentLoaded event and just trigger `ready` manually.
        // HTML Spec: https://html.spec.whatwg.org/#the-end
        ready()
    } else {
        // Otherwise, just wait for a sane default, in this case, DOMContentLoaded
        document.addEventListener('DOMContentLoaded', ready, false)
    }

    return this
}

const getAbsoluteUrl = (url) => {
    const a = document.createElement('a')
    a.href = url
    return a.href
}

// Navigate the iframe in response to a message.
ChildFrame.prototype._navigateHandler = function({url}) {
    const targetUrl = getAbsoluteUrl(url)

    if (targetUrl !== window.location.href) {
        this._log('child navigating to', targetUrl)
        this.trigger(DEFAULT_EVENTS.CHILD_NAVIGATING)
        // If we use window.location.href = targetUrl here,
        // a new entry will be added to the iframe's history.
        // The child iframe and the top level frame share a history,
        // so when the user hits the back button,
        // the iframe will navigate instead of the top level page.
        // By using replace, we don't add a new item to the history,
        // and the back button works as expected.
        window.location.replace(targetUrl)
    } else {
        // Re-trigger this event to drain the event queue
        this.trigger(DEFAULT_EVENTS.CHILD_READY)
    }
}

// Listen for RPC calls from parent and send back a message after the method
// has run
ChildFrame.prototype._rpcHandler = function({uid, fnName, args}) {
    const fcn = this.rpcMethods[fnName]

    if (typeof fcn === 'undefined') {
        return this.options.debug && console.warn('[Child] unregistered method called:', fnName)
    } else {
        return Promise.resolve(fcn.apply(this, args)).then((res) =>
            this.trigger(`${DEFAULT_EVENTS.RPC_CALL}:${uid}`, res)
        )
    }
}

/**
 * Register a method that can be invoked by the parent
 *
 * @param {string} fnName - the unique name of the method
 * @param {function} method - the function that should be invoked. Can return a Promise
 * @returns {this}
 */
ChildFrame.prototype.registerMethod = function(fnName, method) {
    this._log('registered method', fnName)
    this.rpcMethods[fnName] = method

    return this
}

export default ChildFrame
