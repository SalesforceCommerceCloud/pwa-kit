/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/api-marker
 */
const log = require('loglevel')
let displayed = {}

/**
 * Print a warning to console that a deprecated function is being used.
 * @param {String} message (recommended) message to follow the initial 'deprecation' warning message.
 * The message should state which version the function will be removed in, and what alternate
 * function to use instead if any (i.e. It will be removed in version 1.2.3. Please use [Blah] instead).
 *
 */
export const deprecate = (message) => {
    warn('deprecate', message)
}

/**
 * Print a warning to console that an experimental function is being used.
 * @param {String} message message to follow the initial 'experimental' warning message.
 */
export const experimental = (message) => {
    warn('experimental', message)
}

/**
 * Display warning for function once per hard navigation.
 * Do not display warning when in production mode.
 * @private
 */
const shouldDisplay = (name) => {
    if (process.env.NODE_ENV === 'production' || displayed[name]) {
        return false
    } else {
        displayed[name] = true
        return true
    }
}

/**
 * Logs warning to console
 * @param type warning type
 * @param message message to follow the initial warning message.
 */
const warn = (type, message) => {
    let functionName = ''

    // Get caller name by reading an Error stack trace instead of getting
    // function property `caller` because it is not allowed in `strict` mode.
    try {
        throw new Error()
    } catch (e) {
        functionName = e.stack.split('\n')[3].split(' ')[5]
    }

    const messages = {
        experimental: `You are currently using an experimental function: [${functionName}] This function may change at any time.`,
        deprecate: `You are currently using an deprecated function: [${functionName}].`
    }

    if (!shouldDisplay(functionName)) return
    log.warn(`%c [MOBIFY API WARNING]: ${messages[type]} ${message ? message : ''}`, `color: red`)
}
