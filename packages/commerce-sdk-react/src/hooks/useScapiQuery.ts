/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// WARNING: This is a quick and dirty file; the names (and possibly locations)
// of everything need to be be cleaned up.

import type {ClientConfigInit} from 'commerce-sdk-isomorphic'
import { QueryResponse } from './types'

interface SdkMethod<A, R> {
    (arg: A): Promise<R>
    // Specifying `Response` separately is important so that `R` is just the data type
    (arg: A, flag?: boolean): Promise<Response | R>
}

type SdkInstance<K extends string, A, R> = Record<K, SdkMethod<A, R>>

type SdkConstructor<Init extends { shortCode: string }, K extends string, A, R> = {
    new (config: ClientConfigInit<Init>): SdkInstance<K, A, R>
}

type SdkClassQueryHook<Init extends { shortCode: string }, A, R> =
    (config: ClientConfigInit<Init>, arg: A) => QueryResponse<R>

type SdkInstanceQueryHook<A, R> = (arg: A) => QueryResponse<R>

// Example usage:
// const useShopperBasketsGetBasket = createQueryHookUsingClass(ShopperBaskets, 'getBasket')
// const { data: basket, isLoading, error} = useShopperBasketsGetBasket({ ... })
export const createQueryHookUsingClass = <
    Init extends { shortCode: string },
    K extends string,
    A,
    R
>(
    SdkClass: SdkConstructor<Init, K, A, R>,
    method: K
): SdkClassQueryHook<Init, A, R> => {
    return (config: ClientConfigInit<Init>, arg: A): QueryResponse<R> => {
        // This is barebones implementation to make sure the types work
        // Real implementation will be more React-y
        const client = new SdkClass(config)
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


// Example usage:
// const { shopperBaskets } = new ShopperBaskets({ ... })
// const useShopperBasketsGetBasket = createQueryHookUsingClass(shopperBaskets, 'getBasket')
// const { data: basket, isLoading, error} = useShopperBasketsGetBasket({ ... })
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
