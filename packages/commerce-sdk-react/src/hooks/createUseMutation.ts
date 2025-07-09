/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, ApiMethod, Argument, DataType, CacheUpdateGetter} from './types'
import useCommerceApi from './useCommerceApi'
import {useMutation} from './useMutation'

/**
 * Type to identify client methods that are functions
 */
export type MethodsOf<C> = {
    [K in keyof C]: C[K] extends ApiMethod<any, any> ? K : never
}[keyof C]

/**
 * Helper to ensure a method is an ApiMethod
 */
type EnsureApiMethod<T> = T extends ApiMethod<any, any> ? T : never

/**
 * Options for creating a typed mutation hook for a specific API client
 */
export interface CreateUseMutationOptions<
    ClientKey extends keyof ApiClients,
    Mutation extends MethodsOf<ApiClients[ClientKey]>
> {
    /** The client key in ApiClients (e.g. 'shopperSearch', 'shopperProducts') */
    clientKey: ClientKey
    /** Function to get the cache updates matrix for the mutation */
    getCacheUpdates: (mutation: Mutation) => CacheUpdateGetter<any, any> | undefined
}

/**
 * Creates a mutation hook for a specific API client.
 */
export function createUseMutation<
    ClientKey extends keyof ApiClients,
    Mutation extends MethodsOf<ApiClients[ClientKey]>
>({clientKey, getCacheUpdates}: CreateUseMutationOptions<ClientKey, Mutation>) {
    return function useMutationHook<M extends Mutation>(mutation: M) {
        const commerceApi = useCommerceApi()
        const client = commerceApi[clientKey]
        const method = (client[mutation] as EnsureApiMethod<ApiClients[ClientKey][M]>).bind(client)
        type MutateArgument = Argument<EnsureApiMethod<ApiClients[ClientKey][M]>>
        type MutateData = DataType<EnsureApiMethod<ApiClients[ClientKey][M]>>
        return useMutation<ApiClients[ClientKey], MutateArgument, MutateData>({
            client,
            method,
            getCacheUpdates: (customerId, options, data) => {
                const updates = getCacheUpdates(mutation)
                const DEFAULT_CACHE_UPDATES = {update: [], invalidate: [], remove: [], clear: false}
                return updates ? updates(customerId, options, data) : DEFAULT_CACHE_UPDATES
            }
        })
    }
}
