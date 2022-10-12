/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, DataType, Argument} from '../types'
import {useMutation} from '../useMutation'
import {MutationFunction} from '@tanstack/react-query'

type Client = ApiClients['shopperOrders']

export const ShopperOrdersMutations = {
    /**
     * Submits an order based on a prepared basket. The only considered value from the request body is basketId.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=createOrder} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#createorder} for more information on the parameters and returned data type.
     */
    CreateOrder: 'createOrder',
    /**
   * Adds a payment instrument to an order. 

Details:

The payment instrument is added with the provided details. The payment method must be applicable for the order see GET
/baskets/\{basketId\}/payment-methods, if the payment method is 'CREDIT_CARD' a paymentCard must be specified in the request.
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=createPaymentInstrumentForOrder} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#createpaymentinstrumentfororder} for more information on the parameters and returned data type.
   */
    CreatePaymentInstrumentForOrder: 'createPaymentInstrumentForOrder',
    /**
     * Removes a payment instrument of an order.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=removePaymentInstrumentFromOrder} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#removepaymentinstrumentfromorder} for more information on the parameters and returned data type.
     */
    RemovePaymentInstrumentFromOrder: 'removePaymentInstrumentFromOrder',
    /**
   * Updates a payment instrument of an order.

Details:

The payment instrument is updated with the provided details. The payment method must be applicable for the
order see GET /baskets/\{basketId\}/payment-methods, if the payment method is 'CREDIT_CARD' a
paymentCard must be specified in the request.
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=updatePaymentInstrumentForOrder} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#updatepaymentinstrumentfororder} for more information on the parameters and returned data type.
   */
    UpdatePaymentInstrumentForOrder: 'updatePaymentInstrumentForOrder'
} as const

type ShopperOrdersMutationType = typeof ShopperOrdersMutations[keyof typeof ShopperOrdersMutations]

/**
 * A hook for performing mutations with the Shopper Gift Certificates API.
 */
export function useShopperOrdersMutation<Action extends ShopperOrdersMutationType>(action: Action) {
    type Params = Argument<Client[Action]>
    type Data = DataType<Client[Action]>
    return useMutation<Data, Error, Params>((params, apiClients) => {
        const method = apiClients['shopperOrders'][action] as MutationFunction<Data, Params>
        return method.call(apiClients['shopperOrders'], params)
    })
}
