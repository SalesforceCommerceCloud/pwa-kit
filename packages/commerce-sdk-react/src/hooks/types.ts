/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {InvalidateQueryFilters, QueryFilters, Updater, UseQueryOptions} from '@tanstack/react-query'
import {
    ShopperBaskets,
    ShopperContexts,
    ShopperCustomers,
    ShopperExperience,
    ShopperGiftCertificates,
    ShopperLogin,
    ShopperOrders,
    ShopperProducts,
    ShopperPromotions,
    ShopperSearch,
    ShopperSeo,
    ShopperStores
} from 'commerce-sdk-isomorphic'
import {helpers} from 'commerce-sdk-isomorphic'

// --- GENERAL UTILITIES --- //

/** Makes a type easier to read. */
export type Prettify<T extends object> = NonNullable<Pick<T, keyof T>>

/**
 * Marks the given keys as required.
 * WARNING: Does not work if T has an index signature.
 */
export type RequireKeys<T, K extends keyof T> = Prettify<T & Required<Pick<T, K>>>

/** Removes keys whose value is `never`. */
type RemoveNeverValues<T> = {
    [K in keyof T as T[K] extends never ? never : K]: T[K]
}

/** Change string index type to `never`. */
type StringIndexToNever<T> = {
    [K in keyof T]: string extends K ? never : T[K]
}

/** Removes a string index type. */
export type RemoveStringIndex<T> = RemoveNeverValues<StringIndexToNever<T>>

/** Gets the last element of an array. */
export type Tail<T extends readonly unknown[]> = T extends [...head: unknown[], tail: infer Tail]
    ? Tail
    : T

/** Remove the last entry from a tuple type. */
export type ExcludeTail<T extends readonly unknown[]> = T extends readonly [...infer Head, unknown]
    ? T extends unknown[] // Preserve mutable or readonly from the original array
        ? Head
        : Readonly<Head>
    : T // If it's a plain array, rather than a tuple, then removing the last element has no effect

/** Adds `null` as an allowed value to all properties. */
type AllowNull<T> = {[K in keyof T]: T[K] | null}

/** Gets the keys of `T` which allow `null` as a possible value. */
type NullKeys<T> = {[K in keyof T]-?: null extends T[K] ? K : never}[keyof T]

/** Removes `null` values and marks those properties as optional. */
export type NullToOptional<T> = Omit<T, NullKeys<T>> & {
    [K in keyof T]?: NonNullable<T[K]>
}

// --- API CLIENTS --- //

export type ApiClientConfigParams = {
    clientId: string
    organizationId: string
    siteId: string
    shortCode: string
    locale?: string
    currency?: string
}

/**
 * A map of commerce-sdk-isomorphic API client instances.
 */
export interface ApiClients {
    shopperBaskets: ShopperBaskets<ApiClientConfigParams>
    shopperContexts: ShopperContexts<ApiClientConfigParams>
    shopperCustomers: ShopperCustomers<ApiClientConfigParams>
    shopperExperience: ShopperExperience<ApiClientConfigParams>
    shopperGiftCertificates: ShopperGiftCertificates<ApiClientConfigParams>
    shopperLogin: ShopperLogin<ApiClientConfigParams>
    shopperOrders: ShopperOrders<ApiClientConfigParams>
    shopperProducts: ShopperProducts<ApiClientConfigParams>
    shopperPromotions: ShopperPromotions<ApiClientConfigParams>
    shopperSearch: ShopperSearch<ApiClientConfigParams>
    shopperSeo: ShopperSeo<ApiClientConfigParams>
    shopperStores: ShopperStores<ApiClientConfigParams>
}

export type ApiClient = ApiClients[keyof ApiClients]

// --- API HELPERS --- //

/**
 * Generic signature of the options objects used by commerce-sdk-isomorphic
 */
export type ApiOptions<
    Parameters extends object = Record<string, unknown>,
    Body extends object | unknown[] | undefined = Record<string, unknown> | unknown[] | undefined,
    Headers extends Record<string, string> = Record<string, string>
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
export type Argument<T extends (arg: any) => unknown> = NonNullable<Parameters<T>[0]>

/**
 * The data type returned by a commerce-sdk-isomorphic method when the raw response
 * flag is not set.
 */
export type DataType<T> = T extends ApiMethod<any, Response | infer R> ? R : never

/**
 * Merged headers and parameters from client config and options, mimicking the behavior
 * of commerce-sdk-isomorphic.
 */
export type MergedOptions<Client extends ApiClient, Options extends ApiOptions> = Required<
    ApiOptions<
        NonNullable<Client['clientConfig']['parameters'] & Options['parameters']>,
        // `body` may not exist on `Options`, in which case it is `unknown` here. Due to the type
        // constraint in `ApiOptions`, that is not a valid value. We must replace it with `never`
        // to indicate that the result type does not have a `body`.
        unknown extends Options['body'] ? never : Options['body'],
        NonNullable<Client['clientConfig']['headers'] & Options['headers']>
    >
>

/** Query key interface used by API query hooks. */
export type ApiQueryKey<Params extends Record<string, unknown> = Record<string, unknown>> =
    readonly [...path: (string | undefined)[], parameters: Params]

/** Query options for endpoint hooks. */
export type ApiQueryOptions<Method extends ApiMethod<any, unknown>> = Prettify<
    Omit<
        UseQueryOptions<DataType<Method>, unknown, DataType<Method>, ApiQueryKey>,
        'queryFn' | 'queryKey'
    >
>

/** Adds `null` as an allowed value to all parameters. */
export type NullableParameters<T extends {parameters?: object}> = {
    // This `extends` check allows us to more easily preserve required/optional parameters
    [K in keyof T]: K extends 'parameters' ? AllowNull<T[K]> : T[K]
}

/** Remove `null` and `undefined` values from all parameters. */
export type OmitNullableParameters<T extends {parameters: object}> = Omit<T, 'parameters'> & {
    parameters: NullToOptional<T['parameters']>
}

// --- CACHE HELPERS --- //

/**
 * Interface to update a cached API response.
 * @property queryKey - The query key to update
 * @property updater - Either the new data or a function that accepts old data and returns new data
 */
export type CacheUpdateUpdate<T> = {
    queryKey: ApiQueryKey
    updater?: Updater<T | undefined, T | undefined>
}

/** Query predicate for queries to invalidate */
export type CacheUpdateInvalidate = InvalidateQueryFilters

/** Query predicate for queries to remove */
export type CacheUpdateRemove = QueryFilters

/** Collection of updates to make to the cache when a request completes. */
export type CacheUpdate = {
    update?: CacheUpdateUpdate<unknown>[]
    invalidate?: CacheUpdateInvalidate[]
    remove?: CacheUpdateRemove[]
    clear?: boolean
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
    [Method in keyof Client]?: Client[Method] extends ApiMethod<any, Response | infer Data>
        ? CacheUpdateGetter<MergedOptions<Client, Argument<Client[Method]>>, Data>
        : never
}

type CustomEndpointArg = Parameters<typeof helpers.callCustomEndpoint>[0]
type CustomEndpointArgClientConfig = CustomEndpointArg['clientConfig']
// The commerce-sdk-isomorphic custom endpoint helper REQUIRES clientConfig as mandatory argument
// But we inject the configs for users from the provider, so this custom type is created
// to make clientConfig optional when calling useCustomQuery/useCustomMutation
export type OptionalCustomEndpointClientConfig = Omit<CustomEndpointArg, 'clientConfig'> & {
    clientConfig?: CustomEndpointArgClientConfig
}
