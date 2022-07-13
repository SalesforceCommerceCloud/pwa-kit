/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {PaymentMethodResult} from 'commerce-sdk-isomorphic'
import {ShopperOrderParams} from './types'
import {QueryResponse, DependencyList} from '../types'

const useShopperOrderPaymentMethods = (
    params: ShopperOrderParams,
    source: DependencyList
): QueryResponse<PaymentMethodResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperOrderPaymentMethods
