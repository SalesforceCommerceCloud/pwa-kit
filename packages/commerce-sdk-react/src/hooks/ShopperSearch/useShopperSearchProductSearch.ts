/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import {ShopperSearchProductParams} from './types'
import {QueryResponse, DependencyList} from '../types'

const useShopperSearchProductSearch = (
    params: ShopperSearchProductParams,
    source: DependencyList
): QueryResponse<ShopperSearchTypes.ProductSearchResult> => {
    return {
        // @ts-ignore
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperSearchProductSearch
