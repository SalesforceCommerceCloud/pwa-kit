/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

export const DEFAULT_EVENTS = {
    CHILD_READY: 'bridge:child-ready',
    CHILD_NAVIGATING: 'bridge:child-navigating',
    NAVIGATE: 'bridge:child-navigate',
    RPC_CALL: 'bridge:rpc-call'
}

export const KEY_IS_MOBIFY = 'isMobifyFrameBridge'
export const VALUE_IS_MOBIFY = true

export const Frame = function(options) {
    this.isReady = false
    this.listeners = {}
    // More easily facilitate testing
    this.options = Object.assign(
        {},
        {
            origin: window.location.origin,
            debug: false
        },
        options
    )
}

/**
 * Parses the given string as JSON, and checks that it contains a standard key/
 * value pair that indicates it's a FrameBridge event message
 *
 * @param {string} event - The event.data string from the 'message' event listener
 * @returns {boolean|object} - false if parsing failed or if the key/value pair
 * is missing, or the parsed event.data object JSON if everything went well
 */
export const parseEventData = (data) => {
    if (typeof data !== 'string') {
        return false
    }

    let parsedEventData

    try {
        parsedEventData = JSON.parse(data)
    } catch (e) {
        return false
    }

    if (parsedEventData[KEY_IS_MOBIFY] !== VALUE_IS_MOBIFY) {
        return false
    }

    return parsedEventData
}

/**
 * Log to console only if debug mode is enabled
 *
 * @param {string} caller - a preceding string to always log to console (via .bind)
 * @param {...*} args - the arguments to log to the console
 */
Frame.prototype._log = function(caller, ...args) {
    return this.options.debug ? console.info(caller, ...args) : false
}

/**
 * Parses the event object and calls any registered listeners
 * (expects to be bound with a `this` object and condition to test against)
 *
 * @param {function} [condition] - return true to receive the event
 * @param {object} event - the `message` event object
 * @param {string} event.data - Serialized `message` data object
 * @param {string} event.data.eventName - The name of the event
 * @param {*} [event.data.data] - Custom information sent by parent or child
 * @param {boolean} event.data[KEY_IS_MOBIFY] - Allows us to verify event is sent by parent or child
 */
Frame.prototype._eventReceived = function(condition, event) {
    // Generally, this will be a simple check for the right window object and
    // the correct origin (same-origin)
    if (!condition(event)) {
        return
    }

    // This will return false if it either isn't valid JSON, or doesn't contain
    // the KEY_IS_MOBIFY key
    const eventData = parseEventData(event.data)

    if (!eventData) {
        return
    }

    this._log('received', eventData)

    const listeners = this.listeners[eventData.eventName]
    if (listeners) {
        for (let ctr = 0; ctr < listeners.length; ctr++) {
            listeners[ctr].call(this, eventData.data, eventData.eventName, eventData)
        }
    } else {
        this._log('no listener registered for event', eventData.eventName)
    }
}

/**
 * Send a message from/to parent/child using postMessage
 * (expects to be bound with a `this` object and a `window` object)
 *
 * @param {object} windowObject - the `window` object of the sender
 * @param {string} eventName - the event you want triggered on the receiver
 * @param {*} [data] - any JSON-serializable information you wish to send
 */
Frame.prototype._sendMessage = function(windowObject, eventName, data) {
    this._log('sent', eventName, data)

    const payload = {
        eventName,
        data,
        // Add standard key/value pair so we can check for our own messages later
        // in _eventReceived
        [KEY_IS_MOBIFY]: VALUE_IS_MOBIFY
    }

    windowObject.postMessage(JSON.stringify(payload), this.options.origin)
}

/**
 * Send an event between frames
 *
 * @param {string} eventName - the name of the event to trigger
 * @param {*} [data] - Object or primitive-based data to send across windows
 * @returns {this}
 */
Frame.prototype.trigger = function(eventName, data) {
    this._sendMessage(eventName, data)

    return this
}

/**
 * Add a new event listener
 *
 * @param {string} event - the name of the event you wish to listen for
 * @param {function} callback - the method to be run if the event is received
 *
 * `callback` receives the following arguments:
 * @param {object} data - optional information provided by `trigger`
 * @param {string} eventName - the name of the event that was triggered
 * @param {object} eventData - the raw event object passed
 * @returns {this}
 */
Frame.prototype.on = function(event, callback) {
    this._log('listener added for', event)
    this.listeners[event] = this.listeners[event] || []
    this.listeners[event].push(callback)

    return this
}

/**
 * Removes an existing event listener
 *
 * @param {string} event - the name of the event to unsubscribe from
 * @param {function} callback - the callback function to remove from subscription
 */
Frame.prototype.off = function(event, callback) {
    this._log('removing listener for', event)
    const eventListeners = this.listeners[event] || /* istanbul ignore next */ []

    const index = eventListeners.indexOf(callback)
    /* istanbul ignore next */
    if (index !== -1) {
        eventListeners.splice(index, 1)
    }

    /* istanbul ignore else */
    if (eventListeners.length === 0) {
        delete this.listeners[event]
    }

    return this
}
