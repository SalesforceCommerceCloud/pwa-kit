/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/warnings
 * @private
 */

let displayed = {}

/**
 *
 * Prints a warning to the console that a deprecated function is being used.
 * This allows you to say when the function will be removed and what alternate
 * function should be used. Example: "This function will be removed in version
 * 1.2.3. Please use alternateFunction() instead."
 *
 * @function
 * @param {String} message A message to follow the initial deprecation warning
 */
export const deprecated = (message) => {
    warn('deprecated', message)
}

/**
 * Prints a warning to the console that an experimental function is being used.
 *
 * @function
 * @param {String} message A message to follow the initial experimental warning
 */
export const experimental = (message) => {
    warn('experimental', message)
}

/**
 * Displays a warning once per hard navigation.
 * Does not display a warning when in production mode.
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
 * Logs a warning to the console
 * @param type Warning type
 * @param message A message to follow the initial warning
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
        deprecated: `You are currently using an deprecated function: [${functionName}].`
    }

    if (!shouldDisplay(functionName)) return
    console.warn(`[PWA Kit API WARNING]: ${messages[type]} ${message ? message : ''}`)
}
