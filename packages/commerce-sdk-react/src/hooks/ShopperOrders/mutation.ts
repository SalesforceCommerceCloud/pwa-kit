/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, DataType, Argument} from '../types'
import {useMutation} from '../useMutation'
import {MutationFunction, useQueryClient} from '@tanstack/react-query'
import {updateCache, QueryKeysMatrixElement} from '../utils'

type Client = ApiClients['shopperOrders']

export const ShopperOrdersMutations = {
    /**
     * Submits an order based on a prepared basket. The only considered value from the request body is basketId.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=createOrder} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#createorder} for more information on the parameters and returned data type.
     */
    CreateOrder: 'createOrder'
} as const

export type ShopperOrdersMutationType = typeof ShopperOrdersMutations[keyof typeof ShopperOrdersMutations]

export const queryKeysMatrix = {
    createOrder: (
        data: DataType<Client['createOrder']>,
        params: Argument<Client['createOrder']>
    ): QueryKeysMatrixElement => {
        const customerId = data?.customerInfo?.customerId
        const {orderNo} = params.body
        return {
            update: [['/orders', orderNo]],
            invalidate: [['/customers', customerId, '/baskets', {customerId}]]
        }
    }
}

/**
 * A hook for performing mutations with the Shopper Gift Certificates API.
 */
export function useShopperOrdersMutation<Action extends ShopperOrdersMutationType>(action: Action) {
    type Params = Argument<Client[Action]>
    type Data = DataType<Client[Action]>
    const queryClient = useQueryClient()
    return useMutation<Data, Error, Params>((params, apiClients) => {
        const method = apiClients['shopperOrders'][action] as MutationFunction<Data, Params>
        return method.call(apiClients['shopperOrders'], params)
    },
    {
        onSuccess: (data, params) => {
            updateCache(queryClient, action, queryKeysMatrix, data, params)
        }
    })
}