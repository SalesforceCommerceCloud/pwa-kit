/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import {ShopperCustomerProductListItemParams} from './types'
import {QueryResponse, DependencyList} from '../types'

// phase 2
const useShopperCustomerProductListItem = (
    params: ShopperCustomerProductListItemParams,
    source: DependencyList
): QueryResponse<ShopperCustomersTypes.CustomerProductListItem> => {
    return {
        // @ts-ignore
        data: {},
        isLoading: true,
        error: undefined
    }
}

export default useShopperCustomerProductListItem
