/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperBasketsTypes, ShopperCustomers, ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
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
    addGiftCertificateItemToBasket(customerId, {parameters}, response) {
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
    addPriceBooksToBasket(customerId, {parameters}) {
        // TODO: Convert invalidate to an update that removes the matching basket
        const invalidations = invalidateCustomerBasketsQuery(customerId, parameters)
        invalidations?.invalidate?.push({queryKey: getPriceBooksForBasket.queryKey(parameters)})
        return {
            ...invalidations,
            update: [{queryKey: getBasket.queryKey(parameters)}]
        }
    },
    addTaxesForBasket(customerId, {parameters}) {
        return {
            // TODO: Convert invalidate to an update that removes the matching basket
            ...invalidateCustomerBasketsQuery(customerId, parameters),
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                {queryKey: getTaxesFromBasket.queryKey(parameters)}
            ]
        }
    },
    addTaxesForBasketItem(customerId, {parameters}) {
        return {
            // TODO: Convert invalidate to an update that removes the matching basket
            ...invalidateCustomerBasketsQuery(customerId, parameters),
            update: [{queryKey: getBasket.queryKey(parameters)}]
        }
    },
    createBasket(customerId, {parameters}, response) {
        const {basketId} = response

        return {
            update: [
                {queryKey: getBasket.queryKey({...parameters, basketId})},
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
    createShipmentForBasket(customerId, {parameters}, response) {
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
    deleteBasket(customerId, {parameters}) {
        return {
            // TODO: Convert invalidate to an update that removes the matching basket
            ...invalidateCustomerBasketsQuery(customerId, parameters),
            remove: [
                // We want to fuzzy match all queryKeys with the `basketId` in their path
                // `["/organizations/",${organization},"/baskets/",${basketId}]`
                {queryKey: getBasket.path(parameters)}
            ]
        }
    },
    mergeBasket(customerId, {parameters}, response) {
        const {basketId} = response
        return {
            update: [
                {queryKey: getBasket.queryKey({...parameters, basketId})},
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
    removeGiftCertificateItemFromBasket(customerId, {parameters}, response) {
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
                {queryKey: getPaymentMethodsForBasket.queryKey(parameters)},
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
    removeShipmentFromBasket(customerId, {parameters}, response) {
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
    transferBasket(customerId, {parameters}, response) {
        const {basketId} = response

        return {
            update: [
                {queryKey: getBasket.queryKey({...parameters, basketId})},
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
    updateGiftCertificateItemInBasket(customerId, {parameters}, response) {
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
                {queryKey: getPaymentMethodsForBasket.queryKey(parameters)},
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
    updateShipmentForBasket(customerId, {parameters}, response) {
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
    updateShippingAddressForShipment(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                {queryKey: getShippingMethodsForShipment.queryKey(parameters)},
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
                {queryKey: getShippingMethodsForShipment.queryKey(parameters)},
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
