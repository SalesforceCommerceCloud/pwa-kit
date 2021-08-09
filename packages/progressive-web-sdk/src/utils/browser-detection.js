/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/browser-detection
 * @private
 */
/**
 * Detecting the browser and version from the User-Agent string.
 *
 * @param {Object} navigator - browser navigator object
 *
 * @returns {Object} - browser name (lowercase), version, mobile (Boolean)
 * and userAgent
 *
 * @private
 */
export const detectBrowser = (navigator) => {
    const agent = navigator.userAgent.toLowerCase()
    let temp

    // RegExp for matching the browser name and version
    // first match any of the strings for browser names in this exact order
    // the version number is the string of numbers and dots after the slash
    let M =
        agent.match(/(opera|samsungbrowser|chrome|safari|firefox|msie(?=\/))\/?\s*([\d.]+)/) || []

    // Newer versions of Opera, and Edge will have "Chrome" in their User-Agent
    if (M[1] === 'chrome') {
        temp = agent.match(/\bopr\/([\d.]+)/)
        if (temp !== null) {
            return {
                name: 'opera',
                version: temp[1],
                userAgent: agent,
                mobile: agent.indexOf('mobile') > 0
            }
        }
        temp = agent.match(/edge\/([\d.]+)/i)
        if (temp !== null) {
            return {
                name: 'edge',
                version: temp[1],
                userAgent: agent,
                mobile: agent.indexOf('mobile') > 0
            }
        }
    }

    // Older versions of IE (before IE11) will not have the "MSIE" string in
    // their User-Agent, but they'll have appName and appVersion in the navigator object
    M = M[2] ? [M[1], M[2]] : [navigator.appName.toLowerCase(), navigator.appVersion]

    // Safari's version number is next to the "Version" string
    if ((temp = agent.match(/version\/([\d.]+)/i)) !== null) {
        M.splice(1, 1, temp[1])
    }

    return {
        name: M[0],
        version: M[1],
        userAgent: agent,
        mobile: agent.indexOf('mobile') > 0
    }
}

/**
 * Check if the browser version is compatible with a given supported browser.
 *
 * Behaviour:
 * - match the supported browser as RegExp (if it is a regular expression)
 * - otherwise, check name and major version of the browser
 *
 * @param {Object} browser - browser object, with name (lowercase),
 * version (Integer), mobile (Boolean) and userAgent
 * @param {Object} supported - a supported browser object, with browser
 * name and list of supported major releases
 *
 * @returns {Boolean}
 *
 * @private
 */
const checkVersion = (browser, supported) => {
    let found

    // If the supported browser object has a name and mobile value that match the browser
    // check the major version
    if (
        supported.name &&
        browser.mobile === !!supported.mobile &&
        browser.name === supported.name
    ) {
        return parseInt(browser.version) >= supported.version
    }

    // If the supported browser object is a RegExp, match it directly
    if (!supported.name && browser.userAgent.match(supported) !== null) {
        found = true
    }

    return !!found
}

/**
 * Check if the browser version matches any element in the supported browser
 * list.
 *
 * @param {Object} browser - browser object with name (lowercase), version, mobile (Boolean)
 * and userAgent
 * @param {Array} supportedBrowsers - list of supported browser objects
 *
 * @returns {Boolean}
 *
 * @private
 */
export const checkBrowserCompatibility = (browser, supportedBrowsers) => {
    for (const i in supportedBrowsers) {
        if (checkVersion(browser, supportedBrowsers[i])) {
            return true
        }
    }
    return false
}
