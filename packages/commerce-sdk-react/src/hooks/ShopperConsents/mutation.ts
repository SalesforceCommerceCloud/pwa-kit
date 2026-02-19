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

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_CONSENTS
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

/**
 * Mutations available for Shopper Consents.
 * @group ShopperConsents
 * @category Mutation
 * @enum
 */
export const ShopperConsentsMutations = {
    /**
     * Updates the customer's consent subscription for a specific channel.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Consents `updateSubscription` endpoint.
     */
    UpdateSubscription: 'updateSubscription',
    /**
     * Updates multiple customer consent subscriptions.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Consents `updateSubscriptions` endpoint.
     */
    UpdateSubscriptions: 'updateSubscriptions'
} as const

/**
 * Mutation for Shopper Consents.
 * @group ShopperConsents
 * @category Mutation
 */
export type ShopperConsentsMutation =
    (typeof ShopperConsentsMutations)[keyof typeof ShopperConsentsMutations]

/**
 * Mutation hook for Shopper Consents.
 * @group ShopperConsents
 * @category Mutation
 */
export function useShopperConsentsMutation<Mutation extends ShopperConsentsMutation>(
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
