/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryOptions} from '@tanstack/react-query'

export const getQueryOptions = <TQueryFnData, TError>(
    userOptions?: UseQueryOptions<TQueryFnData, TError>
): UseQueryOptions<TQueryFnData, TError> => {
    return {
        // Our default options at the individual query level
        // (to override whichever options were set at the global level (e.g. when initializing the QueryClient))
        retry: false,
        onError: (err) => console.error(err),

        // But of course, users are still able to override the above options if they choose
        ...userOptions
    }
}
