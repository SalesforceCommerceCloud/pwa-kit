/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperPayments} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {pickValidParams} from '../utils'

// We must use a client with no parameters in order to have required/optional match the API spec
type Client = ShopperPayments<{shortCode: string}>
type Params<T extends keyof QueryKeys> = Partial<Argument<Client[T]>['parameters']>

export type QueryKeys = {
    getPaymentConfiguration: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/payments/',
        Params<'getPaymentConfiguration'>
    ]
}

// This is defined here, rather than `types.ts`, because it relies on `Client` and `QueryKeys`,
// and making those generic would add too much complexity.
type QueryKeyHelper<T extends keyof QueryKeys> = {
    /** Generates the path component of the query key for an endpoint. */
    path: (params: Params<T>) => ExcludeTail<QueryKeys[T]>
    /** Generates the complete query key for an endpoint. */
    queryKey: (params: Params<T>) => QueryKeys[T]
}

export const getPaymentConfiguration: QueryKeyHelper<'getPaymentConfiguration'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params?.organizationId,
        '/payments/'
    ],
    queryKey: (params: Params<'getPaymentConfiguration'>) => {
        return [
            ...getPaymentConfiguration.path(params),
            pickValidParams(params || {}, ShopperPayments.paramKeys.getPaymentConfiguration)
        ]
    }
}
