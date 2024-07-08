/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// To avoid an unwieldy file size, this file should be for utils that are less than ~20 lines.
// Larger utils should be placed in separate files.
// Also, ./utils/ssr-server/utils is a bit of a silly name, but these helpers can't live in
// ../ssr-server.js because it would create circular dependencies.

import crypto from 'crypto'
import {proxyConfigs} from '../ssr-shared'
import {proxyBasePath, bundleBasePath} from '../ssr-namespace-paths'
import logger from '../logger-instance'

// TODO: Clean this up or provide a way to toggle
export const verboseProxyLogging = false

export const isRemote = () =>
    Object.prototype.hasOwnProperty.call(process.env, 'AWS_LAMBDA_FUNCTION_NAME')

export const getBundleBaseUrl = () => {
    return `${bundleBasePath}/${isRemote() ? process.env.BUNDLE_ID : 'development'}/`
}

let QUIET = false

export const setQuiet = (quiet) => {
    QUIET = quiet
}

export const isQuiet = () => QUIET

// Logs in local development server mode only
export const localDevLog = (...args) => {
    if (!isRemote() && !QUIET) {
        /* istanbul ignore next */
        console.log(...args)
    }
}

// Logs unless server is in quiet mode (used for tests)
export const infoLog = (...args) => {
    /* istanbul ignore next */
    if (!QUIET) {
        /* istanbul ignore next */
        console.log(...args)
    }
}

/**
 * A global error catcher
 * @private
 */
export const catchAndLog = (err, context) => {
    /* istanbul ignore next */
    const message = `${context || 'Uncaught exception'}: `
    logger.error(
        message,
        /* istanbul ignore next */
        {
            namespace: 'catchAndLog',
            additionalProperties: {
                stack: (err && (err.stack || err.message || err)) || '(no error)'
            }
        }
    )
}

/**
 * Given a piece of JavaScript or JSON as text, escape any
 * '</' so that it can be embedded within HTML.
 *
 * @private
 * @param {String} text
 * @returns {String}
 */
export const escapeJSText = (text) => text?.replace(/<\//gm, '\\x3c\\x2f')

export const getHashForString = (text) => {
    const hash = crypto.createHash('sha256')
    hash.update(text)
    return hash.digest('hex')
}

export const getFullRequestURL = (url) => {
    // If it starts with a protocol (e.g. http(s)://, file://), then it's already a full URL
    if (/^[a-zA-Z]+:\/\//.test(url)) return url
    const proxy = proxyConfigs.find(({path}) => url.startsWith(`${proxyBasePath}/${path}/`))
    if (proxy) {
        return url.replace(`${proxyBasePath}/${proxy.path}`, `${proxy.protocol}://${proxy.host}`)
    }

    throw new Error(
        `Unable to fetch ${url}, relative paths must begin with ${proxyBasePath} followed by a configured proxy path.`
    )
}

const CC_AGE_RE = /(s-maxage|max-age)\s*=\s*(\d+)/gi

/**
 * Perform limited parsing of a Cache-Control header value, to
 * extract the s-maxage and max-age values and return them.
 *
 * @function
 * @param value {String} the value to parse
 * @returns {Object} with 'max-age' and 's-maxage' properties mapped
 * to String or undefined values.
 */
export const parseCacheControl = (value) => {
    const result = {}
    if (value) {
        for (const match of value.matchAll(CC_AGE_RE)) {
            result[match[1].toLowerCase()] = match[2]
        }
    }
    return result
}
