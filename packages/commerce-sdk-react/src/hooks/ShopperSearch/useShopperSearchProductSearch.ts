/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ProductSearchResult} from 'commerce-sdk-isomorphic'
import {ShopperSearchProductParams} from './types'
import {QueryResponse} from '../../types'

const useShopperSearchProductSearch = (
    params: ShopperSearchProductParams,
    source: []
): QueryResponse<ProductSearchResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperSearchProductSearch
