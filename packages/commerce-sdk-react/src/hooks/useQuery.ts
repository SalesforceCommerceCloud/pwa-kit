/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQuery as useReactQuery} from '@tanstack/react-query'
import {useAuthorizationHeader} from './useAuthorizationHeader'
import {ApiMethod, ApiOptions, ApiQueryKey, ApiQueryOptions, RequireKeys} from './types'
import {hasAllKeys} from './utils'

/**
 * Helper for query hooks, contains most of the logic in order to keep individual hooks small.
 * @param apiOptions - Options passed through to commerce-sdk-isomorphic
 * @param queryOptions - Options passed through to @tanstack/react-query
 * @param hookConfig - Config values that vary per API endpoint
 * @internal
 */
export const useQuery = <Options extends RequireKeys<ApiOptions, 'parameters'>, Data>(
    apiOptions: Options,
    queryOptions: ApiQueryOptions<ApiMethod<Options, Data>>,
    hookConfig: {
        method: ApiMethod<Options, Data>
        queryKey: ApiQueryKey<Options['parameters']>
        requiredParameters: ReadonlyArray<keyof Options['parameters']>
        enabled?: boolean
    }
) => {
    const authenticatedMethod = useAuthorizationHeader(hookConfig.method)
    return useReactQuery(hookConfig.queryKey, () => authenticatedMethod(apiOptions), {
        enabled:
            // Individual hooks can provide `enabled` checks that are done in ADDITION to
            // the required parameter check
            hookConfig.enabled !== false &&
            hasAllKeys(apiOptions.parameters, hookConfig.requiredParameters),
        // End users can always completely OVERRIDE the default `enabled` check
        ...queryOptions
    })
}
