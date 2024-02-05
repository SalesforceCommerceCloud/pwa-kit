/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ShopperProducts} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {getCustomKeys, pick} from '../utils'

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

export const getProducts: QueryKeyHelper<'getProducts'> = {
    parameters: (params) =>
        pick(params, [
            'organizationId',
            'ids',
            'inventoryIds',
            'currency',
            'expand',
            'locale',
            'allImages',
            'perPricebook',
            'siteId',
            ...getCustomKeys(params)
        ]),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/products'
    ],
    queryKey: (params: Params<'getProducts'>) => [
        ...getProducts.path(params),
        getProducts.parameters(params)
    ]
}

export const getProduct: QueryKeyHelper<'getProduct'> = {
    parameters: (params) =>
        pick(params, [
            'organizationId',
            'id',
            'inventoryIds',
            'currency',
            'expand',
            'locale',
            'allImages',
            'perPricebook',
            'siteId',
            ...getCustomKeys(params)
        ]),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/products/',
        params.id
    ],
    queryKey: (params: Params<'getProduct'>) => [
        ...getProduct.path(params),
        getProduct.parameters(params)
    ]
}

export const getCategories: QueryKeyHelper<'getCategories'> = {
    parameters: (params) =>
        pick(params, [
            'organizationId',
            'ids',
            'levels',
            'locale',
            'siteId',
            ...getCustomKeys(params)
        ]),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/categories'
    ],
    queryKey: (params: Params<'getCategories'>) => [
        ...getCategories.path(params),
        getCategories.parameters(params)
    ]
}

export const getCategory: QueryKeyHelper<'getCategory'> = {
    parameters: (params) =>
        pick(params, [
            'organizationId',
            'id',
            'levels',
            'locale',
            'siteId',
            ...getCustomKeys(params)
        ]),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/categories/',
        params.id
    ],
    queryKey: (params: Params<'getCategory'>) => [
        ...getCategory.path(params),
        getCategory.parameters(params)
    ]
}
