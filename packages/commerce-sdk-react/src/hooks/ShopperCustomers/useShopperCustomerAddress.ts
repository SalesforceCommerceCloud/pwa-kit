/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import {ShopperCustomerAddressParams} from './types'
import {QueryResponse, DependencyList} from '../types'

// Phase 2
const useShopperCustomerAddress = (
    params: ShopperCustomerAddressParams,
    source: DependencyList
): QueryResponse<ShopperCustomersTypes.CustomerAddress> => {
    return {
        data: {
            addressId: '1',
            countryCode: '1',
            lastName: '1'
        },
        isLoading: false,
        error: undefined
    }
}

export default useShopperCustomerAddress
