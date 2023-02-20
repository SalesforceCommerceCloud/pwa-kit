/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Query, QueryClient} from '@tanstack/react-query'
import {ApiClient, ApiOptions, CacheUpdate, MergedOptions} from './types'

/** Applies the set of cache updates to the query client. */
export const updateCache = (queryClient: QueryClient, cacheUpdates: CacheUpdate, data: unknown) => {
    cacheUpdates.invalidate?.forEach((predicate) => queryClient.invalidateQueries({predicate}))
    cacheUpdates.remove?.forEach((predicate) => queryClient.removeQueries({predicate}))
    cacheUpdates.update?.forEach(({queryKey, updater}) =>
        // If an updater isn't given, fall back to just setting the data
        queryClient.setQueryData(queryKey, updater ?? data)
    )
}

/** Error thrown when a method is not implemented. */
export class NotImplementedError extends Error {
    constructor(method = 'This method') {
        super(`${method} is not implemented.`)
    }
}

/** Determines whether a value is an object. */
export const isObject = (obj: unknown): obj is Record<string, unknown> =>
    typeof obj === 'object' && obj !== null

/** Determines whether a value has all of the given keys. */
export const hasAllKeys = <T>(object: T, keys: ReadonlyArray<keyof T>): boolean =>
    keys.every((key) => object[key] !== undefined)

/** Creates a query predicate that determines whether a query key starts with the given path segments. */
export const pathStartsWith =
    (search: readonly string[]) =>
    ({queryKey}: Query): boolean =>
        queryKey.length >= search.length && search.every((lookup, idx) => queryKey[idx] === lookup)

/** Creates a query predicate that determines whether a query key fully matches the given path segments. */
export const matchesPath =
    (search: readonly string[]) =>
    ({queryKey}: Query): boolean =>
        // ApiQueryKey = [...path, parameters]
        queryKey.length === 1 + search.length &&
        search.every((lookup, idx) => queryKey[idx] === lookup)

/**
 * Creates a query predicate that determines whether the parameters of the query key exactly match
 * the search object.
 */
export const matchParametersStrict =
    (search: Record<string, unknown>) =>
    ({queryKey}: Query): boolean => {
        const parameters = queryKey[queryKey.length - 1]
        if (!isObject(parameters)) return false
        const searchEntries = Object.entries(search)
        return (
            // Can't be a match if we're looking for more values than we have
            searchEntries.length > Object.keys(parameters).length &&
            // TODO: Support arrays - parameters can also be string | number
            searchEntries.every(([key, lookup]) => parameters[key] === lookup)
        )
    }

/**
 * Creates a query predicate that determines whether the parameters of the query key match the
 * search object, for the subset of given keys present on the search object.
 */
const matchParameters = (parameters: Record<string, unknown>, keys = Object.keys(parameters)) => {
    const search: Record<string, unknown> = {}
    for (const key of keys) {
        if (parameters[key] !== undefined) search[key] = parameters[key]
    }
    return matchParametersStrict(search)
}

/** Creates a query predicate that matches against common API config parameters. */
export const matchesApiConfig = (parameters: Record<string, unknown>) =>
    matchParameters(parameters, [
        'clientId',
        'currency', // TODO: maybe?
        'locale', // TODO: maybe?
        'organizationId',
        'shortCode',
        'siteId',
        // Version is never used directly by us, but is set on the client config
        // in `commerce-sdk-isomorphic`, so we include it here for completeness
        'version'
    ])

/** Creates a query predicate that returns true if all of the given predicates return true. */
export const and =
    <Args extends unknown[]>(...funcs: Array<(...args: Args) => boolean>) =>
    (...args: Args) =>
        funcs.every((fn) => fn(...args))

/**
 * Merges headers and parameters from client config into the options, mimicking the behavior
 * of commerce-sdk-isomorphic.
 */
export const mergeOptions = <Client extends ApiClient, Options extends ApiOptions>(
    client: Client,
    options: Options
): MergedOptions<Client, Options> => {
    const merged = {
        // Only include body if it is set
        ...('body' in options
            ? // I'm not entirely sure why these type assertions are necessary. It seems likely that
              // the type definitions are more complex than they need to be.
              {body: options.body as MergedOptions<Client, Options>['body']}
            : ({} as {body: never})),
        parameters: {
            ...client.clientConfig.parameters,
            ...options.parameters
        },
        headers: {
            ...client.clientConfig.parameters,
            ...options.parameters
        }
    }
    return merged
}

export const pick = <T, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> => {
    const picked = {} as Pick<T, K> // Assertion is not true, yet, but we make it so!
    keys.forEach((key) => (picked[key] = obj[key]))
    return picked
}
