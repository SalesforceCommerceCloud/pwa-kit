/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    ShopperBaskets,
    ShopperBasketsTypes,
    ShopperCustomers,
    ShopperCustomersTypes
} from 'commerce-sdk-isomorphic'
import {ApiClients, Argument, CacheUpdate, CacheUpdateMatrix, MergedOptions} from '../types'
import {
    getBasket,
    getPaymentMethodsForBasket,
    getPriceBooksForBasket,
    getShippingMethodsForShipment,
    getTaxesFromBasket
} from './queryKeyHelpers'
import {getCustomerBaskets} from '../ShopperCustomers/queryKeyHelpers'

type Client = ApiClients['shopperBaskets']
/** Data returned by every Shopper Baskets endpoint (except `deleteBasket`) */
type Basket = ShopperBasketsTypes.Basket
/** Data returned by `getCustomerBaskets` */
type CustomerBasketsResult = ShopperCustomersTypes.BasketsResult
/** Parameters that get passed around, includes client config and possible parameters from other endpoints */
type BasketParameters = MergedOptions<Client, Argument<Client['getBasket']>>['parameters']
/** Parameters that we actually send to the API for `getBasket` */
type GetBasketParameters = Argument<ShopperBaskets<{shortCode: string}>['getBasket']>['parameters']
/** Parameters that we actually send to the API for `getCustomerBaskets` */
type GetCustomerBasketsParameters = Argument<
    ShopperCustomers<{shortCode: string}>['getCustomerBaskets']
>['parameters']

const customerBasketsUpdater = (
    parameters: BasketParameters,
    response: Basket,
    oldData?: CustomerBasketsResult | undefined
) => {
    // do not update if response basket is not part of existing customer baskets
    if (!oldData?.baskets?.some((basket) => basket.basketId === parameters.basketId)) {
        return undefined
    }
    const updatedBaskets = oldData.baskets.map((basket) =>
        basket.basketId === parameters.basketId ? response : basket
    )
    return {
        ...oldData,
        // Shopper Customers and Shopper Baskets have different definitions for the `Basket`
        // type. (99% similar, but that's not good enough for TypeScript.)
        // TODO: Remove this type assertion when the RAML specs match.
        baskets: updatedBaskets as CustomerBasketsResult['baskets']
    }
}

const invalidateCustomerBasketsQuery = (
    customerId: string | null,
    parameters: Omit<GetCustomerBasketsParameters, 'customerId'>
): CacheUpdate => {
    if (!customerId) return {}
    return {
        invalidate: [{queryKey: getCustomerBaskets.queryKey({...parameters, customerId})}]
    }
}

/** Logs a warning to console (on startup) and returns nothing (method is unimplemented). */
const TODO = (method: keyof Client) => {
    console.warn(`Cache logic for '${method}' is not yet implemented.`)
    return undefined
}

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    addCouponToBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(parameters, response, oldData)
                          }
                      ]
                    : [])
            ]
        }
    },
    addGiftCertificateItemToBasket: TODO('addGiftCertificateItemToBasket'),
    addItemToBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(parameters, response, oldData)
                          }
                      ]
                    : [])
            ]
        }
    },
    addPaymentInstrumentToBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(parameters, response, oldData)
                          }
                      ]
                    : [])
            ]
        }
    },
    addPriceBooksToBasket: TODO('addPriceBooksToBasket'),
    addTaxesForBasket: TODO('addTaxesForBasket'),
    addTaxesForBasketItem: TODO('addTaxesForBasketItem'),
    createBasket(customerId, {parameters}, response) {
        const {basketId} = response

        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId && basketId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({
                                  ...parameters,
                                  customerId
                              }),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(
                                      {...parameters, basketId},
                                      response,
                                      oldData
                                  )
                          }
                      ]
                    : [])
            ],
            ...(!basketId && invalidateCustomerBasketsQuery(customerId, parameters))
        }
    },
    createShipmentForBasket: TODO('createShipmentForBasket'),
    deleteBasket(customerId, {parameters}) {
        return {
            // TODO: Convert invalidate to an update that removes the matching basket
            ...invalidateCustomerBasketsQuery(customerId, parameters),
            remove: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [{queryKey: getCustomerBaskets.queryKey({...parameters, customerId})}]
                    : [])
            ]
        }
    },
    mergeBasket(customerId, {parameters}, response) {
        const {basketId} = response
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId && basketId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({
                                  ...parameters,
                                  customerId
                              }),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(
                                      {...parameters, basketId},
                                      response,
                                      oldData
                                  )
                          }
                      ]
                    : [])
            ]
        }
    },
    removeCouponFromBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(parameters, response, oldData)
                          }
                      ]
                    : [])
            ]
        }
    },
    removeGiftCertificateItemFromBasket: TODO('removeGiftCertificateItemFromBasket'),
    removeItemFromBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(parameters, response, oldData)
                          }
                      ]
                    : [])
            ]
        }
    },
    removePaymentInstrumentFromBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(parameters, response, oldData)
                          }
                      ]
                    : [])
            ]
        }
    },
    removeShipmentFromBasket: TODO('removeShipmentFromBasket'),
    transferBasket: TODO('transferBasket'),
    updateBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(parameters, response, oldData)
                          }
                      ]
                    : [])
            ]
        }
    },
    updateBillingAddressForBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(parameters, response, oldData)
                          }
                      ]
                    : [])
            ]
        }
    },
    updateCustomerForBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(parameters, response, oldData)
                          }
                      ]
                    : [])
            ]
        }
    },
    updateGiftCertificateItemInBasket: TODO('updateGiftCertificateItemInBasket'),
    updateItemInBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(parameters, response, oldData)
                          }
                      ]
                    : [])
            ]
        }
    },
    updatePaymentInstrumentInBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(parameters, response, oldData)
                          }
                      ]
                    : [])
            ]
        }
    },
    updateShipmentForBasket: TODO('updateShipmentForBasket'),
    updateShippingAddressForShipment(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(parameters, response, oldData)
                          }
                      ]
                    : [])
            ]
        }
    },
    updateShippingMethodForShipment(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [
                          {
                              queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
                              updater: (oldData: CustomerBasketsResult | undefined) =>
                                  customerBasketsUpdater(parameters, response, oldData)
                          }
                      ]
                    : [])
            ]
        }
    }
}
