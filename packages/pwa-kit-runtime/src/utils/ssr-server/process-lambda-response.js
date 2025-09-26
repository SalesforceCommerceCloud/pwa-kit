/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {CONTENT_TYPE, X_ORIGINAL_CONTENT_TYPE} from '../../ssr/server/constants'
import {getFlattenedHeadersMap} from '@h4ad/serverless-adapter'

export const processLambdaResponse = (response, event) => {
    if (!response) return response

    // Retrieve the correlation ID from the event headers
    const correlationId = event.headers?.['x-correlation-id']

    let joinedHeaders = getFlattenedHeadersMap(response.multiValueHeaders || {}, ',', true)
    joinedHeaders['date'] = new Date().toUTCString()
    delete response['multiValueHeaders']

    // Add the correlation ID to the response headers if it exists
    if (correlationId) {
        joinedHeaders['x-correlation-id'] = correlationId
    }

    // If the response contains an X_ORIGINAL_CONTENT_TYPE header,
    // then replace the current CONTENT_TYPE header with it.
    const originalContentType = joinedHeaders[X_ORIGINAL_CONTENT_TYPE]
    if (originalContentType) {
        joinedHeaders[CONTENT_TYPE] = originalContentType
        delete joinedHeaders[X_ORIGINAL_CONTENT_TYPE]
    }

    const result = {
        ...response,
        headers: joinedHeaders
    }
    return result
}
