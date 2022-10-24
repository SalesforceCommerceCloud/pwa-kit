/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    QueryFunctionContext,
    QueryKey,
    QueryFunction,
    MutationFunction
} from '@tanstack/react-query'
import useAuth from './useAuth'
import useCommerceApi from './useCommerceApi'
import {ApiClients, IQueryFunction, IMutationFunction} from './types'

/**
 * This is a private method. It is a react hook that wraps queries / mutations with
 * authenticated API clients.
 *
 * @internal
 */
function useAuthenticatedClient<TData, TVariables = unknown>(
    fn: IMutationFunction<TData, TVariables>
): MutationFunction<TData, TVariables>
function useAuthenticatedClient<TData>(fn: IQueryFunction<TData>): QueryFunction<TData>
function useAuthenticatedClient<TData, TVariables = unknown>(
    fn: IQueryFunction<TData> | IMutationFunction<TData, TVariables>
) {
    const auth = useAuth()
    const apiClients = useCommerceApi()
    const apiClientKeys = Object.keys(apiClients) as Array<keyof ApiClients>
    return (variables: TVariables & QueryFunctionContext<QueryKey>) => {
        return auth
            .ready()
            .then(({access_token}) => {
                apiClientKeys.forEach((client) => {
                    apiClients[client].clientConfig.headers = {
                        ...apiClients[client].clientConfig.headers,
                        Authorization: `Bearer ${access_token}`
                    }
                })
                return apiClients
            })
            .then((apiClients) => fn(variables, apiClients))
    }
}

export default useAuthenticatedClient
