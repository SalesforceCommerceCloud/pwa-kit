/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperProductsTypes} from 'commerce-sdk-isomorphic'
import {ShopperCategoryParams} from './types'
import {QueryResponse, DependencyList} from '../types'

// phase 1
const useShopperCategory = (
    params: ShopperCategoryParams,
    source: DependencyList
): QueryResponse<ShopperProductsTypes.Category> => {
    return {
        // @ts-ignore
        data: {},
        isLoading: true,
        error: undefined
    }
}

export default useShopperCategory
