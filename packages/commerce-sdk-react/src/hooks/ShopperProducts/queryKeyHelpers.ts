/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperProducts} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {pickValidParams} from '../utils'
// We must use a client with no parameters in order to have required/optional match the API spec
type Client = ShopperProducts<{shortCode: string}>
type Params<T extends keyof QueryKeys> = Partial<Argument<Client[T]>['parameters']>
export type QueryKeys = {
    getProducts: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/products',
        Params<'getProducts'>
    ]
    getProduct: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/products/',
        string | undefined,
        Params<'getProduct'>
    ]
    getCategories: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/categories',
        Params<'getCategories'>
    ]
    getCategory: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/categories/',
        string | undefined,
        Params<'getCategory'>
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

export const getProducts: QueryKeyHelper<'getProducts'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/products'
    ],
    queryKey: (params: Params<'getProducts'>) => {
        return [
            ...getProducts.path(params),
            pickValidParams(params, ShopperProducts.paramKeys.getProducts)
        ]
    }
}

export const getProduct: QueryKeyHelper<'getProduct'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/products/',
        params.id
    ],
    queryKey: (params: Params<'getProduct'>) => {
        return [
            ...getProduct.path(params),
            pickValidParams(params, ShopperProducts.paramKeys.getProduct)
        ]
    }
}

export const getCategories: QueryKeyHelper<'getCategories'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/categories'
    ],
    queryKey: (params: Params<'getCategories'>) => {
        return [
            ...getCategories.path(params),
            pickValidParams(params, ShopperProducts.paramKeys.getCategories)
        ]
    }
}

export const getCategory: QueryKeyHelper<'getCategory'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/categories/',
        params.id
    ],
    queryKey: (params: Params<'getCategory'>) => {
        return [
            ...getCategory.path(params),
            pickValidParams(params, ShopperProducts.paramKeys.getCategory)
        ]
    }
}
