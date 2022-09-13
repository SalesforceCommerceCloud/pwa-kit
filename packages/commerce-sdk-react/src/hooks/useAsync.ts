/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState} from 'react'
import useAuth from './useAuth'
import useCommerceApi from './useCommerceApi'
import {ActionResponse, ApiClients} from './types'
import {useQuery, UseQueryOptions} from '@tanstack/react-query'

interface Client {
    clientConfig: {
        headers: Record<string, string>
    }
}

export const useAsync = <T>(
    queryKey: unknown[],
    fn: (apiClients: ApiClients) => Promise<T>,
    queryOptions?: UseQueryOptions<T, Error>
) => {
    const auth = useAuth()
    // TODO: what's a better way to handle the types?
    const apiClients = (useCommerceApi() as unknown) as Record<string, Client>
    const authenticatedFn = () =>
        auth
            .ready()
            .then(({access_token}) => {
                const authenticatedClients = (Object.keys(apiClients).map((client) => {
                    ;(apiClients[client] as Client).clientConfig.headers = {
                        ...apiClients[client].clientConfig.headers,
                        Authorization: `Bearer ${access_token}`
                    }
                    return apiClients[client]
                }) as unknown) as ApiClients
                return authenticatedClients
            })
            .then(fn)
    return useQuery<T, Error>(queryKey, authenticatedFn, queryOptions)
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
