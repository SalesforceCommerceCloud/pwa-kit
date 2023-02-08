/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryClient, QueryKey} from '@tanstack/react-query'
import {ApiQueryKey, CacheUpdate} from './types'

const isObject = (item: unknown): item is object => typeof item === 'object' && item !== null

const deepEqual = (a: unknown, b: unknown): boolean => {
    if (!isObject(a) || !isObject(b)) return a === b
    const aEntries = Object.entries(a)
    const bEntries = Object.entries(b)
    if (aEntries.length !== bEntries.length) return false
    return aEntries.every(([aKey, aValue], index) => {
        const [bKey, bValue] = bEntries[index]
        return aKey === bKey && deepEqual(aValue, bValue)
    })
}

/**
 * Determines whether the cache query key starts with the same values as the lookup query key
 * @param cacheQueryKey query key from the cache
 * @param lookupQueryKey partial query key to validate match against
 * @returns boolean
 */
const isMatchingKey = (cacheQueryKey: QueryKey, lookupQueryKey: ApiQueryKey): boolean =>
    lookupQueryKey.every((item, index) => deepEqual(item, cacheQueryKey[index]))

export const updateCache = (queryClient: QueryClient, cacheUpdates: CacheUpdate) => {
    // STEP 1. Update data inside query cache for the matching queryKeys
    cacheUpdates.update?.forEach(({queryKey, updater}) => {
        queryClient.setQueryData(queryKey, updater)
    })

    // STEP 2. Invalidate cache entries with the matching queryKeys
    cacheUpdates.invalidate?.forEach(({queryKey}) => {
        queryClient.invalidateQueries({
            predicate: (cacheQuery) => isMatchingKey(cacheQuery.queryKey, queryKey)
        })
    })

    // STEP 3. Remove cache entries with the matching queryKeys
    cacheUpdates.remove?.forEach(({queryKey}) => {
        queryClient.removeQueries({
            predicate: (cacheQuery) => isMatchingKey(cacheQuery.queryKey, queryKey)
        })
    })
}

export class NotImplementedError extends Error {
    constructor(method = 'This method') {
        super(`${method} is not implemented.`)
    }
}

export const hasAllKeys = <T>(object: T, keys: ReadonlyArray<keyof T>): boolean =>
    keys.every((key) => object[key] !== undefined)

export const startsWith =
    (search: readonly string[]) =>
    (queryKey: ApiQueryKey): boolean =>
        queryKey.length >= search.length && search.every((lookup, idx) => queryKey[idx] === lookup)

export const endMatches =
    (search: Record<string, unknown>) =>
    (queryKey: ApiQueryKey): boolean => {
        const parameters = queryKey[queryKey.length - 1]
        if (typeof parameters !== 'object') return false
        const searchEntries = Object.entries(search)
        // Can't be a match if we're looking for more values than we have
        if (searchEntries.length > Object.keys(parameters).length) return false
        for (const [key, lookup] of searchEntries) {
            if (parameters[key] !== lookup) return false
        }
        return true
    }

export const and =
    <Args extends unknown[]>(...funcs: Array<(...args: Args) => boolean>) =>
    (...args: Args) =>
        funcs.every((fn) => fn(...args))
