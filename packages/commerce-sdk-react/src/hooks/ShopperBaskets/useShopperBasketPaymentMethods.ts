/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperBasketsTypes} from 'commerce-sdk-isomorphic'
import {QueryResponse, DependencyList} from '../types'
import {ShopperBasketParams} from './types'

const useShopperBasketPaymentMethods = (
    params: ShopperBasketParams,
    source: DependencyList
): QueryResponse<ShopperBasketsTypes.PaymentMethodResult> => {
    return {
        data: {},
        isLoading: false,
        error: undefined
    }
}

export default useShopperBasketPaymentMethods
