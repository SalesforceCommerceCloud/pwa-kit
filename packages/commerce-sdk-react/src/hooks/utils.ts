/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Query, QueryClient} from '@tanstack/react-query'
import {
    ApiClient,
    ApiOptions,
    CacheUpdate,
    MergedOptions,
    NullToOptional,
    OmitNullableParameters
} from './types'

/** Applies the set of cache updates to the query client. */
export const updateCache = (queryClient: QueryClient, cacheUpdates: CacheUpdate, data: unknown) => {
    cacheUpdates.invalidate?.forEach((invalidate) => {
        // TODO: Fix floating promises (convert updateCache to async)
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        queryClient.invalidateQueries(invalidate)
    })
    cacheUpdates.remove?.forEach((remove) => {
        queryClient.removeQueries(remove)
    })
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
    keys.every((key) => object[key] !== undefined && object[key] !== null)

/** Creates a query predicate that determines whether a query key starts with the given path segments. */
export const pathStartsWith =
    (search: readonly (string | undefined)[]) =>
    ({queryKey}: Query): boolean =>
        queryKey.length >= search.length && search.every((lookup, idx) => queryKey[idx] === lookup)

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
            // If we pass a blank override, don't actually override it.
            ...(options.parameters ? omitNullable(options.parameters) : {})
        },
        headers: {
            ...client.clientConfig.headers,
            ...options.headers
        }
    }
    return merged
}

/** Constructs a subset of the given object containing only the given keys. */
export const pick = <T extends object, K extends keyof T>(
    obj: T,
    keys: readonly K[]
): Pick<T, K> => {
    // Assertion is not true, yet, but we make it so!
    const picked = {} as Pick<T, K>
    keys.forEach((key) => {
        if (key in obj) {
            // Skip assigning optional/missing parameters
            picked[key] = obj[key]
        }
    })
    return picked
}

/** Get a subset of the given parameters that has the given keys and may contain a custom parameter. */
export const pickValidParams = <T extends object, K extends keyof T>(
    parameters: T,
    endpointParamKeys: readonly K[]
): Pick<T, K> & Record<`c_${string}`, any> => {
    const customKeys = getCustomKeys(parameters)
    const keys = [...endpointParamKeys, ...customKeys]
    return pick(parameters, keys)
}

/** Removes keys with `null` or `undefined` values from the given object. */
export const omitNullable = <T extends object>(obj: T): NullToOptional<T> => {
    // Assertion is not true, yet, but we make it so!
    const stripped = {} as NullToOptional<T>
    // Assertion because `Object.entries` is limited :\
    const entries = Object.entries(obj) as Array<[keyof T, T[keyof T]]>
    for (const [key, value] of entries) {
        if (value !== null && value !== undefined) stripped[key] = value
    }
    return stripped
}

/** Removes keys with `null` or `undefined` values from the `parameters` of the given object. */
export const omitNullableParameters = <T extends {parameters: object}>(
    obj: T
): OmitNullableParameters<T> => ({
    ...obj,
    // Without the explicit generic parameter, the generic is inferred as `object`,
    // the connection to `T` is lost, and TypeScript complains.
    parameters: omitNullable<T['parameters']>(obj.parameters)
})

/** Simple deep clone utility */
export const clone = <T>(val: T): T => {
    if (typeof val !== 'object' || val === null) return val
    if (Array.isArray(val)) return val.map(clone) as T
    const entries = Object.entries(val).map(([k, v]) => [k, clone(v)])
    return Object.fromEntries(entries) as T
}

/** get a list of custom key starting with c_**/
export const getCustomKeys = <T extends object>(obj: T) => {
    if (typeof obj !== 'object' || obj === null) {
        throw new Error('Invalid input. Expecting an object as an input.')
    }
    return Object.keys(obj).filter((key): key is keyof T & `c_${string}` => key.startsWith('c_'))
}
