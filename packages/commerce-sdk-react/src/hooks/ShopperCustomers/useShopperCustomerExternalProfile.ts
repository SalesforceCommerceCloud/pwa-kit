/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import {ShopperCustomerExternalProfileParams} from './types'
import {QueryResponse, DependencyList} from '../types'

// Phase 2
const useShopperCustomerExternalProfile = (
    params: ShopperCustomerExternalProfileParams,
    source: DependencyList
): QueryResponse<ShopperCustomersTypes.CustomerExternalProfile> => {
    return {
        data: {customerId: '1', authenticationProviderId: '1', externalId: '1'},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerExternalProfile
