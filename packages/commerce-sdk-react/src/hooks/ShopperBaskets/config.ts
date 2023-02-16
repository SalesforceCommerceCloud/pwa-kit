/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperBasketsTypes, ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import {
    ApiClients,
    ApiOptions,
    CacheUpdate,
    CacheUpdateMatrix,
    CacheUpdateUpdate,
    MergedOptions
} from '../types'
import {and, matchesApiConfig, matchesPath} from '../utils'

type Client = ApiClients['shopperBaskets']
type Basket = ShopperBasketsTypes.Basket
type BasketOptions = MergedOptions<Client, ApiOptions<{basketId?: string}>>
type BasketParameters = BasketOptions['parameters']
type CustomerBasketsResult = ShopperCustomersTypes.BasketsResult

// Path helpers to avoid typos!
const getBasePath = (parameters: BasketParameters) => ['/organizations/', parameters.organizationId]
const getBasketPath = (parameters: BasketParameters & {basketId: string}) => [
    ...getBasePath(parameters),
    '/baskets/',
    parameters.basketId
]
const getCustomerBasketsPath = (customerId: string, parameters: BasketParameters) => [
    ...getBasePath(parameters),
    '/customers/',
    customerId,
    '/baskets' // No trailing / as it's an aggregate endpoint
]

const updateBasketQuery = (
    customerId: string | null,
    parameters: BasketOptions['parameters'],
    newBasket: Basket
): CacheUpdate => {
    // If we just check `!parameters.basketId`, then TypeScript doesn't infer that the value is
    // not `undefined`. We have to use this slightly convoluted predicate to give it that info.
    const hasBasketId = (p: {basketId?: string}): p is {basketId: string} => Boolean(p.basketId)
    if (!hasBasketId(parameters)) return {}
    const updateBasket: CacheUpdateUpdate<unknown> = {
        // TODO: This method is used by multiple endpoints, so `parameters` could have properties
        // that don't match getBasket
        queryKey: [...getBasketPath(parameters), parameters]
    }

    if (!customerId) return {update: [updateBasket]}
    const updateCustomerBaskets: CacheUpdateUpdate<unknown> = {
        // TODO: This method is used by multiple endpoints, so `parameters` could have properties
        // that don't match getCustomerBaskets
        queryKey: [...getCustomerBasketsPath(customerId, parameters), parameters],
        updater: (oldData?: CustomerBasketsResult): CustomerBasketsResult | undefined => {
            // do not update if response basket is not part of existing customer baskets
            if (!oldData?.baskets?.some((basket) => basket.basketId === parameters.basketId)) {
                return undefined
            }
            const updatedBaskets = oldData.baskets.map((basket) => {
                return basket.basketId === parameters.basketId ? newBasket : basket
            })
            return {
                ...oldData,
                // Shopper Customers and Shopper Baskets have different definitions for the `Basket`
                // type. (99% similar, but that's not good enough for TypeScript.)
                // TODO: Remove this type assertion when the RAML specs match.
                baskets: updatedBaskets as CustomerBasketsResult['baskets']
            }
        }
    }
    return {update: [updateBasket, updateCustomerBaskets]}
}

const invalidateCustomerBasketsQuery = (
    customerId: string | null,
    parameters: BasketOptions['parameters']
): Pick<CacheUpdate, 'invalidate'> => {
    if (!customerId) return {}
    return {
        invalidate: [
            and(
                matchesApiConfig(parameters),
                matchesPath(getCustomerBasketsPath(customerId, parameters))
            )
        ]
    }
}

const updateBasket = (
    customerId: string | null,
    {parameters}: BasketOptions,
    response: Basket
): CacheUpdate => ({
    ...updateBasketQuery(customerId, parameters, response),
    ...invalidateCustomerBasketsQuery(customerId, parameters)
})

const updateBasketWithResponseBasketId = (
    customerId: string | null,
    {parameters}: BasketOptions,
    response: Basket
): CacheUpdate => ({
    ...updateBasketQuery(customerId, {...parameters, basketId: response.basketId}, response),
    ...invalidateCustomerBasketsQuery(customerId, parameters)
})

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    addCouponToBasket: updateBasket,
    addItemToBasket: updateBasket,
    removeItemFromBasket: updateBasket,
    addPaymentInstrumentToBasket: updateBasket,
    createBasket: updateBasketWithResponseBasketId,
    deleteBasket: (customerId, {parameters}) => ({
        ...invalidateCustomerBasketsQuery(customerId, parameters),
        remove: [and(matchesApiConfig(parameters), matchesPath(getBasketPath(parameters)))]
    }),
    mergeBasket: updateBasketWithResponseBasketId,
    removeCouponFromBasket: updateBasket,
    removePaymentInstrumentFromBasket: updateBasket,
    updateBasket: updateBasket,
    updateBillingAddressForBasket: updateBasket,
    updateCustomerForBasket: updateBasket,
    updateItemInBasket: updateBasket,
    updatePaymentInstrumentInBasket: updateBasket,
    updateShippingAddressForShipment: updateBasket,
    updateShippingMethodForShipment: updateBasket
}
