/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {CONTENT_TYPE, X_ORIGINAL_CONTENT_TYPE} from '../../ssr/server/constants'
import {getFlattenedHeadersMap} from '@h4ad/serverless-adapter'

/**
 * Processes multi-value headers by flattening them into a single headers object,
 * while preserving cookies in multiValueHeaders format.
 * Cookies are extracted from multiValueHeaders and kept separate, as they need
 * to remain in multiValueHeaders format for AWS Lambda responses.
 * Also restores the original content type if it was temporarily replaced
 * (e.g., when binary content encoding is used).
 *
 * @private
 * @param {Object} multiValueHeaders - An object containing multi-value headers,
 * where each key maps to an array of header values (e.g., {'set-cookie': ['cookie1', 'cookie2']})
 * @returns {Object} An object containing:
 *   - headers: A flattened headers object with all headers joined by commas,
 *     excluding set-cookie headers, with a 'date' header added and content-type
 *     restored from x-original-content-type if present
 *   - multiValueHeaders: An object containing only the 'set-cookie' header if cookies were present,
 *     otherwise an empty object
 */
export const processHeaders = (multiValueHeaders) => {
    const cookies = multiValueHeaders?.['set-cookie']
    let headers = getFlattenedHeadersMap(multiValueHeaders || {}, ',', true)
    headers['date'] = new Date().toUTCString()
    let newMultiValueHeaders = {}

    // Only allow set-cookie headers to be in multiValueHeaders
    // to return multiple set-cookie headers instead of a single set-cookie header with multiple values
    if (cookies) {
        delete headers['set-cookie']
        newMultiValueHeaders = {'set-cookie': cookies}
    }

    // If the response contains an X_ORIGINAL_CONTENT_TYPE header,
    // then replace the current CONTENT_TYPE header with it.
    const originalContentType = headers[X_ORIGINAL_CONTENT_TYPE]
    if (originalContentType) {
        headers[CONTENT_TYPE] = originalContentType
        delete headers[X_ORIGINAL_CONTENT_TYPE]
    }

    return {headers, multiValueHeaders: newMultiValueHeaders}
}

/**
 * Processes a Lambda response by converting multi-value headers to a flattened format,
 * preserving cookies in multiValueHeaders, and adding correlation ID from the event.
 *
 * This function is used to transform Express response headers into the format
 * expected by AWS Lambda/API Gateway, ensuring that:
 * - Multi-value headers are properly flattened (except for set-cookie)
 * - Cookies remain in multiValueHeaders format for proper handling
 * - Correlation IDs are propagated from the request to the response
 * - Original content types are restored when they were temporarily replaced
 *   (handled by processHeaders)
 *
 * @param {Object} response - The Lambda response object containing multiValueHeaders
 * @param {Object} event - The Lambda event object containing request headers
 * @param {Object} [event.headers] - Request headers from the Lambda event
 * @param {string} [event.headers['x-correlation-id']] - Correlation ID to add to response headers
 * @returns {Object} The processed response object with:
 *   - headers: Flattened headers object (all headers joined by commas, except set-cookie)
 *   - multiValueHeaders: Object containing set-cookie headers if present
 *   - All other properties from the original response object
 */
export const processLambdaResponse = (response, event) => {
    if (!response) return response

    // Retrieve the correlation ID from the event headers
    const correlationId = event.headers?.['x-correlation-id']

    // The response only has multiValueHeaders but the updated response needs joined single value headers
    // except for the set-cookie headers
    let {headers, multiValueHeaders} = processHeaders(response.multiValueHeaders)

    // Add the correlation ID to the response headers if it exists
    if (correlationId) {
        headers['x-correlation-id'] = correlationId
    }

    const result = {
        ...response,
        headers,
        multiValueHeaders
    }
    return result
}
