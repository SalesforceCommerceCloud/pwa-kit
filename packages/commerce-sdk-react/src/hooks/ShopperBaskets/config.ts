/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperBasketsTypes} from 'commerce-sdk-isomorphic'
import {ApiClients, CacheUpdateMatrix} from '../types'
import {CacheUpdate} from '../types'

const updateBasketQuery = (basketId?: string): CacheUpdate => {
    // TODO: we're missing headers, rawResponse -> not only {basketId}
    const arg = {basketId}
    return basketId
        ? {
              update: [['/baskets', basketId, arg]]
          }
        : {}
}

const removeBasketQuery = (basketId?: string): CacheUpdate => {
    const arg = {basketId}
    return basketId
        ? {
              remove: [['/baskets', basketId, arg]]
          }
        : {}
}

const invalidateCustomerBasketsQuery = (customerId: string | null): CacheUpdate => {
    // TODO: should we use arg here or not? The invalidate method does not need exact query key.
    const arg = {customerId}
    return customerId
        ? {
              invalidate: [['/customers', customerId, '/baskets', arg]]
          }
        : {}
}

const updateBasketFromRequest = (
    customerId: string | null,
    params: {
        parameters: ShopperBasketsTypes.Basket
    }
): CacheUpdate => ({
    ...updateBasketQuery(params.parameters.basketId),
    ...invalidateCustomerBasketsQuery(customerId)
})

const updateBasketFromResponse = (
    customerId: string | null,
    params: unknown, // not used,
    response: ShopperBasketsTypes.Basket
): CacheUpdate => ({
    ...updateBasketQuery(response.basketId),
    ...invalidateCustomerBasketsQuery(customerId)
})

export const cacheUpdateMatrix: CacheUpdateMatrix<ApiClients['shopperBaskets']> = {
    addCouponToBasket: updateBasketFromRequest,
    addItemToBasket: updateBasketFromRequest,
    removeItemFromBasket: updateBasketFromRequest,
    addPaymentInstrumentToBasket: updateBasketFromRequest,
    createBasket: updateBasketFromResponse, // Response!
    deleteBasket: (customerId, params): CacheUpdate => ({
        ...invalidateCustomerBasketsQuery(customerId),
        ...removeBasketQuery(params.parameters.basketId)
    }),
    mergeBasket: updateBasketFromResponse, // Response!
    removeCouponFromBasket: updateBasketFromRequest,
    removePaymentInstrumentFromBasket: updateBasketFromRequest,
    updateBasket: updateBasketFromRequest,
    updateBillingAddressForBasket: updateBasketFromRequest,
    updateCustomerForBasket: updateBasketFromRequest,
    updateItemInBasket: updateBasketFromRequest,
    updatePaymentInstrumentInBasket: updateBasketFromRequest,
    updateShippingAddressForShipment: updateBasketFromRequest,
    updateShippingMethodForShipment: updateBasketFromRequest
}
