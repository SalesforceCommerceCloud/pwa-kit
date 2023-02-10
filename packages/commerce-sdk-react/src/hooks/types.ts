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
        // `body` may not exist on `Options`, in which case it is `unknown` here. Due to the type
        // constraint in `ApiOptions`, that is not a valid value. We must replace it with `never`
        // to indicate that the result type does not have a `body`.
        unknown extends Options['body'] ? never : Options['body']
    >,
    'parameters' | 'headers'
>

// --- CACHE HELPERS --- //

/**
 * Query key interface used by API query hooks.
 */
export type ApiQueryKey =
    // | readonly string[] // TODO: Is this needed?
    readonly [...path: string[], parameters: Record<string, unknown>]

/**
 * Interface to update a cached API response.
 * @property queryKey - The query key to update
 * @property updater - Either the new data or a function that accepts old data and returns new data
 */
export type CacheUpdateUpdate<T> = {
    queryKey: ApiQueryKey
    updater: Updater<T | undefined, T | undefined>
}

/** Query predicate for queries to invalidate */
export type CacheUpdateInvalidate = (query: Query) => boolean

/** Query predicate for queries to remove */
export type CacheUpdateRemove = (query: Query) => boolean

/** Collection of updates to make to the cache when a request completes. */
export type CacheUpdate = {
    update?: CacheUpdateUpdate<unknown>[]
    invalidate?: CacheUpdateInvalidate[]
    remove?: CacheUpdateRemove[]
}

/** Generates a collection of cache updates to make for a given request. */
export type CacheUpdateGetter<Options, Data> = (
    customerId: string | null,
    options: Options,
    response: Data
) => CacheUpdate

/** Collection of cache update getters for each method of an API client. */
export type CacheUpdateMatrix<Client extends ApiClient> = {
    // It feels like we should be able to do <infer Arg, infer Data>, but that
    // results in some methods being `never`, so we just use Argument<> later
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [Method in keyof Client]?: Client[Method] extends ApiMethod<any, Response | infer Data>
        ? CacheUpdateGetter<MergedOptions<Client, Argument<Client[Method]>>, Data>
        : never
}
