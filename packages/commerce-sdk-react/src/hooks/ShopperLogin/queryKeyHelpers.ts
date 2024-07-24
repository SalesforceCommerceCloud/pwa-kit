/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperLogin} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {pickValidParams} from '../utils'

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
    /** Generates the path component of the query key for an endpoint. */
    path: (params: Params<T>) => ExcludeTail<QueryKeys[T]>
    /** Generates the full query key for an endpoint. */
    queryKey: (params: Params<T>) => QueryKeys[T]
}

export const getUserInfo: QueryKeyHelper<'getUserInfo'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/oauth2/userinfo'
    ],
    queryKey: (params: Params<'getUserInfo'>) => {
        return [
            ...getUserInfo.path(params),
            pickValidParams(params, ShopperLogin.paramKeys.getUserInfo)
        ]
    }
}

export const getWellknownOpenidConfiguration: QueryKeyHelper<'getWellknownOpenidConfiguration'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/oauth2/.well-known/openid-configuration'
    ],
    queryKey: (params: Params<'getWellknownOpenidConfiguration'>) => {
        return [
            ...getWellknownOpenidConfiguration.path(params),
            pickValidParams(params, ShopperLogin.paramKeys.getWellknownOpenidConfiguration)
        ]
    }
}

export const getJwksUri: QueryKeyHelper<'getJwksUri'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/oauth2/jwks'
    ],
    queryKey: (params: Params<'getJwksUri'>) => {
        return [
            ...getJwksUri.path(params),
            pickValidParams(params, ShopperLogin.paramKeys.getJwksUri)
        ]
    }
}
