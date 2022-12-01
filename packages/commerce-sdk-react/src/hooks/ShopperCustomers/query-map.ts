/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {QueryMap} from '../ShopperBaskets/utils'
import {useCustomerBaskets} from './query'

/**
 * @private
 */
export const queryMap = {
    customerBaskets(params: {customerId: string; arg: any}): QueryMap {
        const {customerId, arg} = params
        return {
            name: 'customerBaskets',
            key: ['/customers', customerId, '/baskets', arg],
            hook: () => useCustomerBaskets(arg)
        }
    }

    // TODO: add the rest
}
