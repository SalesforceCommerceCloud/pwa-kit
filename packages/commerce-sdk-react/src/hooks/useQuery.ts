/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQuery as useReactQuery, UseQueryOptions, QueryKey} from '@tanstack/react-query'
import {useAuthorizationHeader} from './useAuthorizationHeader'
import {ApiClient, ApiMethod, ApiOptions, MergedOptions} from './types'
import {hasAllKeys, mergeOptions} from './utils'

export const useQuery = <
    Client extends ApiClient,
    Options extends Omit<ApiOptions, 'body'>,
    Data,
    Err,
    QK extends QueryKey
>(
    apiOptions: Options,
    queryOptions: UseQueryOptions<Data, Err, Data, QK>,
    hookConfig: {
        client: Client
        method: ApiMethod<Options, Data>
        getQueryKey: (options: MergedOptions<Client, Options>) => QK
        requiredParameters: ReadonlyArray<keyof Options['parameters']>
        enabled?: boolean
    }
) => {
    const netOptions = mergeOptions(hookConfig.client, apiOptions)
    const authenticatedMethod = useAuthorizationHeader(hookConfig.method)
    return useReactQuery(
        // End user can override queryKey if they really want to...
        queryOptions.queryKey ?? hookConfig.getQueryKey(netOptions),
        () => authenticatedMethod(apiOptions),
        {
            enabled:
                hookConfig.enabled !== false &&
                hasAllKeys(netOptions.parameters, hookConfig.requiredParameters),
            ...queryOptions
        }
    )
}
