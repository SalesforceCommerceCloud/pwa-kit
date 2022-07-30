/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState, useEffect} from 'react'
import {ActionResponse, QueryResponse} from './types'

export const useAsync = <T>(fn: () => Promise<T>, deps?: unknown[]): QueryResponse<T> => {
    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState<T | undefined>(undefined)
    const [error, setError] = useState<Error | undefined>(undefined)
    const result: QueryResponse<T> = {
        data,
        error,
        isLoading,
    }

    useEffect(() => {
        setIsLoading(true)
        fn()
            .then((data) => {
                setData(data)
            })
            .catch((error: Error) => {
                console.error(error)
                setError(error)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [])

    return result
}

export const useAsyncCallback = <A extends any[], R>(fn: (...args: A) => Promise<R>) => {
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
                    console.error(error)
                    setError(error)
                })
                .finally(() => {
                    setIsLoading(false)
                })
        },
    }
    return result
}
