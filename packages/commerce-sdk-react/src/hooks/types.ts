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
 * The full signature of an API method, including `rawResponse` flag. Only used as a helper
 * in this file when we need to `infer Data`, so it doesn't need to be exported.
 */
interface FullApiMethod<Options extends ApiOptions, Data> extends ApiMethod<Options, Data> {
    // This second signature is necessary to omit Response when inferring Data
    (options: Options): Promise<Data>
    (options: Options, rawResponse?: boolean): Promise<Data | Response>
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
export type DataType<T extends FullApiMethod<any, unknown>> = T extends FullApiMethod<
    ApiOptions,
    infer R
>
    ? R
    : never

// --- CACHE HELPERS --- //

export interface CacheUpdate {
    update?: Array<QueryKey>
    invalidate?: Array<QueryKey>
    remove?: Array<QueryKey>
}

export type CacheUpdateGetter<Options, Data> = (
    customerId: string | null,
    params: Options,
    response: Data
) => CacheUpdate

export type CacheUpdateMatrix<Client> = {
    // It feels like we should be able to do <infer Arg, infer Data>, but that
    // results in some methods being `never`, so we just use Argument<> later
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [Method in keyof Client]?: Client[Method] extends FullApiMethod<any, infer Data>
        ? CacheUpdateGetter<Argument<Client[Method]>, Data>
        : never
}
