/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import {ShopperCustomerOrdersParams} from './types'
import {QueryResponse, DependencyList} from '../types'

// phase 1
const useShopperCustomerOrders = (
    params: ShopperCustomerOrdersParams,
    source: DependencyList
): QueryResponse<ShopperCustomersTypes.CustomerOrderResult> => {
    return {
        data: {limit: 1, data: [], offset: 1, total: 1},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerOrders
