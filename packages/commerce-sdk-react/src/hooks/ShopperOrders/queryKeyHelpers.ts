/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ShopperOrders} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {getCustomKeys, pick} from '../utils'
import paramKeysMap from './paramKeys'

// We must use a client with no parameters in order to have required/optional match the API spec
type Client = ShopperOrders<{shortCode: string}>
type Params<T extends keyof QueryKeys> = Partial<Argument<Client[T]>['parameters']>
export type QueryKeys = {
    getOrder: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/orders/',
        string | undefined,
        Params<'getOrder'>
    ]
    getPaymentMethodsForOrder: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/orders/',
        string | undefined,
        '/payment-methods',
        Params<'getPaymentMethodsForOrder'>
    ]
    getTaxesFromOrder: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/orders/',
        string | undefined,
        '/taxes',
        Params<'getTaxesFromOrder'>
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

export const getOrder: QueryKeyHelper<'getOrder'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/orders/',
        params.orderNo
    ],
    queryKey: (params: Params<'getOrder'>) => {
        const paramKeys = [...paramKeysMap['getOrder'], ...getCustomKeys(params)]

        return [...getOrder.path(params), pick(params, paramKeys)]
    }
}

export const getPaymentMethodsForOrder: QueryKeyHelper<'getPaymentMethodsForOrder'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/orders/',
        params.orderNo,
        '/payment-methods'
    ],
    queryKey: (params: Params<'getPaymentMethodsForOrder'>) => {
        const paramKeys = [...paramKeysMap['getPaymentMethodsForOrder'], ...getCustomKeys(params)]

        return [...getPaymentMethodsForOrder.path(params), pick(params, paramKeys)]
    }
}

export const getTaxesFromOrder: QueryKeyHelper<'getTaxesFromOrder'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params.organizationId,
        '/orders/',
        params.orderNo,
        '/taxes'
    ],
    queryKey: (params: Params<'getTaxesFromOrder'>) => {
        const paramKeys = [...paramKeysMap['getTaxesFromOrder'], ...getCustomKeys(params)]

        return [...getTaxesFromOrder.path(params), pick(params, paramKeys)]
    }
}
