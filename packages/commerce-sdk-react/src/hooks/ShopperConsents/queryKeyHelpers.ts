/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperConsents} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {pickValidParams} from '../utils'

// We must use a client with no parameters in order to have required/optional match the API spec
type Client = ShopperConsents<{shortCode: string}>
type Params<T extends keyof QueryKeys> = Partial<Argument<Client[T]>['parameters']>
export type QueryKeys = {
    getSubscriptions: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/shopper-consents/subscriptions',
        Params<'getSubscriptions'>
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

export const getSubscriptions: QueryKeyHelper<'getSubscriptions'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params?.organizationId,
        '/shopper-consents/subscriptions'
    ],
    queryKey: (params: Params<'getSubscriptions'>) => {
        return [
            ...getSubscriptions.path(params),
            pickValidParams(params || {}, ShopperConsents.paramKeys.getSubscriptions)
        ]
    }
}
