/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Minimal stub version of ssr-express utilities for pwa-kit-dev
 * This breaks the cyclical dependency with pwa-kit-runtime
 * @private
 */

/**
 * Look up a cached response for the given request in the persistent cache
 * and return a CachedResponse that represents what was found.
 *
 * @param req {express.request}
 * @param res {express.response}
 * @param [key] {String} the key to use
 * @param [namespace] {String|undefined} the cache namespace to use.
 * @returns {Promise<CachedResponse>} resolves to a CachedResponse
 * that represents the result of the cache lookup.
 * @private
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getResponseFromCache = ({req, res, namespace, key}) => {
    // Stub implementation for testing
    return Promise.resolve({
        found: false,
        _send: () => {},
        _res: res
    })
}

/**
 * Given a CachedResponse that represents a response from the
 * cache, send it. Once this method has been called, the response
 * is sent and can no longer be modified.
 *
 * @param cached {CachedResponse} the cached response to send
 * @private
 */
export const sendCachedResponse = (cached) => {
    if (!(cached && cached.found)) {
        throw new Error(`Cannot send a non-cached CachedResponse`)
    }
    cached._send()
    cached._res.end()
}

/**
 * Cache the response when it's done being sent.
 *
 * @param req {express.request}
 * @param res {express.response}
 * @param [expiration] {Number} the cache expiration time in seconds
 * @param [key] {String} the key to use
 * @param [namespace] {String|undefined} the cache namespace to use.
 * @param [shouldCacheResponse] {Function} function to determine if response should be cached
 * @private
 */
export const cacheResponseWhenDone = ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    req,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    res,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    expiration,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    key,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    namespace,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    shouldCacheResponse
}) => {
    // Stub implementation for testing
    return Promise.resolve()
}
