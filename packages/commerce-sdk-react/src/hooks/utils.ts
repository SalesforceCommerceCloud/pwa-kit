/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Query, QueryClient} from '@tanstack/react-query'
import {CacheUpdate} from './types'

export const updateCache = (queryClient: QueryClient, cacheUpdates: CacheUpdate) => {
    cacheUpdates.update?.forEach(({queryKey, updater}) =>
        queryClient.setQueryData(queryKey, updater)
    )
    cacheUpdates.invalidate?.forEach((predicate) => queryClient.invalidateQueries({predicate}))
    cacheUpdates.remove?.forEach((predicate) => queryClient.removeQueries({predicate}))
}

export class NotImplementedError extends Error {
    constructor(method = 'This method') {
        super(`${method} is not implemented.`)
    }
}

export const isObject = (obj: unknown): obj is Record<string, unknown> =>
    typeof obj === 'object' && obj !== null

export const hasAllKeys = <T>(object: T, keys: ReadonlyArray<keyof T>): boolean =>
    keys.every((key) => object[key] !== undefined)

export const startsWith =
    (search: readonly string[]) =>
    ({queryKey}: Query): boolean =>
        queryKey.length >= search.length && search.every((lookup, idx) => queryKey[idx] === lookup)

export const endMatches =
    (search: Record<string, unknown>) =>
    ({queryKey}: Query): boolean => {
        const parameters = queryKey[queryKey.length - 1]
        if (!isObject(parameters)) return false
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
