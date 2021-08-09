/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/ssr-request-processing-utils
 */
/*
 There are some special requirements for this module, which is used in the
 SDK and also in Lambda@Edge functions run by CloudFront. Specifically:
 - Don't add any functionality in here that is not required for
   request-processing
 - Avoid importing any other modules not explicitly used by this code
 */

import {escape, unescape} from 'querystring'
;('') // eslint-disable-line
// TODO: https://github.com/jsdoc/jsdoc/issues/1718

/**
 * A class that represents and can manipulate a parsed
 * query string as a subclass of Array.
 *
 * The values in the Array are objects.
 *
 * The values in the Array are objects with 'key', 'originalKey'
 * 'value' and 'originalValue'. The 'key' is decoded (from %-encoding)
 * and lowercased.
 * The 'originalKey' is as it originally occurred in the query string. It's
 * not decoded or lowercased.
 * The 'originalValue' is as it originally occurred in the query string. It's
 * not decoded.
 * The 'value' is decoded (from %-encoding).
 *
 * If the query parameter is 'key=value', all fields are set.
 * If the query parameter is 'key=' then 'value' and 'originalValue' will be
 * the empty string.
 * If the query parameter is just 'key' then 'value' and 'originalValue' will
 * be null.
 * If the query parameter is empty (double-&) then 'key' and 'originalKey' will
 * be '', 'value' and 'originalValue' will be null.
 *
 * It's important that we PRESERVE the order of the parameters
 * because some projects rely on it. The 'querystring' module
 * assigns values to the resulting object in the order that it
 * encounters them in the input string. Since ES2015 there are
 * specific rules defining the order of properties, and apart
 * from one particular case the order is chronological, which is
 * what we want. The order of properties in an object depends on
 * the type of the included properties and their values. Unfortunately,
 * integer indices always come first, and the rules state that
 * "an integer index is a string that, if converted to a 53-bit
 * non-negative integer and back is the same value". This means that
 * any parameter whose key is an integer index will appear out of
 * order in the result. Thus we can't use the 'querystring' module.
 */
export class QueryParameters {
    constructor(querystring) {
        if (!querystring) {
            this._parameters = []
        } else {
            this._parameters = querystring.split('&').map((parameter) => {
                const eqPos = parameter.indexOf('=')
                const noEquals = eqPos < 0
                const originalKey = noEquals ? parameter : parameter.slice(0, eqPos)
                const key = unescape(originalKey).toLowerCase()
                const originalValue = noEquals ? null : parameter.slice(eqPos + 1)

                return {
                    key,
                    originalKey,
                    value: originalValue === null ? null : unescape(originalValue),
                    originalValue
                }
            })
        }
    }

    /**
     * Access the array of parameters owned by this QueryParameters
     * object.
     */
    get parameters() {
        return this._parameters
    }

    /**
     * Construct a new QueryParameters from the output of
     * any filtering or mapping done on another QueryParameters
     * instance's 'parameters' array.
     * @return {QueryParameters}
     */
    static from(...args) {
        const qp = new QueryParameters()
        qp._parameters = Array.from(...args)
        return qp
    }

    /**
     * Delete any query parameters with the given key.
     * Key names are matched in a case-insensitive way.
     * @param key {String}
     * @returns {Boolean} true if a parameter was deleted,
     * false if not.
     */
    deleteByKey(key) {
        const keyLC = key.toLowerCase()
        const len = this._parameters.length
        this._parameters = this._parameters.filter((parameter) => parameter.key !== keyLC)

        return this._parameters.length < len
    }

    /**
     * Add a query parameter to the array (at the end)
     * @param key {String} Parameter name (key)
     * @param value {String} Parameter value (may be
     * omitted or set to null to store only a key).
     */
    appendParameter(key, value = null) {
        this._parameters.push({
            key,
            originalKey: escape(key),
            value,
            originalValue: value === null ? null : escape(value)
        })
    }

    /**
     * An Array of all the keys (as lowercased, unescaped strings)
     */
    get keys() {
        return this._parameters.map((parameter) => parameter.key)
    }

    /**
     * Return a querystring built from the parameters in this
     * instance, using the originalKey and originalValue properties
     * of each parameter.
     *
     * Any strings that *this* class escapes will be correctly encoded (using
     * %20 for space). There is an issue with input querystrings that
     * are supposed to be encoded correctly, but which contain space
     * characters (in either the key or the value). We don't want to convert
     * them on input because that might cause the querystring as represented
     * by this class to differ from the actual input. Instead, we define the
     * behaviour of this function such that it will rebuild the querystring
     * exactly as input EXCEPT that any spaces will be +-encoded.
     *
     * @return {string}
     */
    toString() {
        return this._parameters
            .map((parameter) =>
                parameter.value === null
                    ? escape(parameter.key)
                    : `${escape(parameter.key)}=${escape(parameter.value)}`
            )
            .join('&')
    }
}
