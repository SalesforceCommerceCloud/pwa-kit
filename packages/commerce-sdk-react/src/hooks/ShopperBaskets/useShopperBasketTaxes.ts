/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Taxes} from 'commerce-sdk-isomorphic'
import {QueryResponse, DependencyList} from '../types'
import {ShopperBasketParams} from './types'

const useShopperBasketTaxes = (
    params: ShopperBasketParams,
    source: DependencyList
): QueryResponse<Taxes> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperBasketTaxes
