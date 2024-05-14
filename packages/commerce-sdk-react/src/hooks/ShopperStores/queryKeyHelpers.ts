/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ShopperStores} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {getCustomKeys, pick} from '../utils'
import paramKeysMap from './paramKeys'

// We must use a client with no parameters in order to have required/optional match the API spec
type Client = ShopperStores<{shortCode: string}>
type Params<T extends keyof QueryKeys> = Partial<Argument<Client[T]>['parameters']>
export type QueryKeys = {
    searchStores: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/store-search',
        Params<'searchStores'>
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

export const searchStores: QueryKeyHelper<'searchStores'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/store-search'
    ],
    queryKey: (params: Params<'searchStores'>) => {
        const paramKeys = [...paramKeysMap['searchStores'], ...getCustomKeys(params)]
        return [...searchStores.path(params), pick(params, paramKeys)]
    }
}