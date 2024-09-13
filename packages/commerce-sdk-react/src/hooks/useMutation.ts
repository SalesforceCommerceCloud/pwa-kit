/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    useMutation as useReactQueryMutation,
    useQueryClient,
    UseMutationOptions
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
    OptionalCustomEndpointClientConfig
} from './types'
import {useAuthorizationHeader} from './useAuthorizationHeader'
import useCustomerId from './useCustomerId'
import {mergeOptions, updateCache} from './utils'

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
export const useCustomMutation = (
    apiOptions: OptionalCustomEndpointClientConfig,
    mutationOptions?: UseMutationOptions
) => {
    const auth = useAuthContext()
    const config = useConfig()
    const clientHeaders = config.headers || {}
    const currentClientConfig = {
        parameters: {
            clientId: config.clientId,
            siteId: config.siteId,
            organizationId: config.organizationId,
            shortCode: config.organizationId
        },
        proxy: config.proxy
    }

    const callCustomEndpointWithAuth = (options: OptionalCustomEndpointClientConfig) => {
        return async () => {
            const clientConfig = options.clientConfig || {}
            const {access_token} = await auth.ready()
            return await helpers.callCustomEndpoint({
                ...options,
                options: {
                    ...options.options,
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        ...clientHeaders,
                        ...options.options?.headers
                    }
                },
                clientConfig: {
                    ...currentClientConfig,
                    ...clientConfig
                }
            })
        }
    }

    const callCustomEndpointWithBody = async (args: {
        body: unknown
        parameters?: {[key: string]: string | number | boolean | string[] | number[]}
        headers?: {[key: string]: string}
    }) => {
        const clientConfig = apiOptions.clientConfig || {}
        const {access_token} = await auth.ready()
        return await helpers.callCustomEndpoint({
            ...apiOptions,
            options: {
                ...apiOptions.options,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    ...clientHeaders,
                    ...apiOptions.options.headers,
                    ...args.headers
                },
                body: args.body,
                parameters: {
                    ...apiOptions.options.parameters,
                    ...args.parameters
                }
            },
            clientConfig: {
                ...currentClientConfig,
                ...clientConfig
            }
        })
    }

    if (!apiOptions?.options?.body) {
        // If users don't define a body when they use this hook, they can pass in a body later
        // when calling mutate() or mutateAsync()
        // this allows users to call the same endpoint with different arguments
        return useReactQueryMutation(callCustomEndpointWithBody)
    } else {
        // If users define a body when they use this hook, every time they call
        // mutate() or mutateAsync(), it will make the exactly the same call
        // with the same arguments to the provided endpoint
        return useReactQueryMutation(callCustomEndpointWithAuth(apiOptions), mutationOptions)
    }
}
