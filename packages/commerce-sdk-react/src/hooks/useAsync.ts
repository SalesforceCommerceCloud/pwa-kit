/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState, useEffect} from 'react'
import useAuth from './useAuth'
import {ActionResponse, QueryResponse} from './types'

/**
 * This is a ultility hook that wraps around promises with data/error/loading react states.
 *
 * Important: it uses the Auth module to block calls until there is valid access token.
 *
 * @internal
 */
// TODO: implementation to be replaced by ReactQuery / SWR
export const useAsync = <T>(
    fn: (accessToken: string) => Promise<T>,
    deps?: unknown[]
): QueryResponse<T> => {
    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState<T | undefined>(undefined)
    const [error, setError] = useState<Error | undefined>(undefined)
    const auth = useAuth()
    const result: QueryResponse<T> = {
        data,
        error,
        isLoading,
    }

    useEffect(() => {
        setIsLoading(true)
        auth.ready()
            .then(({accessToken}) => {
                return accessToken
            })
            .then(fn)
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
        },
    }
    return result
}
