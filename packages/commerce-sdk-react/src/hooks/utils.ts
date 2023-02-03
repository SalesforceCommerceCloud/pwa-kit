/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryClient, QueryKey} from '@tanstack/react-query'
import {CacheUpdate} from './types'

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
const isMatchingKey = (cacheQueryKey: QueryKey, lookupQueryKey: QueryKey): boolean =>
    lookupQueryKey.every((item, index) => deepEqual(item, cacheQueryKey[index]))

export const updateCache = (
    queryClient: QueryClient,
    cacheUpdates: CacheUpdate,
    response: unknown
) => {
    // STEP 1. Update data inside query cache for the matching queryKeys
    cacheUpdates.update?.forEach((queryKey) => {
        queryClient.setQueryData(queryKey, response)
    })

    // STEP 2. Invalidate cache entries with the matching queryKeys
    cacheUpdates.invalidate?.forEach((queryKey) => {
        queryClient.invalidateQueries({
            predicate: (cacheQuery) => isMatchingKey(cacheQuery.queryKey, queryKey)
        })
    })

    // STEP 3. Remove cache entries with the matching queryKeys
    cacheUpdates.remove?.forEach((queryKey) => {
        queryClient.removeQueries({
            predicate: (cacheQuery) => isMatchingKey(cacheQuery.queryKey, queryKey)
        })
    })
}

export class NotImplementedError extends Error {
    constructor(method = 'This method') {
        super(`${method} is not yet implemented.`)
    }
}

export const hasAllKeys = <T>(object: T, keys: ReadonlyArray<keyof T>): boolean =>
    keys.every((key) => object[key] !== undefined)
