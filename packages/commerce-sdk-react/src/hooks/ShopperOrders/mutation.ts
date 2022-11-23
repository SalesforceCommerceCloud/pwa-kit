/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {DataType, Argument} from '../types'
import {useMutation} from '../useMutation'
import {MutationFunction, useQueryClient} from '@tanstack/react-query'
import {updateCache, QueryKeysMatrixElement, Client, NotImplemented} from '../utils'

export const ShopperOrdersMutations = {
    /**
     * Submits an order based on a prepared basket. The only considered value from the request body is basketId.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=createOrder} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#createorder} for more information on the parameters and returned data type.
     */
    CreateOrder: 'createOrder',
    /**
     * WARNING: This method is not implemented.
     *
     * Adds a payment instrument to an order.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=createPaymentInstrumentForOrder} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#createpaymentinstrumentfororder} for more information on the parameters and returned data type.
     */
    CreatePaymentInstrumentForOrder: 'createPaymentInstrumentForOrder',
    /**
     * WARNING: This method is not implemented.
     *
     * Removes a payment instrument of an order.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=removePaymentInstrumentFromOrder} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#removepaymentinstrumentfromorder} for more information on the parameters and returned data type.
     */
    RemovePaymentInstrumentFromOrder: 'removePaymentInstrumentFromOrder',
    /**
     * WARNING: This method is not implemented.
     *
     * Updates a payment instrument of an order.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=updatePaymentInstrumentForOrder} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#updatepaymentinstrumentfororder} for more information on the parameters and returned data type.
     */
    UpdatePaymentInstrumentForOrder: 'updatePaymentInstrumentForOrder'
} as const

export type ShopperOrdersMutationType = typeof ShopperOrdersMutations[keyof typeof ShopperOrdersMutations]

export const shopperOrdersQueryKeysMatrix = {
    createOrder: (
        params: Argument<Client['createOrder']>,
        response: DataType<Client['createOrder']>
    ): QueryKeysMatrixElement => {
        const customerId = response?.customerInfo?.customerId
        return {
            update: [['/orders', {orderNo: response.orderNo}]],
            invalidate: [['/customers', customerId, '/baskets']]
        }
    },
    createPaymentInstrumentForOrder: (
        params: Argument<Client['createPaymentInstrumentForOrder']>,
        response: DataType<Client['createPaymentInstrumentForOrder']>
    ): QueryKeysMatrixElement => {
        return {}
    },
    removePaymentInstrumentFromOrder: (
        params: Argument<Client['removePaymentInstrumentFromOrder']>,
        response: DataType<Client['removePaymentInstrumentFromOrder']>
    ): QueryKeysMatrixElement => {
        return {}
    },
    updatePaymentInstrumentForOrder: (
        params: Argument<Client['updatePaymentInstrumentForOrder']>,
        response: DataType<Client['updatePaymentInstrumentForOrder']>
    ): QueryKeysMatrixElement => {
        return {}
    }
}

export const NOT_IMPLEMENTED = [
    'CreatePaymentInstrumentForOrder',
    'RemovePaymentInstrumentFromOrder',
    'UpdatePaymentInstrumentForOrder'
]

/**
 * A hook for performing mutations with the Shopper Orders API.
 */
export function useShopperOrdersMutation<Action extends ShopperOrdersMutationType>(action: Action) {
    if (NOT_IMPLEMENTED.includes(action)) {
        NotImplemented()
    }
    type Params = Argument<Client[Action]>
    type Data = DataType<Client[Action]>
    const queryClient = useQueryClient()
    return useMutation<Data, Error, Params>(
        (params, apiClients) => {
            const method = apiClients['shopperOrders'][action] as MutationFunction<Data, Params>
            return method.call(apiClients['shopperOrders'], params)
        },
        {
            onSuccess: (data, params) => {
                updateCache(queryClient, action, shopperOrdersQueryKeysMatrix, data, params)
            }
        }
    )
}
