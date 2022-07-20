/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import type {ShopperBasketsTypes} from 'commerce-sdk-isomorphic'
import { ApiClients, Argument, QueryResponse } from './types'
import { useAsync } from './useAsync'
import useCommerceApi from './useCommerceApi'

export const useBasket = (arg: Argument<ApiClients['shopperBaskets']['getBasket']>): QueryResponse<ShopperBasketsTypes.Basket> => {
    const {shopperBaskets} = useCommerceApi()
    return useAsync(() => shopperBaskets.getBasket(arg), [arg])
}
