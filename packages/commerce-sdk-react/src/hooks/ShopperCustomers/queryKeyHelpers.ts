/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ShopperCustomers} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {pick} from '../utils'

// We must use a client with no parameters in order to have required/optional match the API spec
type Client = ShopperCustomers<{shortCode: string}>
type Params<T extends keyof QueryKeys> = NonNullable<Argument<Client[T]>['parameters']>
export type QueryKeys = {
    getExternalProfile: [
        '/organizations/',
        string,
        '/customers/external-profile',
        Params<'getExternalProfile'>
    ]
    getCustomer: ['/organizations/', string, '/customers/', string, Params<'getCustomer'>]
    getCustomerAddress: [
        '/organizations/',
        string,
        '/customers/',
        string,
        '/addresses/',
        string,
        Params<'getCustomerAddress'>
    ]
    getCustomerBaskets: [
        '/organizations/',
        string,
        '/customers/',
        string,
        '/baskets',
        Params<'getCustomerBaskets'>
    ]
    getCustomerOrders: [
        '/organizations/',
        string,
        '/customers/',
        string,
        '/orders',
        Params<'getCustomerOrders'>
    ]
    getCustomerPaymentInstrument: [
        '/organizations/',
        string,
        '/customers/',
        string,
        '/payment-instruments/',
        string,
        Params<'getCustomerPaymentInstrument'>
    ]
    getCustomerProductLists: [
        '/organizations/',
        string,
        '/customers/',
        string,
        '/product-lists',
        Params<'getCustomerProductLists'>
    ]
    getCustomerProductList: [
        '/organizations/',
        string,
        '/customers/',
        string,
        '/product-lists/',
        string,
        Params<'getCustomerProductList'>
    ]
    getCustomerProductListItem: [
        '/organizations/',
        string,
        '/customers/',
        string,
        '/product-lists/',
        string,
        '/items/',
        string,
        Params<'getCustomerProductListItem'>
    ]
    getPublicProductListsBySearchTerm: [
        '/organizations/',
        string,
        '/product-lists',
        Params<'getPublicProductListsBySearchTerm'>
    ]
    getPublicProductList: [
        '/organizations/',
        string,
        '/product-lists/',
        string,
        Params<'getPublicProductList'>
    ]
    getProductListItem: [
        '/organizations/',
        string,
        '/product-lists/',
        string,
        '/items/',
        string,
        Params<'getProductListItem'>
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

export const getExternalProfile: QueryKeyHelper<'getExternalProfile'> = {
    parameters: (params) =>
        pick(params, ['organizationId', 'externalId', 'authenticationProviderId', 'siteId']),
    path: (params) => ['/organizations/', params.organizationId, '/customers/external-profile'],
    queryKey: (params: Params<'getExternalProfile'>) => [
        ...getExternalProfile.path(params),
        getExternalProfile.parameters(params)
    ]
}

export const getCustomer: QueryKeyHelper<'getCustomer'> = {
    parameters: (params) => pick(params, ['organizationId', 'customerId', 'siteId']),
    path: (params) => ['/organizations/', params.organizationId, '/customers/', params.customerId],
    queryKey: (params: Params<'getCustomer'>) => [
        ...getCustomer.path(params),
        getCustomer.parameters(params)
    ]
}

export const getCustomerAddress: QueryKeyHelper<'getCustomerAddress'> = {
    parameters: (params) => pick(params, ['organizationId', 'customerId', 'addressName', 'siteId']),
    path: (params) => [
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId,
        '/addresses/',
        params.addressName
    ],
    queryKey: (params: Params<'getCustomerAddress'>) => [
        ...getCustomerAddress.path(params),
        getCustomerAddress.parameters(params)
    ]
}

export const getCustomerBaskets: QueryKeyHelper<'getCustomerBaskets'> = {
    parameters: (params) => pick(params, ['organizationId', 'customerId', 'siteId']),
    path: (params) => [
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId,
        '/baskets'
    ],
    queryKey: (params: Params<'getCustomerBaskets'>) => [
        ...getCustomerBaskets.path(params),
        getCustomerBaskets.parameters(params)
    ]
}

export const getCustomerOrders: QueryKeyHelper<'getCustomerOrders'> = {
    parameters: (params) =>
        pick(params, [
            'organizationId',
            'customerId',
            'crossSites',
            'from',
            'until',
            'status',
            'siteId',
            'offset',
            'limit'
        ]),
    path: (params) => [
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId,
        '/orders'
    ],
    queryKey: (params: Params<'getCustomerOrders'>) => [
        ...getCustomerOrders.path(params),
        getCustomerOrders.parameters(params)
    ]
}

export const getCustomerPaymentInstrument: QueryKeyHelper<'getCustomerPaymentInstrument'> = {
    parameters: (params) =>
        pick(params, ['organizationId', 'customerId', 'paymentInstrumentId', 'siteId']),
    path: (params) => [
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId,
        '/payment-instruments/',
        params.paymentInstrumentId
    ],
    queryKey: (params: Params<'getCustomerPaymentInstrument'>) => [
        ...getCustomerPaymentInstrument.path(params),
        getCustomerPaymentInstrument.parameters(params)
    ]
}

export const getCustomerProductLists: QueryKeyHelper<'getCustomerProductLists'> = {
    parameters: (params) => pick(params, ['organizationId', 'customerId', 'siteId']),
    path: (params) => [
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId,
        '/product-lists'
    ],
    queryKey: (params: Params<'getCustomerProductLists'>) => [
        ...getCustomerProductLists.path(params),
        getCustomerProductLists.parameters(params)
    ]
}

export const getCustomerProductList: QueryKeyHelper<'getCustomerProductList'> = {
    parameters: (params) => pick(params, ['organizationId', 'customerId', 'listId', 'siteId']),
    path: (params) => [
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId,
        '/product-lists/',
        params.listId
    ],
    queryKey: (params: Params<'getCustomerProductList'>) => [
        ...getCustomerProductList.path(params),
        getCustomerProductList.parameters(params)
    ]
}

export const getCustomerProductListItem: QueryKeyHelper<'getCustomerProductListItem'> = {
    parameters: (params) =>
        pick(params, ['organizationId', 'customerId', 'listId', 'itemId', 'siteId']),
    path: (params) => [
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId,
        '/product-lists/',
        params.listId,
        '/items/',
        params.itemId
    ],
    queryKey: (params: Params<'getCustomerProductListItem'>) => [
        ...getCustomerProductListItem.path(params),
        getCustomerProductListItem.parameters(params)
    ]
}

export const getPublicProductListsBySearchTerm: QueryKeyHelper<'getPublicProductListsBySearchTerm'> =
    {
        parameters: (params) =>
            pick(params, ['organizationId', 'email', 'firstName', 'lastName', 'siteId']),
        path: (params) => ['/organizations/', params.organizationId, '/product-lists'],
        queryKey: (params: Params<'getPublicProductListsBySearchTerm'>) => [
            ...getPublicProductListsBySearchTerm.path(params),
            getPublicProductListsBySearchTerm.parameters(params)
        ]
    }

export const getPublicProductList: QueryKeyHelper<'getPublicProductList'> = {
    parameters: (params) => pick(params, ['organizationId', 'listId', 'siteId']),
    path: (params) => ['/organizations/', params.organizationId, '/product-lists/', params.listId],
    queryKey: (params: Params<'getPublicProductList'>) => [
        ...getPublicProductList.path(params),
        getPublicProductList.parameters(params)
    ]
}

export const getProductListItem: QueryKeyHelper<'getProductListItem'> = {
    parameters: (params) => pick(params, ['organizationId', 'listId', 'itemId', 'siteId']),
    path: (params) => [
        '/organizations/',
        params.organizationId,
        '/product-lists/',
        params.listId,
        '/items/',
        params.itemId
    ],
    queryKey: (params: Params<'getProductListItem'>) => [
        ...getProductListItem.path(params),
        getProductListItem.parameters(params)
    ]
}
