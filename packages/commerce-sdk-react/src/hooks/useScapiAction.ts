/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ActionResponse, ApiClients, Argument, DataType} from './types'
import {useAsyncExecute} from './useAsync'
import useCommerceApi from './useCommerceApi'

type ShopperBasketsClient = ApiClients['shopperBaskets']

export enum ShopperBasketsActions {
    CreateBasket = 'createBasket',
    DeleteBasket = 'deleteBasket'
}

export function useShopperBasketsAction<Action extends `${ShopperBasketsActions}`>(
    action: Action
): ActionResponse<Argument<ShopperBasketsClient[Action]>, DataType<ShopperBasketsClient[Action]>> {
    type Arg = Argument<ShopperBasketsClient[Action]>
    type Data = DataType<ShopperBasketsClient[Action]>
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

    return useAsyncExecute((arg: Arg) => method.call(shopperBaskets, arg))
}

const {isLoading, error, data, execute} = useShopperBasketsAction(
    // ShopperBasketsActions.CreateBasket
    'createBasket'
)
if (isLoading) {
    console.log(error, data)
} else {
    execute({body: {}})
}
