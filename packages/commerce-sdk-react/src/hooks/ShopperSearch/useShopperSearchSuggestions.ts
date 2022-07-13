/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import {ShopperSearchSuggestionsParams} from './types'
import {QueryResponse, DependencyList} from '../types'

// phase 1
const useShopperSearchSuggestions = (
    params: ShopperSearchSuggestionsParams,
    source: DependencyList
): QueryResponse<ShopperSearchTypes.SuggestionResult> => {
    return {
        // @ts-ignore
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperSearchSuggestions
