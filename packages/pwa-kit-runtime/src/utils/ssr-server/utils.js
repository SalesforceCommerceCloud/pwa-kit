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

/**
 * Parse a request URL using the WHATWG URL constructor, constructing a
 * base URL from the request's protocol and host header when available.
 * Falls back to 'http://localhost' as the base when host information is
 * not present — in that case, do not rely on `origin` or `href` from
 * the returned URL since they will contain the placeholder base.
 *
 * @param {Object} req - Express-like request object with `url`, `protocol`,
 *   `headers.host`, and optionally `socket.encrypted` properties.
 * @returns {{pathname: string, search: string, query: string|null}}
 *   `pathname` – the URL path, `search` – the full query string including
 *   leading `?` (or empty string), `query` – the query string without `?`
 *   (or null if there is none).
 */
export const parseRequestUrl = (req) => {
    const proto = req.protocol || (req.socket?.encrypted ? 'https' : 'http')
    const base = `${proto}://${req.headers?.host || 'localhost'}`
    const {pathname, search} = new URL(req.url, base)
    return {
        pathname,
        search,
        query: search ? search.slice(1) : null
    }
}

/**
 * Type checking utility functions
 */
export const isString = (element) => typeof element === 'string'

export const isArray = (element) => Array.isArray(element)

export const isObject = (element) =>
    element !== null && typeof element === 'object' && !Array.isArray(element)

export const isIterable = (element) => isArray(element) || isObject(element)

/**
 * Iterate over an object or array, calling a function for each key-value pair
 * @param {Object|Array} iterable - The object or array to iterate over
 * @param {Function} functionRef - Function to call for each key-value pair (key, value)
 */
export const forEachIn = (iterable, functionRef) => {
    Object.keys(iterable).forEach((key) => {
        functionRef(key, iterable[key])
    })
}

/**
 * Check if the target host is a Salesforce Commerce API domain
 * @param {string} targetHost - The target host (may include port, e.g., "host.com:443")
 * @returns {boolean} True if it's an SCAPI domain
 */
export const isScapiDomain = (targetHost) => {
    if (!targetHost) return false

    // Remove port if present (handle both IPv4 and domain formats)
    // Example: "abc-001.api.commercecloud.salesforce.com:443" -> "abc-001.api.commercecloud.salesforce.com"
    const hostname = targetHost.split(':')[0]

    // Check if it matches *.api.commercecloud.salesforce.com pattern
    // SCAPI domains always have an instance identifier subdomain (e.g., abc-001, kv7kzm78)
    return hostname.endsWith('.api.commercecloud.salesforce.com')
}

/**
 * Log an internal MRT error.
 *
 * @param namespace Namespace for the error (e.g. data_store, redirect) to facilitate searching
 * @param err Error to log
 * @param context Optional context to include in the log
 */
export const logMRTError = (namespace, err, context) => {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error(
        JSON.stringify({
            [`__MRT__${namespace}`]: 'error',
            type: 'MRT_internal',
            error: error.message,
            stack: error.stack,
            ...context
        })
    )
}
