/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState, useEffect} from "react";
import {ActionResponse, QueryResponse} from './types'

export const useAsync = <T>(fn: () => Promise<T>, deps: unknown[] = []): QueryResponse<T> => {
    const [data, setData] = useState<T | undefined>()
    const [error, setError] = useState<Error | undefined>()
    const [isLoading, setIsLoading] =useState(true)

    useEffect(() => {
        // use this variable to avoid race condition
        let subscribe = true
        setIsLoading(false)

        const runAsync = async () => {
            try {
                if (subscribe) {
                    const res = await fn()
                    console.log('res', res )
                    setData(res)
                    setIsLoading(false)
                }
            } catch (error) {
               if (subscribe) {
                   setIsLoading(false)
                   if (error instanceof Error) {
                       setError(error)
                   }
               }
            }
        }

        runAsync()

        // clean up
        return () => {
            subscribe = false
        }
    }, [deps])

    return {data, isLoading, error}
}

export const useAsyncExecute = <A, R>(fn: (arg: A) => Promise<R>) => {
    // This is a stub implementation to validate the types.
    // The real implementation will be more React-y.
    const result: ActionResponse<A, R> = {
        isLoading: false,
        execute(arg: A) {
            result.isLoading = true
            fn(arg)
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
