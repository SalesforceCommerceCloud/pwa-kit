/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    useMutation as useReactQueryMutation,
    useQueryClient,
    UseMutationOptions,
    MutationFunction
} from '@tanstack/react-query'
import {helpers} from 'commerce-sdk-isomorphic'
import useAuthContext from './useAuthContext'
import useConfig from './useConfig'
import {
    ApiClient,
    ApiMethod,
    ApiOptions,
    CacheUpdateGetter,
    MergedOptions,
    OptionalCustomEndpointClientConfig,
    TMutationVariables
} from './types'
import {useAuthorizationHeader} from './useAuthorizationHeader'
import useCustomerId from './useCustomerId'
import {mergeOptions, updateCache} from './utils'
import {handleInvalidToken, generateCustomEndpointOptions} from './helpers'

/**
 * Helper for mutation hooks, contains most of the logic in order to keep individual hooks small.
 * @param hookConfig - Config values that vary per API endpoint
 * @internal
 */
export const useMutation = <
    Client extends ApiClient,
    Options extends ApiOptions,
    Data
>(hookConfig: {
    client: Client
    method: ApiMethod<Options, Data>
    getCacheUpdates: CacheUpdateGetter<MergedOptions<Client, Options>, Data>
}) => {
    const queryClient = useQueryClient()
    const customerId = useCustomerId()
    const authenticatedMethod = useAuthorizationHeader(hookConfig.method)

    return useReactQueryMutation(authenticatedMethod, {
        onSuccess(data, options) {
            // commerce-sdk-isomorphic merges `clientConfig` and `options` under the hood,
            // so we also need to do that to get the "net" options that are actually sent to SCAPI.
            const netOptions = mergeOptions(hookConfig.client, options)
            const cacheUpdates = hookConfig.getCacheUpdates(customerId, netOptions, data)
            updateCache(queryClient, cacheUpdates, data)
        }
    })
}

/**
 * A hook for SCAPI custom endpoint mutations.
 *
 * Besides calling custom endpoint, this hook does a few things for better DX.
 * 1. inject access token
 * 2. merge SCAPI client configurations from the CommerceApiProvider
 * @param apiOptions - Options passed through to commerce-sdk-isomorphic
 * @param mutationOptions - Options passed through to @tanstack/react-query
 * @returns A TanStack Query mutation hook with data from the custom API endpoint.
 */
export const useCustomMutation = <TData = unknown, TError = unknown>(
    apiOptions: OptionalCustomEndpointClientConfig,
    mutationOptions?: UseMutationOptions<TData, TError, TMutationVariables>
) => {
    const auth = useAuthContext()
    const globalConfig = useConfig()
    const logger = globalConfig.logger || console

    const createMutationFnWithAuth = (): MutationFunction<TData, TMutationVariables> => {
        return async (args): Promise<TData> => {
            const {access_token} = await auth.ready()
            return (await helpers
                .callCustomEndpoint(
                    generateCustomEndpointOptions(apiOptions, globalConfig, access_token, args)
                )
                .catch(async (error) => {
                    const {access_token} = await handleInvalidToken(error, auth, logger)
                    return await helpers.callCustomEndpoint(
                        generateCustomEndpointOptions(apiOptions, globalConfig, access_token, args)
                    )
                })) as TData
        }
    }

    return useReactQueryMutation<TData, TError, TMutationVariables, unknown>(
        createMutationFnWithAuth(),
        mutationOptions
    )
}
