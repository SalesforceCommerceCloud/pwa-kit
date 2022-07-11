/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    APPLICATION_OCTET_STREAM,
    CONTENT_ENCODING,
    CONTENT_TYPE,
    X_ORIGINAL_CONTENT_TYPE
} from '../../ssr/server/constants'

export const processExpressResponse = (response) => {
    if (!response) {
        return
    }

    // Get a function that will return a header value for either
    // response type.
    const getHeader = response.getHeader
        ? response.getHeader.bind(response)
        : (header) => response.headers[header]

    const contentType = getHeader(CONTENT_TYPE)
    if (contentType && getHeader(CONTENT_ENCODING)) {
        // It's technically possible to call send() more than once,
        // so we only do this the first time that we pass through
        // here and content-type and content-encoding are both set.
        if (!getHeader(X_ORIGINAL_CONTENT_TYPE)) {
            // Get a header-setting function that will work for either
            // response type (for single-value headers only).
            const setHeader = response.setHeader
                ? response.setHeader.bind(response)
                : (header, value) => {
                      response.headers[header] = value
                  }

            // Copy the current content-type to a separate
            // header. It can then be used in processLambdaResponse
            // to restore the header.
            setHeader(X_ORIGINAL_CONTENT_TYPE, contentType)
            // Set the content-type header to application/octet-stream
            // so that aws-serverless-express will treat this as
            // binary.
            setHeader(CONTENT_TYPE, APPLICATION_OCTET_STREAM)
        }
    }
}

export const responseSend = (originalSend) => {
    return function wrappedSend(...args) {
        // process response headers
        processExpressResponse(this)

        // Call the wrapped send() function
        return originalSend.call(this, ...args)
    }
}
