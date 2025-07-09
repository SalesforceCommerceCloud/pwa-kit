/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients} from '../types'
import {createUseMutation, MethodsOf} from '../createUseMutation'
import {cacheUpdateMatrix} from './cache'

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

export type ShopperOrdersMutation = MethodsOf<ApiClients['shopperOrders']>

/**
 * Mutation hook for Shopper Orders.
 * @group ShopperOrders
 * @category Mutation
 */
export const useShopperOrdersMutation = createUseMutation<'shopperOrders', ShopperOrdersMutation>({
    clientKey: 'shopperOrders',
    getCacheUpdates: (mutation) => cacheUpdateMatrix[mutation]
})
