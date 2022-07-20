/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// WARNING: This is a quick and dirty file; the names (and possibly locations)
// of everything need to be be cleaned up.

import {ShopperBaskets} from 'commerce-sdk-isomorphic'
import { ActionResponse } from './types'
import useCommerceApi from './useCommerceApi'

interface SdkMethod<A, R> {
    (arg: A): Promise<R>
    // Specifying `Response` separately is important so that `R` is just the data type
    (arg: A, flag?: boolean): Promise<Response | R>
}

type Argument<T extends (arg: any) => unknown> = T extends (arg: infer R) => any ? R : never

type DataType<T extends (...args: any[]) => Promise<any>> =
    T extends SdkMethod<any, infer R> ? R : never

type ShopperBasketsAction = 'createBasket' | 'deleteBasket'

export const ShopperBasketsActions = Object.freeze({
    CreateBasket: 'createBasket',
    DeleteBasket: 'deleteBasket'
})

export function useShopperBasketsAction<Action extends ShopperBasketsAction>(
    action: Action
): ActionResponse<
    Argument<ShopperBaskets<any>[Action]>,
    DataType<ShopperBaskets<any>[Action]>
> {
    type Arg = Argument<ShopperBaskets<any>[Action]>
    type Data = DataType<ShopperBaskets<any>[Action]>
    // Directly calling `shopperBaskets[action](arg)` doesn't work, because the methods don't fully
    // overlap. Adding in this type assertion fixes that, but I don't understand why. I'm fairly
    // confident, though, that it is safe, because it seems like we're mostly re-defining what we
    // already have.
    // In addition to the assertion required to get this to work, I have also simplified the
    // overloaded SDK method to a single signature that just returns the data type. This makes it
    // easier to work with when passing to other mapped types.
    function assertMethod(fn: unknown): asserts fn is (arg: Arg) => Promise<Data> {
        if (typeof fn !== 'function') throw new Error(`Unknown action: ${action}`)
    }
    const {shopperBaskets} = useCommerceApi()
    const method = shopperBaskets[action]
    assertMethod(method)


    // This is a stub implementation to validate the types.
    // The real implementation will be more React-y.
    const result: ActionResponse<Arg, Data> = {
        isLoading: false,
        execute(arg: Arg) {
            result.isLoading = true
            method.call(shopperBaskets, arg)
            .then(data => {
                result.isLoading = false
                result.data = data
            })
            .catch(error => {
                result.isLoading = false
                result.error = error
            })
        }
    }
    return result
}
