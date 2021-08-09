/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/fetch-utils
 */
/**
 * Makes a fetch request to the provided url. The credentials fetch option is
 * always set to same-origin.
 * @function
 * @param {string} url - the url to make request
 * @param {object} options - options for the make request
 * @returns {Object}
 * @example
 * import {makeRequest} from 'progressive-web-sdk/dist/utils/fetch-utils'
 */
export const makeRequest = (url, options) => {
    return fetch(url, {...options, credentials: 'same-origin'}).then((response) => {
        // Provide an explicit alternative that has no warning
        response.cloneDangerously = response.clone

        // Replace the original `clone()` with one that has a warning
        response.clone = () => {
            console.warn(
                // See DESKTOP-348 and DESKTOP-349
                'Calling clone on a response may break other functions ' +
                    'of the response, such as `response.text()`. Proceed at ' +
                    'your own risk. If you know what you are doing, you can ' +
                    'use `response.cloneDangerously()` to avoid this warning.'
            )
            return response.cloneDangerously()
        }

        return response
    })
}

/**
 * Form encodes nested URL query parameters using recursion
 * Adapted from http://stackoverflow.com/questions/1714786/querystring-encoding-of-a-javascript-object
 * @function
 * @param {object} obj - the object to encode a Uniform Resource Identifier (URI)
 * @param {string} prefix - the prefix value to use to encode a URI
 * @returns {String}
 * @example
 * import {formEncode} from 'progressive-web-sdk/dist/utils/fetch-utils'
 */
export const formEncode = (obj, prefix) => {
    return Object.keys(obj)
        .map((key) => {
            const name = prefix ? `${prefix}[${key}]` : key
            const value = obj[key]
            if (value !== null && typeof value === 'object') {
                return formEncode(value, name)
            }
            return `${window.encodeURIComponent(name)}=${window.encodeURIComponent(value)}`
        })
        .join('&')
}

/**
 * Make a request given the provided url and options, form-encoding the data
 * into the body of the request.
 * @function
 * @param {string} url - a url to make the request
 * @param {object} data - data to use in the formEncode function
 * @param {object} options - options for the make form encoded request
 * @returns {Object}
 * @example
 * import {makeFormEncodedRequest} from 'progressive-web-sdk/dist/utils/fetch-utils'
 */
export const makeFormEncodedRequest = (url, data, options) => {
    return makeRequest(url, {
        ...options,
        body: formEncode(data),
        headers: {
            ...(options.headers || {}),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
}

/**
 * Make a request to a URL with the request body data encoded in stringified JSON
 * @function
 * @param {string} url - the url to make request
 * @param {object} data - the object to pass in JSON
 * @param {object} options - options for the make JSON encoded request
 * @returns {Object}
 * @example
 * import {makeJsonEncodedRequest} from 'progressive-web-sdk/dist/utils/fetch-utils'
 */
export const makeJsonEncodedRequest = (url, data, options) => {
    return makeRequest(url, {
        ...options,
        body: JSON.stringify(data),
        headers: {
            ...(options.headers || {}),
            'Content-Type': 'application/json'
        }
    })
}
