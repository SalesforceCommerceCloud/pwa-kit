/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperCustomers} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {pickValidParams} from '../utils'

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
//         return [...getExternalProfile.path(params), pickValidParams(params, ShopperCustomers.paramKeys.getExternalProfile)]
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
        return [
            ...getCustomer.path(params),
            pickValidParams(params, ShopperCustomers.paramKeys.getCustomer)
        ]
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
        return [
            ...getCustomerAddress.path(params),
            pickValidParams(params, ShopperCustomers.paramKeys.getCustomerAddress)
        ]
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
        return [
            ...getCustomerBaskets.path(params),
            pickValidParams(params, ShopperCustomers.paramKeys.getCustomerBaskets)
        ]
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
        return [
            ...getCustomerOrders.path(params),
            pickValidParams(params, ShopperCustomers.paramKeys.getCustomerOrders)
        ]
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
        return [
            ...getCustomerPaymentInstrument.path(params),
            pickValidParams(params, ShopperCustomers.paramKeys.getCustomerPaymentInstrument)
        ]
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
        return [
            ...getCustomerProductLists.path(params),
            pickValidParams(params, ShopperCustomers.paramKeys.getCustomerProductLists)
        ]
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
        return [
            ...getCustomerProductList.path(params),
            pickValidParams(params, ShopperCustomers.paramKeys.getCustomerProductList)
        ]
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
        return [
            ...getCustomerProductListItem.path(params),
            pickValidParams(params, ShopperCustomers.paramKeys.getCustomerProductListItem)
        ]
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
            return [
                ...getPublicProductListsBySearchTerm.path(params),
                pickValidParams(
                    params,
                    ShopperCustomers.paramKeys.getPublicProductListsBySearchTerm
                )
            ]
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
        return [
            ...getPublicProductList.path(params),
            pickValidParams(params, ShopperCustomers.paramKeys.getPublicProductList)
        ]
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
        return [
            ...getProductListItem.path(params),
            pickValidParams(params, ShopperCustomers.paramKeys.getProductListItem)
        ]
    }
}
