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
import {and, matchesPath, matchParameters, pick} from '../utils'

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

// Path helpers to avoid typos!
const getBasePath = (parameters: {organizationId: string}) => [
    '/organizations/',
    parameters.organizationId
]
const getBasketPath = (parameters: GetBasketParameters) => [
    ...getBasePath(parameters),
    '/baskets/',
    parameters.basketId
]
const getCustomerBasketsPath = (parameters: GetCustomerBasketsParameters) => [
    ...getBasePath(parameters),
    '/customers/',
    parameters.customerId,
    '/baskets' // No trailing / as it's an aggregate endpoint
]

// Parameters helpers
/**
 * Creates an object with *only* the parameters from `getBasket`, omitting unwanted parameters from
 * other endpoints. (Extra parameters can break query key matching.)
 */
const toGetBasketParameters = (parameters: GetBasketParameters): GetBasketParameters =>
    pick(parameters, ['basketId', 'locale', 'organizationId', 'siteId'])
/**
 * Creates an object with *only* the parameters from `getBasket`, omitting unwanted parameters from
 * other endpoints. (Extra parameters can break query key matching.)
 */
const toGetCustomerBasketsParameters = (
    customerId: string,
    parameters: Omit<GetCustomerBasketsParameters, 'customerId'>
): GetCustomerBasketsParameters =>
    pick({customerId, ...parameters}, ['customerId', 'organizationId', 'siteId'])

const updateBasketQuery = (
    customerId: string | null,
    parameters: BasketParameters,
    newBasket: Basket
): CacheUpdate => {
    // The `parameters` received includes the client config and parameters from other endpoints
    // so we need to exclude unwanted parameters in the query key
    const getBasketParameters = toGetBasketParameters(parameters)
    const basketUpdate = {
        queryKey: [...getBasketPath(parameters), getBasketParameters] as const
    }

    // We can only update customer baskets if we have a customer!
    if (!customerId) return {update: [basketUpdate]}

    // Similar elision as done for `getBasket`
    const getCustomerBasketsParameters = toGetCustomerBasketsParameters(customerId, parameters)
    const customerBasketsUpdate = {
        queryKey: [
            ...getCustomerBasketsPath(getCustomerBasketsParameters),
            getCustomerBasketsParameters
        ] as const,
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
    return {update: [basketUpdate, customerBasketsUpdate]}
}

const invalidateCustomerBasketsQuery = (
    customerId: string | null,
    parameters: Omit<GetCustomerBasketsParameters, 'customerId'>
): CacheUpdate => {
    if (!customerId) return {}
    return {
        invalidate: [
            and(
                matchParameters(toGetCustomerBasketsParameters(customerId, parameters)),
                matchesPath(getCustomerBasketsPath({...parameters, customerId}))
            )
        ]
    }
}

const updateBasket = (
    customerId: string | null,
    {parameters}: {parameters: BasketParameters},
    response: Basket
): CacheUpdate => ({
    // TODO: We only update the basket from the matching locale; we should also invalidate other locales
    ...updateBasketQuery(customerId, parameters, response),
    ...invalidateCustomerBasketsQuery(customerId, parameters)
})

const updateBasketWithResponseBasketId = (
    customerId: string | null,
    {parameters}: {parameters: Omit<BasketParameters, 'basketId'>},
    response: Basket
): CacheUpdate => {
    const {basketId} = response
    return {
        // TODO: We only update the basket from the matching locale; we should also invalidate other locales
        ...(basketId && updateBasketQuery(customerId, {...parameters, basketId}, response)),
        ...invalidateCustomerBasketsQuery(customerId, parameters)
    }
}

const TODO = (method: keyof Client): undefined => {
    // This is kind of a hacky way of passing both the "not implemented" tests in mutations.test.ts
    // and the "all hooks have cache logic" test in index.test.ts. The former expects `undefined`
    // as a value and the latter expects the key to exist, both of which are satisfied by setting
    // an explicit `undefined`. So that's all that this does, plus logging a TODO warning.
    // Hacky, but temporary!
    console.warn(`Cache logic for '${method}' is not yet implemented.`)
    return undefined
}

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    addCouponToBasket: updateBasket,
    addGiftCertificateItemToBasket: TODO('addGiftCertificateItemToBasket'),
    addItemToBasket: updateBasket,
    addPaymentInstrumentToBasket: updateBasket,
    addPriceBooksToBasket: TODO('addPriceBooksToBasket'),
    addTaxesForBasket: TODO('addTaxesForBasket'),
    addTaxesForBasketItem: TODO('addTaxesForBasketItem'),
    createBasket: updateBasketWithResponseBasketId,
    createShipmentForBasket: TODO('createShipmentForBasket'),
    deleteBasket: (customerId, {parameters}) => ({
        // TODO: Convert invalidate to an update that removes the matching basket
        ...invalidateCustomerBasketsQuery(customerId, parameters),
        remove: [
            and(
                matchParameters(toGetBasketParameters(parameters)),
                matchesPath(getBasketPath(parameters))
            )
        ]
    }),
    mergeBasket: updateBasketWithResponseBasketId,
    removeCouponFromBasket: updateBasket,
    removeGiftCertificateItemFromBasket: TODO('removeGiftCertificateItemFromBasket'),
    removeItemFromBasket: updateBasket,
    removePaymentInstrumentFromBasket: updateBasket,
    removeShipmentFromBasket: TODO('removeShipmentFromBasket'),
    transferBasket: TODO('transferBasket'),
    updateBasket: updateBasket,
    updateBillingAddressForBasket: updateBasket,
    updateCustomerForBasket: updateBasket,
    updateGiftCertificateItemInBasket: TODO('updateGiftCertificateItemInBasket'),
    updateItemInBasket: updateBasket,
    updatePaymentInstrumentInBasket: updateBasket,
    updateShipmentForBasket: TODO('updateShipmentForBasket'),
    updateShippingAddressForShipment: updateBasket,
    updateShippingMethodForShipment: updateBasket
}
