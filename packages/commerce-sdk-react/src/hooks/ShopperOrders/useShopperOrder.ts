/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperOrdersTypes} from 'commerce-sdk-isomorphic'
import {ShopperOrderParams} from './types'
import {QueryResponse, DependencyList} from '../types'

// phase 1
const useShopperOrder = (
    params: ShopperOrderParams,
    source: DependencyList
): QueryResponse<ShopperOrdersTypes.Order> => {
    return {
        data: {},
        isLoading: false,
        error: undefined
    }
}

export default useShopperOrder
