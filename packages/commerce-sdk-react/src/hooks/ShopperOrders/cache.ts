/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getCustomerBaskets} from '../ShopperCustomers/queryKeyHelpers'
import {
    ApiClients,
    Argument,
    CacheUpdateMatrix,
    CacheUpdate,
    CacheUpdateUpdate,
    CacheUpdateInvalidate,
    MergedOptions
} from '../types'
import {getOrder} from './queryKeyHelpers'

type Client = ApiClients['shopperOrders']
/** Parameters that get passed around, includes client config and possible parameters from other endpoints */
type GetOrderParameters = MergedOptions<Client, Argument<Client['getOrder']>>['parameters']

const updateOrderQuery = (
    customerId: string | null,
    {parameters}: {parameters: GetOrderParameters}
): CacheUpdate => ({
    update: [{queryKey: getOrder.queryKey(parameters)}]
})

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    createOrder(customerId, {parameters}, response) {
        const {orderNo} = response
        const update: CacheUpdateUpdate<unknown>[] = !orderNo
            ? []
            : [
                  {
                      queryKey: getOrder.queryKey({...parameters, orderNo})
                  }
              ]
        const invalidate: CacheUpdateInvalidate[] = !customerId
            ? []
            : [{queryKey: getCustomerBaskets.queryKey({...parameters, customerId})}]
        return {update, invalidate}
    },
    createPaymentInstrumentForOrder: updateOrderQuery,
    updatePaymentInstrumentForOrder: updateOrderQuery,
    removePaymentInstrumentFromOrder: updateOrderQuery
}
