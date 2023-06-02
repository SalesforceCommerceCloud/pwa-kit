/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, ApiMethod, Argument, CacheUpdateGetter, DataType, MergedOptions} from '../types'
import {useMutation} from '../useMutation'
import {UseMutationResult} from '@tanstack/react-query'
import {NotImplementedError} from '../utils'
import useCommerceApi from '../useCommerceApi'
import {cacheUpdateMatrix} from './cache'

type Client = ApiClients['shopperOrders']

/**
 * Mutations available for Shopper Orders
 * @group ShopperOrders
 * @category Mutation
 * @enum
 */
export const ShopperOrdersMutations = {
    /**
     * Submits an order based on a prepared basket. The only considered value from the request body is basketId.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Orders `createOrder` endpoint.
     */
    CreateOrder: 'createOrder',
    /**
   * Adds a payment instrument to an order. 

Details:

The payment instrument is added with the provided details. The payment method must be applicable for the order see GET
/baskets/\{basketId\}/payment-methods, if the payment method is 'CREDIT_CARD' a paymentCard must be specified in the request.
   * @returns A TanStack Query mutation hook for interacting with the Shopper Orders `createPaymentInstrumentForOrder` endpoint.
   */
    CreatePaymentInstrumentForOrder: 'createPaymentInstrumentForOrder',
    /**
     * Removes a payment instrument of an order.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Orders `removePaymentInstrumentFromOrder` endpoint.
     */
    RemovePaymentInstrumentFromOrder: 'removePaymentInstrumentFromOrder',
    /**
     * Updates a payment instrument of an order.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Orders `updatePaymentInstrumentForOrder` endpoint.
     */
    UpdatePaymentInstrumentForOrder: 'updatePaymentInstrumentForOrder'
} as const

/**
 * Mutation for Shopper Orders.
 * @group ShopperOrders
 * @category Mutation
 */
export type ShopperOrdersMutation =
    (typeof ShopperOrdersMutations)[keyof typeof ShopperOrdersMutations]

/**
 * Mutation hook for Shopper Orders.
 * @group ShopperOrders
 * @category Mutation
 */
export function useShopperOrdersMutation<Mutation extends ShopperOrdersMutation>(
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
    const {shopperOrders: client} = useCommerceApi()
    type Options = Argument<Client[Mutation]>
    type Data = DataType<Client[Mutation]>
    return useMutation({
        client,
        method: (opts: Options) => (client[mutation] as ApiMethod<Options, Data>)(opts),
        getCacheUpdates: getCacheUpdates as CacheUpdateGetter<MergedOptions<Client, Options>, Data>
    })
}
