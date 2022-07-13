/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Customer} from 'commerce-sdk-isomorphic'
import {ShopperCustomerParams} from './types'
import {QueryResponse, DependencyList} from '../../types'

const useShopperCustomer = (
    params: ShopperCustomerParams,
    source: DependencyList
): QueryResponse<Customer> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomer
