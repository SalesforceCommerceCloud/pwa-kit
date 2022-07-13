/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {CustomerProductListResult} from 'commerce-sdk-isomorphic'
import {ShopperCustomerProductListParams} from './types'
import {QueryResponse, DependencyList} from '../types'

const useShopperCustomerProductList = (
    params: ShopperCustomerProductListParams,
    source: DependencyList
): QueryResponse<CustomerProductListResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerProductList
