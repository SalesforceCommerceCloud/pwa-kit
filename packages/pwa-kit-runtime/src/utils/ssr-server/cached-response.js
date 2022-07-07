/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {X_MOBIFY_FROM_CACHE} from '../../ssr/server/constants'

export class CachedResponse {
    /**
     * Construct a CachedResponse from a cache entry. Project
     * code should never need to call this.
     * @private
     */
    constructor({entry = {}, req, res}) {
        this._found = !!entry.found
        this._key = entry.key
        this._namespace = entry.namespace
        this._data = entry.data
        this._metadata = entry.metadata || {}
        this._expiration = entry.expiration
        this._req = req
        this._res = res
    }

    /**
     * Send this response
     * @private
     */
    _send() {
        const metadata = this._metadata
        const res = this._res
        res.status(this.status)
        if (metadata.headers) {
            res.set(metadata.headers)
        }
        res.setHeader(X_MOBIFY_FROM_CACHE, 'true')
        if (this._data) {
            // Use write() not send(), because the body has already
            // been processed into a Buffer.
            res.write(this._data)
        }
    }

    /**
     * Get the key used to retrieve this CachedResponse
     */
    get key() {
        return this._key
    }

    /**
     * Get the namespace used to retrieve this CachedResponse
     */
    get namespace() {
        return this._namespace
    }

    /**
     * true if this instance represents a found entry in the cache,
     * false if no entry was found.
     * @returns {Boolean}
     */
    get found() {
        return this._found
    }

    /**
     * The status code of this CachedResponse (as a Number)
     * @returns {Number}
     */
    get status() {
        return this._metadata.status || 200
    }

    /**
     * A reference to the data for the response, which will
     * be a Buffer, or undefined if the response is empty.
     * @returns {Buffer|undefined}
     */
    get data() {
        return this._data
    }

    /**
     * A reference to the headers for the response. The value is
     * a plain JS object containing the headers in the format used
     * by ExpressJS: keys are always lower-case, values are strings
     * except for set-cookie, which is an array of strings.
     * @returns {{}}
     */
    get headers() {
        return this._metadata.headers || {}
    }

    /**
     * Get the date & time when this entry would expire. If this
     * instance represents an entry that was not found, returns
     * undefined.
     * @returns {Date|undefined}
     */
    get expiration() {
        return this._found ? new Date(this._expiration) : undefined
    }
}
