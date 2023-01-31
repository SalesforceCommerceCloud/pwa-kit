/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQuery as useReactQuery, UseQueryOptions, QueryKey} from '@tanstack/react-query'
import {useAuthorizationHeader} from './useAuthorizationHeader'
import {ApiClients} from './types'
import {hasAllKeys} from './utils'

export const useQuery = <
    ApiArg extends {headers?: Record<string, string>; parameters?: Record<string, unknown>},
    Client extends ApiClients[keyof ApiClients],
    Data,
    Err,
    QK extends QueryKey
>(
    apiOptions: ApiArg,
    queryOptions: UseQueryOptions<Data, Err, Data, QK> & {queryKey: QK},
    hookConfig: {
        client: Client
        method: (arg: ApiArg) => Promise<Data>
        requiredParameters: ReadonlyArray<keyof ApiArg['parameters']>
        enabled?: boolean
    }
) => {
    const parameters = {
        ...hookConfig.client.clientConfig.parameters,
        ...apiOptions.parameters
    }
    return useReactQuery<Data, Err, Data, QK>(
        queryOptions.queryKey,
        useAuthorizationHeader(hookConfig.method, apiOptions),
        {
            enabled:
                hookConfig.enabled !== false &&
                hasAllKeys(parameters, hookConfig.requiredParameters),
            ...queryOptions
        }
    )
}
