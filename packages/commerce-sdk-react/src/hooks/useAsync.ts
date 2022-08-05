/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState, useEffect} from 'react'
import {ActionResponse, QueryResponse} from './types'

// NOTE: temporary implementation, so that I can test other hooks besides `useCommerceApi`
// TODO: revert this change
export const useAsync = <T>(fn: () => Promise<T>, deps?: unknown[]): QueryResponse<T> => {
    const [data, setData] = useState<T>()
    const [error, setError] = useState<Error>()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let subscribed = true

        fn().then(
            (r) => {
                if (subscribed) {
                    console.log('--- got response', r)
                    setIsLoading(false)
                    setData(r)
                }
            },
            (e) => {
                if (subscribed) {
                    console.log('--- got error', e)
                    setIsLoading(false)
                    setError(e)
                }
            }
        )

        return function cleanup() {
            subscribed = false
        }
    }, deps || [])

    return {data, error, isLoading}
}

export const useAsyncCallback = <Args extends unknown[], Ret>(
    fn: (...args: Args) => Promise<Ret>
) => {
    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState<Ret | undefined>(undefined)
    const [error, setError] = useState<Error | undefined>(undefined)
    const result: ActionResponse<Args, Ret> = {
        data,
        error,
        isLoading,
        execute: (...arg) => {
            setIsLoading(true)
            fn(...arg)
                .then((data) => setData(data))
                .catch((error: Error) => setError(error))
                .finally(() => setIsLoading(false))
        }
    }
    return result
}
