/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {DataType, Argument, ApiClients} from '../types'
import {useMutation} from '../useMutation'
import {MutationFunction, UseMutationResult, useQueryClient} from '@tanstack/react-query'
import {updateCache, CacheUpdateMatrixElement, Client, NotImplementedError} from '../utils'

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

export const shopperOrdersCacheUpdateMatrix = {
    createOrder: (
        params: Argument<Client['createOrder']>,
        response: DataType<Client['createOrder']>
    ): CacheUpdateMatrixElement => {
        const customerId = response?.customerInfo?.customerId
        return {
            update: [{name: 'order', key: ['/orders', {orderNo: response.orderNo}]}],
            invalidate: [{name: 'customerBaskets', key: ['/customers', customerId, '/baskets']}]
        }
    },
    createPaymentInstrumentForOrder: (
        params: Argument<Client['createPaymentInstrumentForOrder']>,
        response: DataType<Client['createPaymentInstrumentForOrder']>
    ): CacheUpdateMatrixElement => {
        return {}
    },
    removePaymentInstrumentFromOrder: (
        params: Argument<Client['removePaymentInstrumentFromOrder']>,
        response: DataType<Client['removePaymentInstrumentFromOrder']>
    ): CacheUpdateMatrixElement => {
        return {}
    },
    updatePaymentInstrumentForOrder: (
        params: Argument<Client['updatePaymentInstrumentForOrder']>,
        response: DataType<Client['updatePaymentInstrumentForOrder']>
    ): CacheUpdateMatrixElement => {
        return {}
    }
}

export const SHOPPER_ORDERS_NOT_IMPLEMENTED = [
    'CreatePaymentInstrumentForOrder',
    'RemovePaymentInstrumentFromOrder',
    'UpdatePaymentInstrumentForOrder'
]

export type ShopperOrdersMutationType = typeof ShopperOrdersMutations[keyof typeof ShopperOrdersMutations]

type UseShopperOrdersMutationHeaders = NonNullable<Argument<Client['createOrder']>>['headers']
type UseShopperOrdersMutationArg = {
    headers?: UseShopperOrdersMutationHeaders
    rawResponse?: boolean
    action: ShopperOrdersMutationType
}

type ShopperOrdersClient = ApiClients['shopperOrders']

/**
 * A hook for performing mutations with the Shopper Orders API.
 */

function useShopperOrdersMutation<Action extends ShopperOrdersMutationType>(
    arg: UseShopperOrdersMutationArg
): UseMutationResult<
    DataType<ShopperOrdersClient[Action]> | Response,
    Error,
    Argument<ShopperOrdersClient[Action]>
> {
    const {headers, rawResponse, action} = arg

    if (SHOPPER_ORDERS_NOT_IMPLEMENTED.includes(action)) {
        NotImplementedError()
    }
    type Params = Argument<ShopperOrdersClient[Action]>
    type Data = DataType<ShopperOrdersClient[Action]>
    const queryClient = useQueryClient()

    return useMutation<Data, Error, Params>(
        (params, apiClients) => {
            const method = apiClients['shopperOrders'][action] as MutationFunction<Data, Params>
            return (method.call as (
                apiClient: ShopperOrdersClient,
                params: Params,
                rawResponse: boolean | undefined
            ) => any)(apiClients['shopperOrders'], {...params, headers}, rawResponse)
        },
        {
            onSuccess: (data, params) => {
                updateCache(queryClient, action, shopperOrdersCacheUpdateMatrix, data, params)
            }
        }
    )
}

export {useShopperOrdersMutation}
