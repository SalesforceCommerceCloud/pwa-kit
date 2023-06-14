/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQuery as useReactQuery} from '@tanstack/react-query'
import {useAuthorizationHeader} from './useAuthorizationHeader'
import {
    ApiClient,
    ApiMethod,
    ApiOptions,
    ApiQueryKey,
    ApiQueryOptions,
    MergedOptions,
    NullableParameters,
    OmitNullableParameters
} from './types'
import {hasAllKeys} from './utils'
import {onClient} from '../utils'

/**
 * Helper for query hooks, contains most of the logic in order to keep individual hooks small.
 * @param apiOptions - Options passed through to commerce-sdk-isomorphic
 * @param queryOptions - Options passed through to @tanstack/react-query
 * @param hookConfig - Config values that vary per API endpoint
 * @internal
 */
export const useQuery = <Client extends ApiClient, Options extends ApiOptions, Data>(
    // `OmitNullableParameters<NullableParameters<...>>` has the net result of marking parameters
    // as optional if they are required in `Options` and NOT required in `Client`.
    apiOptions: OmitNullableParameters<NullableParameters<MergedOptions<Client, Options>>>,
    queryOptions: ApiQueryOptions<ApiMethod<Options, Data>>,
    hookConfig: {
        method: ApiMethod<Options, Data>
        queryKey: ApiQueryKey<Partial<Options['parameters']>>
        requiredParameters: ReadonlyArray<keyof NonNullable<Options['parameters']>>
        enabled?: boolean
    }
) => {
    const authenticatedMethod = useAuthorizationHeader(hookConfig.method)
    // This type assertion is NOT safe in all cases. However, we know that `requiredParameters` is
    // the list of parameters required by `Options`, and we know that in the default case (when
    // `queryOptions.enabled` is not set), we only execute the hook when `apiOptions` has all
    // required parameters. Therefore, we know that `apiOptions` satisfies `Options` in the default
    // case, so the type assertion is safe in the default case. We explicitly do NOT guarantee type
    // safety when `queryOptions.enabled` is set; when it is `true`, the callback may be called with
    // missing parameters. This will result in a runtime error. I think that this is an acceptable
    // trade-off, as the behavior is opt-in by the end user, and it feels like adding type safety
    // for this case would add significantly more complexity.
    const wrappedMethod = async () => await authenticatedMethod(apiOptions as Options)
    return useReactQuery(hookConfig.queryKey, wrappedMethod, {
        enabled:
            // Individual hooks can provide `enabled` checks that are done in ADDITION to
            // the required parameter check
            hookConfig.enabled !== false &&
            // The default `enabled` is "has all required parameters"
            hasAllKeys(apiOptions.parameters, hookConfig.requiredParameters),
        // End users can always completely OVERRIDE the default `enabled` check

        ...queryOptions,
        // never retry on server side because it hurts server side rendering performance
        ...(queryOptions?.retry ? {retry: onClient() ? queryOptions?.retry : false} : {}),
        ...(queryOptions?.retryOnMount
            ? {retryOnMount: onClient() ? queryOptions?.retryOnMount : false}
            : {})
    })
}
