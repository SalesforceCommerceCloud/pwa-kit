/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMutation as useReactQueryMutataion} from '@tanstack/react-query'
import {useQuery, UseQueryOptions} from '@tanstack/react-query'
import useAuth from './useAuth'
import useCommerceApi from './useCommerceApi'
import {ApiClients} from './types'

interface Client {
    clientConfig: {
        headers: Record<string, string>
    }
}

type MutationFunction<TData = unknown, TVariables = unknown> = (
    variables: TVariables,
    apiClients: ApiClients
) => Promise<TData>

function useAuthenticatedRequest<TData, TVariables>(fn: MutationFunction<TData, TVariables>) {
    const auth = useAuth()
    const apiClients = (useCommerceApi() as unknown) as Record<string, Client>

    return (variables: TVariables) => {
        return auth
            .ready()
            .then(({access_token}) => {
                Object.keys(apiClients).forEach((client) => {
                    apiClients[client].clientConfig.headers = {
                        ...apiClients[client].clientConfig.headers,
                        Authorization: `Bearer ${access_token}`
                    }
                })
                return (apiClients as unknown) as ApiClients
            })
            .then((apiClients) => fn(variables, apiClients))
    }
}

export default useAuthenticatedRequest
