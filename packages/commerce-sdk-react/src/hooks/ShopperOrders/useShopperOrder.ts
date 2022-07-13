/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Order} from 'commerce-sdk-isomorphic'
import {ShopperOrderParams} from './types'
import {QueryResponse} from '../../types'

const useShopperOrder = (params: ShopperOrderParams, source: []): QueryResponse<Order> => {
    return {
        data: {},
        isLoading: true,
        error: undefined
    }
}

export default useShopperOrder
