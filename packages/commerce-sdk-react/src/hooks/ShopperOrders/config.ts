/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, CacheUpdateMatrix, CacheUpdateUpdate, CacheUpdateInvalidate} from '../types'
import {and, matchesApiConfig, NotImplementedError, pathStartsWith} from '../utils'
import type {ShopperOrdersTypes} from 'commerce-sdk-isomorphic'

type Client = ApiClients['shopperOrders']
type Order = ShopperOrdersTypes.Order

const TODO = (method: keyof Client) => {
    throw new NotImplementedError(`Cache logic for '${method}'`)
}

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    createOrder(customerId, {parameters}, response) {
        const update: CacheUpdateUpdate<unknown>[] = []
        if (response.orderNo) {
            const updateOrder: CacheUpdateUpdate<Order> = {
                queryKey: [
                    '/organizations/',
                    parameters.organizationId,
                    '/orders/',
                    response.orderNo,
                    // TODO: These parameters are not guaranteed to match those sent to getOrder,
                    // how do we handle that?
                    {...parameters, orderNo: response.orderNo}
                ]
            }
            // TODO: This type assertion is so that we "forget" what type the updater uses.
            // Is there a way to avoid the assertion?
            update.push(updateOrder as CacheUpdateUpdate<unknown>)
        }

        const invalidate: CacheUpdateInvalidate[] = []
        if (customerId) {
            invalidate.push(
                and(
                    matchesApiConfig(parameters),
                    pathStartsWith([
                        '/organization/',
                        parameters.organizationId,
                        '/customers/',
                        customerId,
                        '/baskets'
                    ])
                )
            )
        }

        return {update, invalidate}
    },
    createPaymentInstrumentForOrder: TODO('createPaymentInstrumentForOrder'),
    removePaymentInstrumentFromOrder: TODO('removePaymentInstrumentFromOrder'),
    updatePaymentInstrumentForOrder: TODO('updatePaymentInstrumentForOrder')
}
