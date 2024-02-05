/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ShopperCustomers} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {getCustomKeys, pick} from '../utils'

// We must use a client with no parameters in order to have required/optional match the API spec
type Client = ShopperCustomers<{shortCode: string}>
type Params<T extends keyof QueryKeys> = Partial<Argument<Client[T]>['parameters']>
export type QueryKeys = {
    getExternalProfile: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/customers/external-profile',
        Params<'getExternalProfile'>
    ]
    getCustomer: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/customers/',
        string | undefined,
        Params<'getCustomer'>
    ]
    getCustomerAddress: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/customers/',
        string | undefined,
        '/addresses/',
        string | undefined,
        Params<'getCustomerAddress'>
    ]
    getCustomerBaskets: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/customers/',
        string | undefined,
        '/baskets',
        Params<'getCustomerBaskets'>
    ]
    getCustomerOrders: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/customers/',
        string | undefined,
        '/orders',
        Params<'getCustomerOrders'>
    ]
    getCustomerPaymentInstrument: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/customers/',
        string | undefined,
        '/payment-instruments/',
        string | undefined,
        Params<'getCustomerPaymentInstrument'>
    ]
    getCustomerProductLists: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/customers/',
        string | undefined,
        '/product-lists',
        Params<'getCustomerProductLists'>
    ]
    getCustomerProductList: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/customers/',
        string | undefined,
        '/product-lists/',
        string | undefined,
        Params<'getCustomerProductList'>
    ]
    getCustomerProductListItem: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/customers/',
        string | undefined,
        '/product-lists/',
        string | undefined,
        '/items/',
        string | undefined,
        Params<'getCustomerProductListItem'>
    ]
    getPublicProductListsBySearchTerm: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/product-lists',
        Params<'getPublicProductListsBySearchTerm'>
    ]
    getPublicProductList: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/product-lists/',
        string | undefined,
        Params<'getPublicProductList'>
    ]
    getProductListItem: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/product-lists/',
        string | undefined,
        '/items/',
        string | undefined,
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
        pick(params, [
            'organizationId',
            'externalId',
            'authenticationProviderId',
            'siteId',
            ...getCustomKeys(params)
        ]),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/customers/external-profile'
    ],
    queryKey: (params: Params<'getExternalProfile'>) => [
        ...getExternalProfile.path(params),
        getExternalProfile.parameters(params)
    ]
}

export const getCustomer: QueryKeyHelper<'getCustomer'> = {
    parameters: (params) =>
        pick(params, ['organizationId', 'customerId', 'siteId', ...getCustomKeys(params)]),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId
    ],
    queryKey: (params: Params<'getCustomer'>) => [
        ...getCustomer.path(params),
        getCustomer.parameters(params)
    ]
}

export const getCustomerAddress: QueryKeyHelper<'getCustomerAddress'> = {
    parameters: (params) =>
        pick(params, [
            'organizationId',
            'customerId',
            'addressName',
            'siteId',
            ...getCustomKeys(params)
        ]),
    path: (params) => [
        '/commerce-sdk-react',
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
    parameters: (params) =>
        pick(params, ['organizationId', 'customerId', 'siteId', ...getCustomKeys(params)]),
    path: (params) => [
        '/commerce-sdk-react',
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
            'limit',
            ...getCustomKeys(params)
        ]),
    path: (params) => [
        '/commerce-sdk-react',
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
        pick(params, [
            'organizationId',
            'customerId',
            'paymentInstrumentId',
            'siteId',
            ...getCustomKeys(params)
        ]),
    path: (params) => [
        '/commerce-sdk-react',
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
    parameters: (params) =>
        pick(params, ['organizationId', 'customerId', 'siteId', ...getCustomKeys(params)]),
    path: (params) => [
        '/commerce-sdk-react',
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
    parameters: (params) =>
        pick(params, [
            'organizationId',
            'customerId',
            'listId',
            'siteId',
            ...getCustomKeys(params)
        ]),
    path: (params) => [
        '/commerce-sdk-react',
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
        pick(params, [
            'organizationId',
            'customerId',
            'listId',
            'itemId',
            'siteId',
            ...getCustomKeys(params)
        ]),
    path: (params) => [
        '/commerce-sdk-react',
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
            pick(params, [
                'organizationId',
                'email',
                'firstName',
                'lastName',
                'siteId',
                ...getCustomKeys(params)
            ]),
        path: (params) => [
            '/commerce-sdk-react',
            '/organizations/',
            params.organizationId,
            '/product-lists'
        ],
        queryKey: (params: Params<'getPublicProductListsBySearchTerm'>) => [
            ...getPublicProductListsBySearchTerm.path(params),
            getPublicProductListsBySearchTerm.parameters(params)
        ]
    }

export const getPublicProductList: QueryKeyHelper<'getPublicProductList'> = {
    parameters: (params) =>
        pick(params, ['organizationId', 'listId', 'siteId', ...getCustomKeys(params)]),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/product-lists/',
        params.listId
    ],
    queryKey: (params: Params<'getPublicProductList'>) => [
        ...getPublicProductList.path(params),
        getPublicProductList.parameters(params)
    ]
}

export const getProductListItem: QueryKeyHelper<'getProductListItem'> = {
    parameters: (params) =>
        pick(params, ['organizationId', 'listId', 'itemId', 'siteId', ...getCustomKeys(params)]),
    path: (params) => [
        '/commerce-sdk-react',
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
