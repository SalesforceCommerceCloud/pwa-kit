/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryKey} from '@tanstack/react-query'
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

// --- API CLIENTS --- //

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

export type ApiClient = ApiClients[keyof ApiClients]

// --- API HELPERS --- //

/**
 * Generic signature of the options objects used by commerce-sdk-isomorphic
 */
export type ApiOptions<
    Parameters extends Record<string, unknown> = Record<string, unknown>,
    Headers extends Record<string, string> = Record<string, string>,
    Body extends Record<string, unknown> = Record<string, unknown>
> = {
    parameters?: Parameters
    headers?: Headers
    body?: Body
}

/**
 * Generic signature of API methods exported by commerce-sdk-isomorphic
 */
export type ApiMethod<Options extends ApiOptions, Data> = {
    (options: Options): Promise<Data>
}

/**
 * The first argument of a function.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Argument<T extends (arg: any) => unknown> = NonNullable<Parameters<T>[0]>

/**
 * The data type returned by a commerce-sdk-isomorphic method when the raw response
 * flag is not set.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataType<T extends ApiMethod<any, any>> = T extends ApiMethod<any, Response | infer R>
    ? R
    : never

// --- CACHE HELPERS --- //

export type CacheUpdateBase = {
    queryKey: QueryKey // TODO: Can we do [...string, object]?
}

export type CacheUpdateUpdate<Data> = CacheUpdateBase & {
    updater: (data: Data | undefined) => Data | undefined
}

export type CacheUpdate<Data> = {
    update?: CacheUpdateUpdate<Data>[]
    invalidate?: CacheUpdateBase[]
    remove?: CacheUpdateBase[]
}

export type CacheUpdateGetter<Options, Data> = (
    customerId: string | null,
    params: Options,
    response: Data
) => CacheUpdate<Data>

export type CacheUpdateMatrix<Client> = {
    // It feels like we should be able to do <infer Arg, infer Data>, but that
    // results in some methods being `never`, so we just use Argument<> later
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [Method in keyof Client]?: Client[Method] extends ApiMethod<any, Response | infer Data>
        ? CacheUpdateGetter<Argument<Client[Method]>, Data>
        : never
}
