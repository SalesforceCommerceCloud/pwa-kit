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

/**
 * Helper for query hooks, contains most of the logic in order to keep individual hooks small.
 * @param apiOptions - Options passed through to commerce-sdk-isomorphic
 * @param queryOptions - Options passed through to @tanstack/react-query
 * @param hookConfig - Config values that vary per API endpoint
 * @internal
 */
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
        requiredParameters: ReadonlyArray<keyof MergedOptions<Client, Options>['parameters']>
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
                // Individual hooks can provide `enabled` checks that are done in ADDITION to
                // the required parameter check
                hookConfig.enabled !== false &&
                hasAllKeys(netOptions.parameters, hookConfig.requiredParameters),
            // End users can always completely OVERRIDE the default `enabled` check
            ...queryOptions
        }
    )
}
