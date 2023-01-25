/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    ShopperBaskets,
    ShopperContexts,
    ShopperCustomers,
    ShopperDiscoverySearch,
    ShopperGiftCertificates,
    ShopperLogin,
    ShopperOrders,
    ShopperProducts,
    ShopperPromotions,
    ShopperSearch
} from 'commerce-sdk-isomorphic'

export type ApiClientConfigParams = {
    clientId: string
    organizationId: string
    siteId: string
    shortCode: string
}

export interface ApiClients {
    shopperBaskets: ShopperBaskets<ApiClientConfigParams>
    shopperContexts: ShopperContexts<ApiClientConfigParams>
    shopperCustomers: ShopperCustomers<ApiClientConfigParams>
    shopperDiscoverySearch: ShopperDiscoverySearch<ApiClientConfigParams>
    shopperGiftCertificates: ShopperGiftCertificates<ApiClientConfigParams>
    shopperLogin: ShopperLogin<ApiClientConfigParams>
    shopperOrders: ShopperOrders<ApiClientConfigParams>
    shopperProducts: ShopperProducts<ApiClientConfigParams>
    shopperPromotions: ShopperPromotions<ApiClientConfigParams>
    shopperSearch: ShopperSearch<ApiClientConfigParams>
}

/**
 * The first argument of a function.
 */
export type Argument<T extends (arg: any) => unknown> = Parameters<T>[0]

/**
 * The data type returned by a commerce-sdk-isomorphic method when the raw response
 * flag is not set.
 */
export type DataType<T extends (arg: any) => Promise<unknown>> = T extends (
    arg: any
) => Promise<Response | infer R>
    ? R
    : never

/**
 * Adds additional parameters to a function signature. To preserve named parameters
 * in the returned type, pass a named tuple for the extra parameters.
 */
export type AddParameters<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Fn extends (...args: any[]) => unknown,
    Extra extends unknown[]
    // TODO: Remove this after merging in prettier v2 changes
    // eslint-disable-next-line prettier/prettier
    > = (...newArgs: [...originalArgs: Parameters<Fn>, ...extra: Extra]) => ReturnType<Fn>