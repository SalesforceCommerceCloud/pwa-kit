/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getCustomerBaskets} from '../ShopperCustomers/queryKeyHelpers'
import {ApiClients, CacheUpdateMatrix, CacheUpdateUpdate, CacheUpdateInvalidate} from '../types'
import {getOrder} from './queryKeyHelpers'

type Client = ApiClients['shopperOrders']

/** Logs a warning to console (on startup) and returns nothing (method is unimplemented). */
const TODO = (method: keyof Client) => {
    console.warn(`Cache logic for '${method}' is not yet implemented.`)
    return undefined
}

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
    createPaymentInstrumentForOrder: TODO('createPaymentInstrumentForOrder'),
    removePaymentInstrumentFromOrder: TODO('removePaymentInstrumentFromOrder'),
    updatePaymentInstrumentForOrder: TODO('updatePaymentInstrumentForOrder')
}
