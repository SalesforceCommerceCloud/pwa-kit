/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import {ShopperCustomerProductListParams} from './types'
import {QueryResponse, DependencyList} from '../types'

// phase 1
const useShopperCustomerProductList = (
    params: ShopperCustomerProductListParams,
    source: DependencyList
): QueryResponse<ShopperCustomersTypes.CustomerProductListResult> => {
    return {
        // @ts-ignore
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerProductList
