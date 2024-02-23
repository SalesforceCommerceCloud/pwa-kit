/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ShopperCustomers} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {getCustomKeys, pick} from '../utils'
import paramKeysMap from './paramKeys'

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
    /** Generates the path component of the query key for an endpoint. */
    path: (params: Params<T>) => ExcludeTail<QueryKeys[T]>
    /** Generates the full query key for an endpoint. */
    queryKey: (params: Params<T>) => QueryKeys[T]
}

// TODO: Re-implement (and update description from RAML spec) when the endpoint exits closed beta.
// export const getExternalProfile: QueryKeyHelper<'getExternalProfile'> = {
//     queryKey: (params: Params<'getExternalProfile'>) => {
//         const paramKeys = [
//             ...paramKeysMap['getExternalProfile'],
//             ...getCustomKeys(getCustomerBaskets)
//         ]
//         return [...getExternalProfile.path(params), pick(params, paramKeys)]
//     }
// }

export const getCustomer: QueryKeyHelper<'getCustomer'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId
    ],
    queryKey: (params: Params<'getCustomer'>) => {
        const paramKeys = [...paramKeysMap['getCustomer'], ...getCustomKeys(params)]
        return [...getCustomer.path(params), pick(params, paramKeys)]
    }
}

export const getCustomerAddress: QueryKeyHelper<'getCustomerAddress'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId,
        '/addresses/',
        params.addressName
    ],
    queryKey: (params: Params<'getCustomerAddress'>) => {
        const paramKeys = [...paramKeysMap['getCustomerAddress'], ...getCustomKeys(params)]

        return [...getCustomerAddress.path(params), pick(params, paramKeys)]
    }
}
export const getCustomerBaskets: QueryKeyHelper<'getCustomerBaskets'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId,
        '/baskets'
    ],
    queryKey: (params: Params<'getCustomerBaskets'>) => {
        const paramKeys = [...paramKeysMap['getCustomerBaskets'], ...getCustomKeys(params)]
        return [...getCustomerBaskets.path(params), pick(params, paramKeys)]
    }
}

export const getCustomerOrders: QueryKeyHelper<'getCustomerOrders'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId,
        '/orders'
    ],
    queryKey: (params: Params<'getCustomerOrders'>) => {
        const paramKeys = [...paramKeysMap['getCustomerOrders'], ...getCustomKeys(params)]
        return [...getCustomerOrders.path(params), pick(params, paramKeys)]
    }
}

export const getCustomerPaymentInstrument: QueryKeyHelper<'getCustomerPaymentInstrument'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId,
        '/payment-instruments/',
        params.paymentInstrumentId
    ],
    queryKey: (params: Params<'getCustomerPaymentInstrument'>) => {
        const paramKeys = [
            ...paramKeysMap['getCustomerPaymentInstrument'],
            ...getCustomKeys(params)
        ]
        return [...getCustomerPaymentInstrument.path(params), pick(params, paramKeys)]
    }
}

export const getCustomerProductLists: QueryKeyHelper<'getCustomerProductLists'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId,
        '/product-lists'
    ],
    queryKey: (params: Params<'getCustomerProductLists'>) => {
        const paramKeys = [...paramKeysMap['getCustomerProductLists'], ...getCustomKeys(params)]
        return [...getCustomerProductLists.path(params), pick(params, paramKeys)]
    }
}

export const getCustomerProductList: QueryKeyHelper<'getCustomerProductList'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/customers/',
        params.customerId,
        '/product-lists/',
        params.listId
    ],
    queryKey: (params: Params<'getCustomerProductList'>) => {
        const paramKeys = [...paramKeysMap['getCustomerProductList'], ...getCustomKeys(params)]
        return [...getCustomerProductList.path(params), pick(params, paramKeys)]
    }
}

export const getCustomerProductListItem: QueryKeyHelper<'getCustomerProductListItem'> = {
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
    queryKey: (params: Params<'getCustomerProductListItem'>) => {
        const paramKeys = [...paramKeysMap['getCustomerProductListItem'], ...getCustomKeys(params)]
        return [...getCustomerProductListItem.path(params), pick(params, paramKeys)]
    }
}

export const getPublicProductListsBySearchTerm: QueryKeyHelper<'getPublicProductListsBySearchTerm'> =
    {
        path: (params) => [
            '/commerce-sdk-react',
            '/organizations/',
            params.organizationId,
            '/product-lists'
        ],
        queryKey: (params: Params<'getPublicProductListsBySearchTerm'>) => {
            const paramKeys = [
                ...paramKeysMap['getPublicProductListsBySearchTerm'],
                ...getCustomKeys(params)
            ]
            return [...getPublicProductListsBySearchTerm.path(params), pick(params, paramKeys)]
        }
    }

export const getPublicProductList: QueryKeyHelper<'getPublicProductList'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/product-lists/',
        params.listId
    ],
    queryKey: (params: Params<'getPublicProductList'>) => {
        const paramKeys = [...paramKeysMap['getPublicProductList'], ...getCustomKeys(params)]
        return [...getPublicProductList.path(params), pick(params, paramKeys)]
    }
}

export const getProductListItem: QueryKeyHelper<'getProductListItem'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/product-lists/',
        params.listId,
        '/items/',
        params.itemId
    ],
    queryKey: (params: Params<'getProductListItem'>) => {
        const paramKeys = [...paramKeysMap['getProductListItem'], ...getCustomKeys(params)]
        return [...getProductListItem.path(params), pick(params, paramKeys)]
    }
}
