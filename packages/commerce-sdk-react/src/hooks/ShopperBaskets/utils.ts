/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// NOTE: temporary file.. will be removed later

import {QueryClient, QueryKey} from '@tanstack/react-query'
import {ApiClients, Argument, DataType} from '../types'
import {ShopperCustomersMutationType} from '../ShopperCustomers'
import {ShopperOrdersMutationType} from '../ShopperOrders'
import {ShopperBasketMutationType} from '../ShopperBaskets'

const isObject = (item: any) => typeof item === 'object' && !Array.isArray(item) && item !== null

export interface QueryMap {
    name: string
    key: QueryKey
    hook: any
}

export interface CacheUpdateMatrixElement {
    update?: Array<QueryMap>
    invalidate?: Array<QueryMap>
    remove?: Array<QueryMap>
}

// TODO: Add more endpoints types as needed
export type CombinedMutationTypes =
    | ShopperOrdersMutationType
    | ShopperCustomersMutationType
    | ShopperBasketMutationType

type CacheUpdateMatrix = {
    [key in CombinedMutationTypes]?: (data: any, param: any) => CacheUpdateMatrixElement
}

// TODO: Add more api clients as needed
export type Client = ApiClients['shopperOrders'] &
    ApiClients['shopperCustomers'] &
    ApiClients['shopperBaskets']

export const updateCache = <Action extends CombinedMutationTypes>(
    queryClient: QueryClient,
    action: Action,
    cacheUpdateMatrix: CacheUpdateMatrix,
    response: DataType<Client[Action]>,
    params: Argument<Client[Action]>
) => {
    const isMatchingKey = (cacheQuery: {queryKey: {[x: string]: any}}, queryKey: QueryKey) =>
        queryKey.every((item, index) =>
            isObject(item) && isObject(cacheQuery.queryKey[index])
                ? Object.entries(cacheQuery.queryKey[index])
                      .sort()
                      .toString() ===
                  Object.entries(item as Record<string, unknown>)
                      .sort()
                      .toString()
                : item === cacheQuery.queryKey[index]
        )

    // STEP 1. Update data inside query cache for the matching queryKeys
    cacheUpdateMatrix[action]?.(params, response)?.update?.map((queryMap: QueryMap) => {
        const queryKey = queryMap.key
        queryClient.setQueryData(queryKey, response)
    })

    // STEP 2. Invalidate cache entries with the matching queryKeys
    cacheUpdateMatrix[action]?.(params, response)?.invalidate?.map((queryMap: QueryMap) => {
        const queryKey = queryMap.key
        queryClient.invalidateQueries({
            predicate: (cacheQuery: any) => isMatchingKey(cacheQuery, queryKey)
        })
    })

    // STEP 3. Remove cache entries with the matching queryKeys
    cacheUpdateMatrix[action]?.(params, response)?.remove?.map((queryMap: QueryMap) => {
        const queryKey = queryMap.key
        queryClient.removeQueries({
            predicate: (cacheQuery: any) => isMatchingKey(cacheQuery, queryKey)
        })
    })
}

export const NotImplemented = () => {
    throw new Error('This method is not implemented.')
}
