/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/logger
 */
/**
 * Simple module to enable logging under debug conditions only. Defaults to
 * determining debug status based on preview, which is shared across all
 * instances
 * @function
 * @param {string} prefix='' - Appends the given prefix to any logging statements - defaults to empty string
 * @returns {Logger}
 */
const Logger = function(prefix) {
    this.prefix = prefix || ''
    return this
}

Logger._debugFlag = !!(window.Mobify && typeof window.Mobify.Preview !== 'undefined')

/**
 * Toggles the debug setting on and off
 * @private
 * @param {boolean} isDebug - `true` to toggle on, `false` to toggle off
 */
Logger.setDebug = function(isDebug) {
    Logger._debugFlag = !!isDebug
}

/**
 * Returns the current debug setting
 * @private
 * @returns {boolean}
 */
Logger.isDebug = () => Logger._debugFlag

/**
 * Logs to console only if debug setting is true.
 * @private
 * @param {*} args - Comma separated arguments to log to console
 * @returns undefined
 */
Logger.prototype.log = function(...args) {
    Logger._debugFlag && console.log(this.prefix, ...args)
}

/**
 * Logs to console regardless of debug setting.
 * @private
 * @param {*} args - Comma separated arguments to log to console
 * @returns undefined
 */
Logger.prototype.forceLog = function(...args) {
    console.log(this.prefix, ...args)
}

export default Logger
