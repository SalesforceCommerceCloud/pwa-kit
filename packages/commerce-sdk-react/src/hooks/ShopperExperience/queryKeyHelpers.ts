/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ShopperExperience} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {getCustomKeys, pick} from '../utils'

// We must use a client with no parameters in order to have required/optional match the API spec
type Client = ShopperExperience<{shortCode: string}>
type Params<T extends keyof QueryKeys> = Partial<Argument<Client[T]>['parameters']>
export type QueryKeys = {
    getPages: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/pages',
        Params<'getPages'>
    ]
    getPage: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/pages/',
        string | undefined,
        Params<'getPage'>
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

export const getPages: QueryKeyHelper<'getPages'> = {
    parameters: (params) =>
        pick(params, [
            'organizationId',
            'categoryId',
            'productId',
            'aspectTypeId',
            'aspectAttributes',
            'parameters',
            'siteId',
            'locale',
            ...getCustomKeys(params)
        ]),
    path: (params) => ['/commerce-sdk-react', '/organizations/', params.organizationId, '/pages'],
    queryKey: (params: Params<'getPages'>) => [
        ...getPages.path(params),
        getPages.parameters(params)
    ]
}

export const getPage: QueryKeyHelper<'getPage'> = {
    parameters: (params) =>
        pick(params, [
            'organizationId',
            'pageId',
            'aspectAttributes',
            'parameters',
            'siteId',
            'locale',
            ...getCustomKeys(params)
        ]),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/pages/',
        params.pageId
    ],
    queryKey: (params: Params<'getPage'>) => [...getPage.path(params), getPage.parameters(params)]
}
