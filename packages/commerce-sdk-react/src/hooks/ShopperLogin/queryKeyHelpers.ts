/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ShopperLogin} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {pick} from '../utils'

// We must use a client with no parameters in order to have required/optional match the API spec
type Client = ShopperLogin<{shortCode: string}>
type Params<T extends keyof QueryKeys> = Partial<Argument<Client[T]>['parameters']>
export type QueryKeys = {
    getUserInfo: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/oauth2/userinfo',
        Params<'getUserInfo'>
    ]
    getWellknownOpenidConfiguration: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/oauth2/.well-known/openid-configuration',
        Params<'getWellknownOpenidConfiguration'>
    ]
    getJwksUri: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/oauth2/jwks',
        Params<'getJwksUri'>
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

export const getUserInfo: QueryKeyHelper<'getUserInfo'> = {
    parameters: (params) => pick(params, ['organizationId', 'channel_id']),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/oauth2/userinfo'
    ],
    queryKey: (params: Params<'getUserInfo'>) => [
        ...getUserInfo.path(params),
        getUserInfo.parameters(params)
    ]
}

export const getWellknownOpenidConfiguration: QueryKeyHelper<'getWellknownOpenidConfiguration'> = {
    parameters: (params) => pick(params, ['organizationId']),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/oauth2/.well-known/openid-configuration'
    ],
    queryKey: (params: Params<'getWellknownOpenidConfiguration'>) => [
        ...getWellknownOpenidConfiguration.path(params),
        getWellknownOpenidConfiguration.parameters(params)
    ]
}

export const getJwksUri: QueryKeyHelper<'getJwksUri'> = {
    parameters: (params) => pick(params, ['organizationId']),
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/oauth2/jwks'
    ],
    queryKey: (params: Params<'getJwksUri'>) => [
        ...getJwksUri.path(params),
        getJwksUri.parameters(params)
    ]
}
