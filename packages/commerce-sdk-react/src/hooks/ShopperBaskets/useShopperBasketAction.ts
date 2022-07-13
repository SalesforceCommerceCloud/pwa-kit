/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ActionResponse} from '../../types'
import {ShopperBasketActions} from './types'

// Q: how do we link the return types for actions?
type execute = () => Promise<any>

const useShopperBasketAction = (action: ShopperBasketActions): ActionResponse<execute> => {
    return {
        execute: () => Promise.resolve(),
        isLoading: true,
        error: undefined
    }
}

export default useShopperBasketAction
