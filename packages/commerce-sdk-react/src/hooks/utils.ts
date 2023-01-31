/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryClient, QueryKey, Updater} from '@tanstack/react-query'
import {ApiClients, Argument, DataType} from './types'
import {ShopperCustomersMutationType} from './ShopperCustomers'
import {ShopperOrdersMutationType} from './ShopperOrders'
import {ShopperBasketsMutationType} from './ShopperBaskets'

const isObject = (item: unknown) =>
    typeof item === 'object' && !Array.isArray(item) && item !== null

//TODO: update data type for updater when needed
export interface QueryKeyMap {
    name: string
    key: QueryKey
    updater?: Updater<
        DataType<Client[CombinedMutationTypes]> | undefined,
        DataType<Client[CombinedMutationTypes]> | undefined
    >
}

export interface CacheUpdateMatrixElement {
    update?: Array<QueryKeyMap>
    invalidate?: Array<QueryKeyMap>
    remove?: Array<QueryKeyMap>
}

// TODO: Add more endpoints types as needed
export type CombinedMutationTypes =
    | ShopperOrdersMutationType
    | ShopperCustomersMutationType
    | ShopperBasketsMutationType

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
                ? Object.entries(cacheQuery.queryKey[index]).sort().toString() ===
                  Object.entries(item as Record<string, unknown>)
                      .sort()
                      .toString()
                : item === cacheQuery.queryKey[index]
        )

    // STEP 1. Update data inside query cache for the matching queryKeys, and updater
    cacheUpdateMatrix[action]?.(params, response)?.update?.map(({key: queryKey, updater}) => {
        queryClient.setQueryData(queryKey, updater)
    })

    // STEP 2. Invalidate cache entries with the matching queryKeys
    cacheUpdateMatrix[action]?.(params, response)?.invalidate?.map(({key: queryKey}) => {
        queryClient.invalidateQueries({
            predicate: (cacheQuery: any) => isMatchingKey(cacheQuery, queryKey)
        })
    })

    // STEP 3. Remove cache entries with the matching queryKeys
    cacheUpdateMatrix[action]?.(params, response)?.remove?.map(({key: queryKey}) => {
        queryClient.removeQueries({
            predicate: (cacheQuery: any) => isMatchingKey(cacheQuery, queryKey)
        })
    })
}

export const NotImplementedError = () => {
    throw new Error('This method is not implemented.')
}
