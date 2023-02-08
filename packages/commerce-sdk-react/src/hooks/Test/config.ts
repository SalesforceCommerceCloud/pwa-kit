/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperBasketsTypes} from 'commerce-sdk-isomorphic'
import {ApiClients, ApiOptions, CacheUpdate, CacheUpdateMatrix} from '../types'

type Basket = ShopperBasketsTypes.Basket

const updateBasketQuery = (basketId?: string): Pick<CacheUpdate, 'update'> => {
    if (!basketId) return {}
    return {
        update: [
            {
                queryKey: ['/baskets', basketId, {basketId}],
                updater: (basket) => basket // TODO
            }
        ]
    }
}

const removeBasketQuery = (basketId?: string): Pick<CacheUpdate, 'remove'> => {
    if (!basketId) return {}
    return {
        remove: [{queryKey: ['/baskets', basketId, {basketId}]}]
    }
}

const invalidateCustomerBasketsQuery = (
    customerId: string | null
): Pick<CacheUpdate, 'invalidate'> => {
    if (!customerId) return {}
    return {
        invalidate: [{queryKey: ['/customers', customerId, '/baskets', {customerId}]}]
    }
}

const updateBasketFromRequest = (
    customerId: string | null,
    options: ApiOptions<Basket>
): CacheUpdate => ({
    ...updateBasketQuery(options.parameters?.basketId),
    ...invalidateCustomerBasketsQuery(customerId)
})

const updateBasketFromResponse = (
    customerId: string | null,
    options: ApiOptions<Basket>, // not used,
    response: Basket
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
    deleteBasket: (customerId, options): CacheUpdate => ({
        ...invalidateCustomerBasketsQuery(customerId),
        ...removeBasketQuery(options.parameters.basketId)
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
