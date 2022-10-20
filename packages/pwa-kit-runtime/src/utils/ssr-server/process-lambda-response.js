/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {CONTENT_TYPE, X_ORIGINAL_CONTENT_TYPE} from '../../ssr/server/constants'

export const processLambdaResponse = (response) => {
    if (!response) return response

    // If the response contains an X_ORIGINAL_CONTENT_TYPE header,
    // then replace the current CONTENT_TYPE header with it.
    const originalContentType = response.headers?.[X_ORIGINAL_CONTENT_TYPE]

    // Nothing to modify, can return original
    if (!originalContentType) return response

    const result = {
        ...response,
        headers: {
            ...response.headers,
            [CONTENT_TYPE]: originalContentType
        }
    }
    delete result.headers[X_ORIGINAL_CONTENT_TYPE]
    return result
}
