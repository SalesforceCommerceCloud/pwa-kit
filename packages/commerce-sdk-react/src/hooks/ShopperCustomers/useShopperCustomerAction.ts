/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type { ShopperCustomers } from 'commerce-sdk-isomorphic'
import {ActionResponse} from '../types'
import {ShopperCustomerActions} from './types'

function useShopperCustomerAction(
    action: ShopperCustomerActions.authorizeCustomer
): ActionResponse<ShopperCustomers<any>['authorizeCustomer']>
function useShopperCustomerAction(
    action: ShopperCustomerActions
): ActionResponse<() => Promise<any>> {
    // @ts-ignore TODO: how to declare the type for dynamic key name [action]?
    return {
        [action]: () => Promise.resolve(),
        isLoading: true,
        error: undefined
    }
}

export default useShopperCustomerAction
