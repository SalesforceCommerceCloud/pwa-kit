/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperBasketsTypes, ShopperCustomers, ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import {
    ApiClients,
    Argument,
    CacheUpdateInvalidate,
    CacheUpdateMatrix,
    CacheUpdateUpdate,
    MergedOptions
} from '../types'
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

const invalidateCustomerBasketsQuery = (
    customerId: string,
    parameters: Omit<GetCustomerBasketsParameters, 'customerId'>
): CacheUpdateInvalidate => {
    return {
        queryKey: getCustomerBaskets.queryKey({...parameters, customerId})
    }
}

const updateCustomerBasketsQuery = (
    customerId: string,
    parameters: BasketParameters,
    response: Basket
): CacheUpdateUpdate<unknown> => {
    return {
        queryKey: getCustomerBaskets.queryKey({...parameters, customerId}),
        updater: (oldData: CustomerBasketsResult | undefined) => {
            if (!oldData?.baskets?.length) {
                return {
                    baskets: [response],
                    total: 1
                }
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
    }
}

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    addCouponToBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    addGiftCertificateItemToBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    addItemToBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    addPaymentInstrumentToBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    addPriceBooksToBasket(customerId, {parameters}) {
        return {
            invalidate: [
                {queryKey: getBasket.queryKey(parameters)},
                {queryKey: getPriceBooksForBasket.queryKey(parameters)},
                // TODO: Convert invalidate to an update that removes the matching basket
                ...(customerId ? [invalidateCustomerBasketsQuery(customerId, parameters)] : [])
            ]
        }
    },
    addTaxesForBasket(customerId, {parameters}) {
        return {
            invalidate: [
                {queryKey: getBasket.queryKey(parameters)},
                {queryKey: getTaxesFromBasket.queryKey(parameters)},
                // TODO: Convert invalidate to an update that removes the matching basket
                ...(customerId ? [invalidateCustomerBasketsQuery(customerId, parameters)] : [])
            ]
        }
    },
    addTaxesForBasketItem(customerId, {parameters}) {
        return {
            // TODO: Convert invalidate to an update that removes the matching basket
            invalidate: [
                ...(customerId ? [invalidateCustomerBasketsQuery(customerId, parameters)] : [])
            ],
            update: [{queryKey: getBasket.queryKey(parameters)}]
        }
    },
    createBasket(customerId, {parameters}, response) {
        const {basketId} = response

        return {
            // TODO: Convert invalidate to an update that removes the matching basket
            invalidate: [
                ...(customerId && !basketId
                    ? [invalidateCustomerBasketsQuery(customerId, parameters)]
                    : [])
            ],
            update: [
                {queryKey: getBasket.queryKey({...parameters, basketId})},
                ...(customerId && basketId
                    ? [updateCustomerBasketsQuery(customerId, {...parameters, basketId}, response)]
                    : [])
            ]
        }
    },
    createShipmentForBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    deleteBasket(customerId, {parameters}) {
        return {
            // TODO: Convert invalidate to an update that removes the matching basket
            invalidate: [
                ...(customerId ? [invalidateCustomerBasketsQuery(customerId, parameters)] : [])
            ],
            remove: [
                // We want to fuzzy match all queryKeys with `basketId` in their path
                // [`/commerce-sdk-react,/organizations/,${organization},/baskets/,${basketId}`]
                {queryKey: getBasket.path(parameters)}
            ]
        }
    },
    mergeBasket(customerId, {parameters}, response) {
        const {basketId} = response
        return {
            // TODO: Convert invalidate to an update that removes the matching basket
            invalidate: [
                ...(customerId && !basketId
                    ? [invalidateCustomerBasketsQuery(customerId, parameters)]
                    : [])
            ],
            update: [
                {queryKey: getBasket.queryKey({...parameters, basketId})},
                ...(customerId && basketId
                    ? [updateCustomerBasketsQuery(customerId, {...parameters, basketId}, response)]
                    : [])
            ]
        }
    },
    removeCouponFromBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    removeGiftCertificateItemFromBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    removeItemFromBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    removePaymentInstrumentFromBasket(customerId, {parameters}, response) {
        return {
            invalidate: [
                {queryKey: getPaymentMethodsForBasket.queryKey(parameters)},
                // TODO: Convert invalidate to an update that removes the matching basket
                ...(customerId ? [invalidateCustomerBasketsQuery(customerId, parameters)] : [])
            ],
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    removeShipmentFromBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    transferBasket(customerId, {parameters}, response) {
        const {basketId} = response
        const transferedTo = response?.customerInfo?.customerId

        return {
            // TODO: Convert invalidate to an update that removes the matching basket
            invalidate: [
                ...(customerId && !basketId
                    ? [invalidateCustomerBasketsQuery(customerId, parameters)]
                    : [])
            ],
            update: [
                {queryKey: getBasket.queryKey({...parameters, basketId})},
                ...(transferedTo && basketId
                    ? [
                          updateCustomerBasketsQuery(
                              transferedTo,
                              {...parameters, basketId},
                              response
                          )
                      ]
                    : [])
            ]
        }
    },
    updateBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    updateBillingAddressForBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    updateCustomerForBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    updateGiftCertificateItemInBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    updateItemInBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    updateItemsInBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    updatePaymentInstrumentInBasket(customerId, {parameters}, response) {
        return {
            invalidate: [
                {queryKey: getPaymentMethodsForBasket.queryKey(parameters)},
                // TODO: Convert invalidate to an update that removes the matching basket
                ...(customerId ? [invalidateCustomerBasketsQuery(customerId, parameters)] : [])
            ],
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    updateShipmentForBasket(customerId, {parameters}, response) {
        return {
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    updateShippingAddressForShipment(customerId, {parameters}, response) {
        return {
            // TODO: Convert invalidate to an update that removes the matching basket
            invalidate: [
                {queryKey: getShippingMethodsForShipment.queryKey(parameters)},
                ...(customerId ? [invalidateCustomerBasketsQuery(customerId, parameters)] : [])
            ],
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    },
    updateShippingMethodForShipment(customerId, {parameters}, response) {
        return {
            // TODO: Convert invalidate to an update that removes the matching basket
            invalidate: [
                {queryKey: getShippingMethodsForShipment.queryKey(parameters)},
                ...(customerId ? [invalidateCustomerBasketsQuery(customerId, parameters)] : [])
            ],
            update: [
                {queryKey: getBasket.queryKey(parameters)},
                ...(customerId
                    ? [updateCustomerBasketsQuery(customerId, parameters, response)]
                    : [])
            ]
        }
    }
}
