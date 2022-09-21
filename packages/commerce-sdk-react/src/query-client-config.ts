/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {DefaultOptions, QueryClientConfig} from '@tanstack/react-query'
import {RetryValue} from '@tanstack/query-core/build/lib/retryer'

const NUM_OF_RETRIES = 3 // same as React Query's default

// NOTE: ResponseError does not seem to be exported from the isomorphic sdk lib, so I had to mimic it here
interface ResponseError extends Error {
    response: Response
}

const shouldContinueRetries: RetryValue<unknown> = (failureCount, error) => {
    let shouldContinue = true

    // See https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic/blob/main/src/static/responseError.ts
    const isResponseError = Boolean((error as ResponseError).response)
    const isServerError = isResponseError && (error as ResponseError).response.status >= 500

    // Server error is more like unexpected runtime error, so we do want the retries.
    // But if it's user errors.. i.e. we don't pass in the correct parameters, then we want to immediately stop the retries

    if (!isServerError || failureCount === NUM_OF_RETRIES) {
        shouldContinue = false
    }
    return shouldContinue
}

// Why use `unknown` as the generic type? Because QueryClientConfig interface already defines it as such.
const defaultOptions: DefaultOptions<unknown> = {
    queries: {retry: shouldContinueRetries},
    mutations: {retry: shouldContinueRetries}
}

export const QUERY_CLIENT_CONFIG: QueryClientConfig = {defaultOptions}
