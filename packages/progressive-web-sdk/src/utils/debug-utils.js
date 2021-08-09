/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/debug-utils
 */
import {getMobifyScript} from '../asset-utils'

/**
 * Parses the URL to get the currently deployed bundle
 * @function
 * @param {string} url - Url containing the bundleID
 * @returns {(string|null)}
 * @example
 * import {getBundleIDFromURL} from 'progressive-web-sdk/dist/utils/debug-utils'
 */
export const getBundleIDFromURL = (url) => {
    if (url) {
        const match = url.match(/bundle\/([^/]*)/)
        return (match && match[1]) || null
    }
    return null
}

/**
 * Gets the currently deployed bundle ID
 * Checks the ssrOptions and the URL path before making a request
 * to get the bundleId from the header 'x-amz-meta-bundle'
 * @function
 * @param {string} url - Mobify url to request the 'x-amz-meta-bundle' header
 * @returns {Promise}
 * @example
 * import {getBundleID} from 'progressive-web-sdk/dist/utils/debug-utils'
 */
export const getBundleID = (url) => {
    // Get the bundleId put in by the SSR Server
    if (
        window.Progressive &&
        window.Progressive.ssrOptions &&
        window.Progressive.ssrOptions.bundleId
    ) {
        return Promise.resolve(window.Progressive.ssrOptions.bundleId)
    }

    if (!url) {
        return Promise.resolve('0')
    }

    // If the bundleId wasn't in the Progressive object
    // try getting it from the bundle URL
    const ssrBundle = getBundleIDFromURL(url)
    if (ssrBundle) {
        return Promise.resolve(ssrBundle)
    }

    // Add the date milliseconds to url to break the cache
    url = `${url}?version=${new Date().getTime()}`

    return fetch(url, {method: 'GET', mode: 'cors'})
        .then((resp) => {
            if (resp.ok && resp.headers.has('x-amz-meta-bundle')) {
                return resp.headers.get('x-amz-meta-bundle')
            }
            return '0'
        })
        .catch(() => '0')
}

/**
 * Checks the Mobify object to see if the page is in preview mode
 * @function
 * @returns {boolean}
 * @example
 * import {isUsingMobifyPreview} from 'progressive-web-sdk/dist/utils/debug-utils'
 */
export const isUsingMobifyPreview = () => {
    if (window.Mobify && window.Mobify.isPreview) {
        return window.Mobify.isPreview
    } else {
        return false
    }
}

/**
 * Get the target and projectId from the Mobify URL serving the Mobify tag
 * @function
 * @param {string} mobifyUrl - URL serving the mobify tag
 * @returns {Object}
 * @example
 * import {getProjectIDandTargetFromURL} from 'progressive-web-sdk/dist/utils/debug-utils'
 */
export const getProjectIDandTargetFromURL = (mobifyUrl) => {
    let target
    let projectId
    if (mobifyUrl) {
        try {
            // The URL from getBuildOrigin returns a URL starting with // and not the protocol
            // Check if the URL starts with // and add the protocol to the beginning
            // Needed to construct the URL object
            mobifyUrl = mobifyUrl.startsWith('//') ? `http:${mobifyUrl}` : mobifyUrl
            const url = new URL(mobifyUrl)

            // Get the path from the URL and split it
            // Remove the first "" with slice at index 1
            const sections = url.pathname.split('/').slice(1)
            target = sections.length >= 3 && sections[2] !== 'bundles' ? sections[2] : null
            projectId = sections.length >= 2 ? sections[1] : null
            // eslint-disable-next-line no-empty
        } catch (error) {}
    }
    return {target, projectId}
}

/**
 * Check if this is a Universal PWA
 * @function
 * @returns {boolean}
 * @example
 * import {isUniveral} from 'progressive-web-sdk/dist/utils/debug-utils'
 */
export const isUniveral = () => {
    return window.Progressive && window.Progressive.isUniversal
}

/**
 * Get the src of the Mobify script loading the page
 * E.g. loader.js, adaptive.js
 * @function
 * @returns {string}
 * @example
 * import {getMobifyScriptSrc} from 'progressive-web-sdk/dist/utils/debug-utils'
 */
export const getMobifyScriptSrc = () => {
    const scriptEl = getMobifyScript()
    return scriptEl ? scriptEl.getAttribute('src') : ''
}

/**
 * Get the SSR Timing information and format it to be displayed
 * @function
 * @returns {(Object|null)}
 * @example
 * import {getSSRTimingInformation} from 'progressive-web-sdk/dist/utils/debug-utils'
 */
export const getSSRTimingInformation = () => {
    if (window.Progressive && window.Progressive.SSRTiming) {
        return window.Progressive.SSRTiming
    }
    return null
}
