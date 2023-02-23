/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, CacheUpdateMatrix, CacheUpdateUpdate, CacheUpdateInvalidate} from '../types'
import {and, matchesApiConfig, matchesPath} from '../utils'

type Client = ApiClients['shopperOrders']

const basePath = (parameters: Client['clientConfig']['parameters']) => [
    '/organizations/',
    parameters.organizationId
]

/** Logs a warning to console (on startup) and returns nothing (method is unimplemented). */
const TODO = (method: keyof Client) => {
    console.warn(`Cache logic for '${method}' is not yet implemented.`)
    return undefined
}

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    createOrder(customerId, {parameters}, response) {
        const update: CacheUpdateUpdate<unknown>[] = !response.orderNo
            ? []
            : [
                  {
                      queryKey: [
                          ...basePath(parameters),
                          '/orders/',
                          response.orderNo,
                          {...parameters, orderNo: response.orderNo}
                      ]
                  }
              ]

        const invalidate: CacheUpdateInvalidate[] = !customerId
            ? []
            : [
                  and(
                      matchesApiConfig(parameters),
                      matchesPath([...basePath(parameters), '/customers/', customerId, '/baskets'])
                  )
              ]

        return {update, invalidate}
    },
    createPaymentInstrumentForOrder: TODO('createPaymentInstrumentForOrder'),
    removePaymentInstrumentFromOrder: TODO('removePaymentInstrumentFromOrder'),
    updatePaymentInstrumentForOrder: TODO('updatePaymentInstrumentForOrder')
}
