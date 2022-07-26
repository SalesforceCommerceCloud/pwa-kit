/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ActionResponse, QueryResponse} from './types'

export const useAsync = <T>(fn: () => Promise<T>, deps?: unknown[]): QueryResponse<T> => {
    // This is a stub implementation to validate the types.
    // The real implementation will be more React-y.
    const result: QueryResponse<T> = {
        isLoading: true
    }
    fn()
        .then((data) => {
            result.isLoading = false
            result.data = data
        })
        .catch((error) => {
            result.isLoading = false
            result.error = error
        })
    return result
}

export const useAsyncExecute = <Args extends unknown[], Ret>(
    fn: (...args: Args) => Promise<Ret>
) => {
    // This is a stub implementation to validate the types.
    // The real implementation will be more React-y.
    const result: ActionResponse<Args, Ret> = {
        isLoading: false,
        execute(...args: Args) {
            result.isLoading = true
            fn(...args)
                .then((data) => {
                    result.isLoading = false
                    result.data = data
                })
                .catch((error) => {
                    result.isLoading = false
                    result.error = error
                })
        }
    }
    return result
}
