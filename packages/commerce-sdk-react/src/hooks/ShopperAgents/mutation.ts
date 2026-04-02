/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, ApiMethod, Argument, CacheUpdateGetter, DataType, MergedOptions} from '../types'
import {useMutation} from '../useMutation'
import {UseMutationResult} from '@tanstack/react-query'
import {NotImplementedError} from '../utils'
import {cacheUpdateMatrix} from './cache'
import {CLIENT_KEYS} from '../../constant'
import useCommerceApi from '../useCommerceApi'

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_AGENTS
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

/**
 * Mutations available for Shopper Agents
 * @group ShopperAgents
 * @category Mutation
 * @enum
 */
export const ShopperAgentsMutations = {
    /**
     * Initializes an Agentforce session. The request body must include the sessionInitKey field.
     * Missing or invalid sessionInitKey information results in INVALID_REQUEST_PARAMETERS (400).
     * @returns A TanStack Query mutation hook for interacting with the Shopper Agents `postSessionInit` endpoint.
     */
    PostSessionInit: 'postSessionInit'
} as const

/**
 * Mutation for Shopper Agents.
 * @group ShopperAgents
 * @category Mutation
 */
export type ShopperAgentsMutation =
    (typeof ShopperAgentsMutations)[keyof typeof ShopperAgentsMutations]

/**
 * Mutation hook for Shopper Agents.
 * @group ShopperAgents
 * @category Mutation
 */
export function useShopperAgentsMutation<Mutation extends ShopperAgentsMutation>(
    mutation: Mutation
): UseMutationResult<DataType<Client[Mutation]>, unknown, Argument<Client[Mutation]>> {
    const getCacheUpdates = cacheUpdateMatrix[mutation]
    // TODO: Remove this check when all mutations are implemented.
    if (!getCacheUpdates) throw new NotImplementedError(`The '${mutation}' mutation`)
    // The `Options` and `Data` types for each mutation are similar, but distinct, and the union
    // type generated from `Client[Mutation]` seems to be too complex for TypeScript to handle.
    // I'm not sure if there's a way to avoid the type assertions in here for the methods that
    // use them. However, I'm fairly confident that they are safe to do, as they seem to be simply
    // re-asserting what we already have.
    const client = useCommerceApi(CLIENT_KEY)
    type Options = Argument<Client[Mutation]>
    type Data = DataType<Client[Mutation]>
    return useMutation({
        client,
        method: (opts: Options) => (client[mutation] as ApiMethod<Options, Data>)(opts),
        getCacheUpdates: getCacheUpdates as unknown as CacheUpdateGetter<
            MergedOptions<Client, Options>,
            Data
        >
    })
}
