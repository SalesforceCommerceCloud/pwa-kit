/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {CustomerOrderResult} from 'commerce-sdk-isomorphic'
import {ShopperCustomerOrdersParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCustomerOrders = (
    params: ShopperCustomerOrdersParams,
    source: []
): QueryResponse<CustomerOrderResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined
    }
}

export default useShopperCustomerOrders
