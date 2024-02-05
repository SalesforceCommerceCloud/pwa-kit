/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ShopperBaskets} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {getCustomKeys, pick} from '../utils'

// We must use a client with no parameters in order to have required/optional match the API spec
type Client = ShopperBaskets<{shortCode: string}>
type Params<T extends keyof QueryKeys> = Partial<Argument<Client[T]>['parameters']>
export type QueryKeys = {
    getBasket: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/baskets/',
        string | undefined,
        Params<'getBasket'>
    ]
    getPaymentMethodsForBasket: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/baskets/',
        string | undefined,
        '/payment-methods',
        Params<'getPaymentMethodsForBasket'>
    ]
    getPriceBooksForBasket: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/baskets/',
        string | undefined,
        '/price-books',
        Params<'getPriceBooksForBasket'>
    ]
    getShippingMethodsForShipment: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/baskets/',
        string | undefined,
        '/shipments/',
        string | undefined,
        '/shipping-methods',
        Params<'getShippingMethodsForShipment'>
    ]
    getTaxesFromBasket: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/baskets/',
        string | undefined,
        '/taxes',
        Params<'getTaxesFromBasket'>
    ]
}

// This is defined here, rather than `types.ts`, because it relies on `Client` and `QueryKeys`,
// and making those generic would add too much complexity.
type QueryKeyHelper<T extends keyof QueryKeys> = {
    /**
     * Reduces the given parameters (which may have additional, unknown properties) to an object
     * containing *only* the properties required for an endpoint.
     */
    parameters: (params: Params<T>) => Params<T>
    /** Generates the path component of the query key for an endpoint. */
    path: (params: Params<T>) => ExcludeTail<QueryKeys[T]>
    /** Generates the full query key for an endpoint. */
    queryKey: (params: Params<T>) => QueryKeys[T]
}

export const getBasket: QueryKeyHelper<'getBasket'> = {
    parameters: (params) =>
        pick(params, ['organizationId', 'basketId', 'siteId', 'locale', ...getCustomKeys(params)]),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/baskets/',
        params.basketId
    ],
    queryKey: (params: Params<'getBasket'>) => [
        ...getBasket.path(params),
        getBasket.parameters(params)
    ]
}

export const getPaymentMethodsForBasket: QueryKeyHelper<'getPaymentMethodsForBasket'> = {
    parameters: (params) =>
        pick(params, ['organizationId', 'basketId', 'siteId', 'locale', ...getCustomKeys(params)]),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/baskets/',
        params.basketId,
        '/payment-methods'
    ],
    queryKey: (params: Params<'getPaymentMethodsForBasket'>) => [
        ...getPaymentMethodsForBasket.path(params),
        getPaymentMethodsForBasket.parameters(params)
    ]
}

export const getPriceBooksForBasket: QueryKeyHelper<'getPriceBooksForBasket'> = {
    parameters: (params) =>
        pick(params, ['organizationId', 'basketId', 'siteId', ...getCustomKeys(params)]),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/baskets/',
        params.basketId,
        '/price-books'
    ],
    queryKey: (params: Params<'getPriceBooksForBasket'>) => [
        ...getPriceBooksForBasket.path(params),
        getPriceBooksForBasket.parameters(params)
    ]
}

export const getShippingMethodsForShipment: QueryKeyHelper<'getShippingMethodsForShipment'> = {
    parameters: (params) =>
        pick(params, [
            'organizationId',
            'basketId',
            'shipmentId',
            'siteId',
            'locale',
            ...getCustomKeys(params)
        ]),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/baskets/',
        params.basketId,
        '/shipments/',
        params.shipmentId,
        '/shipping-methods'
    ],
    queryKey: (params: Params<'getShippingMethodsForShipment'>) => [
        ...getShippingMethodsForShipment.path(params),
        getShippingMethodsForShipment.parameters(params)
    ]
}

export const getTaxesFromBasket: QueryKeyHelper<'getTaxesFromBasket'> = {
    parameters: (params) =>
        pick(params, ['organizationId', 'basketId', 'siteId', ...getCustomKeys(params)]),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/baskets/',
        params.basketId,
        '/taxes'
    ],
    queryKey: (params: Params<'getTaxesFromBasket'>) => [
        ...getTaxesFromBasket.path(params),
        getTaxesFromBasket.parameters(params)
    ]
}
