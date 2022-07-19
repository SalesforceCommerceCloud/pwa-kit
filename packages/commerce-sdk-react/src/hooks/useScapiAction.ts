/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// WARNING: This is a quick and dirty file; the names (and possibly locations)
// of everything need to be be cleaned up.

import { ShopperBaskets, ShopperBasketsTypes } from 'commerce-sdk-isomorphic'
import { ActionResponse, ApiClient, ApiClients, QueryResponse } from './types'
import useCommerceApi from './useCommerceApi'

interface SdkMethod<A, R> {
    (arg: A): Promise<R>
    // Specifying `Response` separately is important so that `R` is just the data type
    (arg: A, flag?: boolean): Promise<Response | R>
}

type SdkInstance<K extends string, A, R> = Record<K, SdkMethod<A, R>>
type SdkInstanceQueryHook<A, R> = (arg: A) => QueryResponse<R>

export const createQueryHookUsingInstance = <K extends string, A, R>(
    client: SdkInstance<K, A, R>,
    method: K
): SdkInstanceQueryHook<A, R> => {
    return (arg: A): QueryResponse<R> => {
        // This is barebones implementation to make sure the types work
        // Real implementation will be more React-y
        const result: QueryResponse<R> = {isLoading: true}
        client[method](arg).then(data => {
            result.isLoading = false
            result.data = data
        })
        .catch(error => {
            result.error = error
            result.isLoading = false
        })
        return result
    }
}

type Argument<T extends (arg: any) => any> = NonNullable<Parameters<T>[0]>

type Hook<T> = any

const useAsync = <T>(v:T,deps?:unknown[]):T=>v
const makeAsync = useAsync

const useBasket = (arg: Argument<ShopperBaskets<any>['getBasket']>): Hook<ShopperBasketsTypes.Basket> => {
    const {shopperBaskets} = useCommerceApi()
    return useAsync(() => shopperBaskets.getBasket(arg), [arg])
}

const ShopperBasketsActions = {
    CreateBasket: 'createBasket',
    DeleteBasket: 'deleteBasket',
} as const

type ShopperBasketsAction =
    | 'createBasket'
    | 'deleteBasket'

const useShopperBasketsAction = <A extends ShopperBasketsAction>(action: A) => {
    const {shopperBaskets} = useCommerceApi()
    const result: ActionResponse<unknown> = {
        execute (arg: Argument<ShopperBaskets<any>[A]>) {
            shopperBaskets[action](arg) // This is an error, can't figure it out.
        }
    }
}
