/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperBasketsTypes, ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import {ApiClients, ApiOptions, CacheUpdate, CacheUpdateMatrix, CacheUpdateUpdate} from '../types'
import {startsWith} from '../utils'

type Basket = ShopperBasketsTypes.Basket
type CustomerBasketsResult = ShopperCustomersTypes.BasketsResult

const updateBasketQuery = (
    customerId: string | null,
    basketId: string | undefined,
    newBasket: Basket
): Pick<CacheUpdate, 'update'> => {
    if (!basketId) return {}
    const update: Array<CacheUpdateUpdate<Basket> | CacheUpdateUpdate<CustomerBasketsResult>> = [
        {
            queryKey: ['/baskets', basketId, {basketId}],
            updater: newBasket
        }
    ]
    if (customerId) {
        const updateCustomerBaskets: CacheUpdateUpdate<CustomerBasketsResult> = {
            // Since we use baskets from customer basket query, we need to update it for any basket mutation
            queryKey: ['/customers', customerId, '/baskets', {customerId}],
            updater: (oldData) => {
                // do not update if response basket is not part of existing customer baskets
                if (!oldData?.baskets?.some((basket) => basket.basketId === basketId)) {
                    return undefined
                }
                const updatedBaskets = oldData.baskets.map((basket) => {
                    return basket.basketId === basketId ? newBasket : basket
                })
                return {
                    ...oldData,
                    // TODO: Remove type assertion when RAML specs match
                    baskets: updatedBaskets as CustomerBasketsResult['baskets']
                }
            }
        }
        update.push(updateCustomerBaskets)
    }
    // TODO: This type assertion is so that we "forget" what type the updater uses.
    // Is there a way to avoid the assertion?
    return {update} as CacheUpdate
}

const removeBasketQuery = (basketId?: string): Pick<CacheUpdate, 'remove'> => {
    if (!basketId) return {}
    return {
        remove: [startsWith(['/baskets', basketId])]
    }
}

const invalidateCustomerBasketsQuery = (
    customerId: string | null
): Pick<CacheUpdate, 'invalidate'> => {
    if (!customerId) return {}
    return {
        invalidate: [startsWith(['/customers', customerId, '/baskets'])]
    }
}

const updateBasketFromRequest = (
    customerId: string | null,
    options: ApiOptions<Basket>,
    response: Basket
): CacheUpdate => ({
    ...updateBasketQuery(customerId, options.parameters?.basketId, response),
    ...invalidateCustomerBasketsQuery(customerId)
})

const updateBasketFromResponse = (
    customerId: string | null,
    options: ApiOptions<Basket>, // not used,
    response: Basket
): CacheUpdate => ({
    ...updateBasketQuery(customerId, response.basketId, response),
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
