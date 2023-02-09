/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Query, Updater} from '@tanstack/react-query'
import {
    ShopperBaskets,
    ShopperContexts,
    ShopperCustomers,
    ShopperDiscoverySearch,
    ShopperExperience,
    ShopperGiftCertificates,
    ShopperLogin,
    ShopperOrders,
    ShopperProducts,
    ShopperPromotions,
    ShopperSearch
} from 'commerce-sdk-isomorphic'

// --- GENERAL UTILITIES --- //

/**
 * Marks the given keys as required.
 */
// The outer Pick<...> is used to prettify the result type
type RequireKeys<T, K extends keyof T> = Pick<T & Required<Pick<T, K>>, keyof T>

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
    shopperExperience: ShopperExperience<ApiClientConfigParams>
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
    Parameters extends object = Record<string, unknown>,
    Headers extends Record<string, string> = Record<string, string>,
    Body extends object | unknown[] | undefined = Record<string, unknown> | unknown[] | undefined
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
export type DataType<T> = T extends ApiMethod<any, Response | infer R> ? R : never

/**
 * Merged headers and parameters from client config and options, mimicking the behavior
 * of commerce-sdk-isomorphic.
 */
export type MergedOptions<Client extends ApiClient, Options extends ApiOptions> = RequireKeys<
    ApiOptions<
        NonNullable<Client['clientConfig']['parameters'] & Options['parameters']>,
        NonNullable<Client['clientConfig']['headers'] & Options['headers']>,
        Options['body']
    >,
    'parameters' | 'headers'
>

// --- CACHE HELPERS --- //

export type ApiQueryKey =
    // | readonly string[] // TODO: Is this needed?
    readonly [...path: string[], parameters: Record<string, unknown>]

export type CacheUpdateUpdate<T> = {
    queryKey: ApiQueryKey
    updater: Updater<T | undefined, T | undefined>
}

export type CacheUpdateInvalidate = (query: Query) => boolean

export type CacheUpdateRemove = (query: Query) => boolean

export type CacheUpdate = {
    update?: CacheUpdateUpdate<unknown>[]
    invalidate?: CacheUpdateInvalidate[]
    remove?: CacheUpdateRemove[]
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
    [Method in keyof Client]?: Client[Method] extends ApiMethod<any, Response | infer Data>
        ? CacheUpdateGetter<Argument<Client[Method]>, Data>
        : never
}
