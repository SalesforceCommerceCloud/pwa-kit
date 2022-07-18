/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ActionResponse, ShopperOrdersInstance} from '../types'
import {ShopperOrderActions} from './types'

function useShopperOrderAction(
    action: ShopperOrderActions.createOrder
): ActionResponse<ShopperOrdersInstance['createOrder']>
function useShopperOrderAction(action: ShopperOrderActions): ActionResponse<() => Promise<any>> {
    // @ts-ignore TODO: how to declare the type for dynamic key name [action]?
    return {
        [action]: () => Promise.resolve(),
        isLoading: true,
        error: undefined
    }
}

export default useShopperOrderAction
