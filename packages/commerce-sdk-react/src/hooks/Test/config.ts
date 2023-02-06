/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperBasketsTypes} from 'commerce-sdk-isomorphic'
import {ApiClients, CacheUpdateMatrix} from '../types'
import {CacheUpdate} from '../types'

type Basket = ShopperBasketsTypes.Basket

const updateBasketQuery = (basketId?: string): Pick<CacheUpdate<Basket>, 'update'> => {
    // TODO: we're missing headers, rawResponse -> not only {basketId}
    const arg = {basketId}
    return basketId
        ? {
              update: [
                  {
                      queryKey: ['/baskets', basketId, arg],
                      updater: (basket) => basket // TODO
                  }
              ]
          }
        : {}
}

const removeBasketQuery = (basketId?: string): Pick<CacheUpdate<Basket>, 'remove'> => {
    const arg = {basketId}
    return basketId
        ? {
              remove: [{queryKey: ['/baskets', basketId, arg]}]
          }
        : {}
}

const invalidateCustomerBasketsQuery = (
    customerId: string | null
): Pick<CacheUpdate<Basket>, 'invalidate'> => {
    // TODO: should we use arg here or not? The invalidate method does not need exact query key.
    const arg = {customerId}
    return customerId
        ? {
              invalidate: [{queryKey: ['/customers', customerId, '/baskets', arg]}]
          }
        : {}
}

const updateBasketFromRequest = (
    customerId: string | null,
    params: {
        parameters: Basket
    }
): CacheUpdate<Basket> => ({
    ...updateBasketQuery(params.parameters.basketId),
    ...invalidateCustomerBasketsQuery(customerId)
})

const updateBasketFromResponse = (
    customerId: string | null,
    params: unknown, // not used,
    response: Basket
): CacheUpdate<Basket> => ({
    ...updateBasketQuery(response.basketId),
    ...invalidateCustomerBasketsQuery(customerId)
})

export const cacheUpdateMatrix: CacheUpdateMatrix<ApiClients['shopperBaskets']> = {
    addCouponToBasket: updateBasketFromRequest,
    addItemToBasket: updateBasketFromRequest,
    removeItemFromBasket: updateBasketFromRequest,
    addPaymentInstrumentToBasket: updateBasketFromRequest,
    createBasket: updateBasketFromResponse, // Response!
    deleteBasket: (customerId, params): CacheUpdate<void> => ({
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
