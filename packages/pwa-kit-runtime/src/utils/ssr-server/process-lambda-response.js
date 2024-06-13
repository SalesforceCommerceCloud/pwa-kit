/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {CONTENT_TYPE, X_ORIGINAL_CONTENT_TYPE} from '../../ssr/server/constants'

export const processLambdaResponse = (response, event) => {
    if (!response) return response

    // Retrieve the correlation ID from the event headers
    const correlationId = event.headers?.['x-correlation-id']

    const responseHeaders = {
        ...response.headers
    }

    // Add the correlation ID to the response headers if it exists
    if (correlationId) {
        responseHeaders['x-correlation-id'] = correlationId
    }

    // If the response contains an X_ORIGINAL_CONTENT_TYPE header,
    // then replace the current CONTENT_TYPE header with it.
    const originalContentType = response.headers?.[X_ORIGINAL_CONTENT_TYPE]
    if (originalContentType) {
        responseHeaders[CONTENT_TYPE] = originalContentType
        delete responseHeaders[X_ORIGINAL_CONTENT_TYPE]
    }

    const result = {
        ...response,
        headers: responseHeaders
    }
    return result
}
