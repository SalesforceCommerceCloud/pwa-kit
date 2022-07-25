/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState} from 'react'
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

export const useAsyncExecute = <A extends any[], R>(fn: (...args: A) => Promise<R>) => {
    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState<R | undefined>(undefined)
    const [error, setError] = useState<Error | undefined>(undefined)
    const result: ActionResponse<A, R> = {
        data,
        error,
        isLoading,
        execute: (...arg) => {
            setIsLoading(true)
            fn(...arg)
                .then((data) => {
                    setData(data)
                })
                .catch((error: Error) => {
                    setError(error)
                })
                .finally(() => {
                    setIsLoading(false)
                })
        }
    }
    return result
}
