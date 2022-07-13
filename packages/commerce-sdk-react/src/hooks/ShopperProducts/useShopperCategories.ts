/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {CategoryResult} from 'commerce-sdk-isomorphic'
import {ShopperCategoriesParams} from './types'
import {QueryResponse, DependencyList} from '../../types'

const useShopperCategories = (
    params: ShopperCategoriesParams,
    source: DependencyList
): QueryResponse<CategoryResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCategories
