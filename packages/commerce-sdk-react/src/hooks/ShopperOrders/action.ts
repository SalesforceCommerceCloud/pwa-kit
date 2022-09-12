/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, DataType, ScapiActionResponse} from '../types'
import {useAsyncCallback} from '../useAsync'
import useCommerceApi from '../useCommerceApi'

type Client = ApiClients['shopperOrders']

export enum ShopperOrdersActions {
    /**
     * Submits an order based on a prepared basket. The only considered value from the request body is basketId.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=createOrder} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#createorder} for more information on the parameters and returned data type.
     */
    CreateOrder = 'createOrder',
    /**
   * Adds a payment instrument to an order. 

Details:

The payment instrument is added with the provided details. The payment method must be applicable for the order see GET
/baskets/\{basketId\}/payment-methods, if the payment method is 'CREDIT_CARD' a paymentCard must be specified in the request.
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=createPaymentInstrumentForOrder} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#createpaymentinstrumentfororder} for more information on the parameters and returned data type.
   */
    CreatePaymentInstrumentForOrder = 'createPaymentInstrumentForOrder',
    /**
     * Removes a payment instrument of an order.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=removePaymentInstrumentFromOrder} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#removepaymentinstrumentfromorder} for more information on the parameters and returned data type.
     */
    RemovePaymentInstrumentFromOrder = 'removePaymentInstrumentFromOrder',
    /**
   * Updates a payment instrument of an order.

Details:

The payment instrument is updated with the provided details. The payment method must be applicable for the
order see GET /baskets/\{basketId\}/payment-methods, if the payment method is 'CREDIT_CARD' a
paymentCard must be specified in the request.
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=updatePaymentInstrumentForOrder} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#updatepaymentinstrumentfororder} for more information on the parameters and returned data type.
   */
    UpdatePaymentInstrumentForOrder = 'updatePaymentInstrumentForOrder',
}

/**
 * A hook for performing actions with the Shopper Orders API.
 */
// TODO: Why does prettier not like "extends `${Actions}`"?
// eslint-disable-next-line prettier/prettier
export function useShopperOrdersAction<Action extends `${ShopperOrdersActions}`>(
    action: Action
): ScapiActionResponse<Parameters<Client[Action]>, DataType<Client[Action]>, Action> {
    type Args = Parameters<Client[Action]>
    type Data = DataType<Client[Action]>
    // Directly calling `client[action](arg)` doesn't work, because the methods don't fully
    // overlap. Adding in this type assertion fixes that, but I don't understand why. I'm fairly
    // confident, though, that it is safe, because it seems like we're mostly re-defining what we
    // already have.
    // In addition to the assertion required to get this to work, I have also simplified the
    // overloaded SDK method to a single signature that just returns the data type. This makes it
    // easier to work with when passing to other mapped types.
    function assertMethod(fn: unknown): asserts fn is (args: Args) => Promise<Data> {
        if (typeof fn !== 'function') throw new Error(`Unknown action: ${action}`)
    }
    const {shopperOrders: client} = useCommerceApi()
    const method = client[action]
    assertMethod(method)

    const hook = useAsyncCallback((...args: Args) => method.call(client, args))
    // TypeScript loses information when using a computed property name - it assumes `string`, but
    // we know it's `Action`. This type assertion just restores that lost information.
    const namedAction = {[action]: hook.execute} as Record<Action, typeof hook.execute>
    return {...hook, ...namedAction}
}
