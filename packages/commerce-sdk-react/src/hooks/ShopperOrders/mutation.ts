/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {DataType, Argument} from '../types'
import {useMutation} from '../useMutation'
import {MutationFunction, useQueryClient} from '@tanstack/react-query'
import {updateCache, QueryKeysMatrixElement, Client} from '../utils'

export const ShopperOrdersMutations = {
    /**
     * Submits an order based on a prepared basket. The only considered value from the request body is basketId.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=createOrder} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#createorder} for more information on the parameters and returned data type.
     */
    CreateOrder: 'createOrder'

    // Payment instrument API call is not implemented yet in PWA kit.
    // Reference: https://github.com/SalesforceCommerceCloud/pwa-kit/blob/59d39976567c82baa9f9d393f1ac274c397b4c44/packages/commerce-sdk-react/src/hooks/ShopperOrders/mutation.ts#L23-L49
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
    }
}

/**
 * A hook for performing mutations with the Shopper Orders API.
 */
export function useShopperOrdersMutation<Action extends ShopperOrdersMutationType>(action: Action) {
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
