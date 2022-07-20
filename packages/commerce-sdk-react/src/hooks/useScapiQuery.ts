/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// WARNING: This is a quick and dirty file; the names (and possibly locations)
// of everything need to be be cleaned up.

import type {ShopperBasketsTypes} from 'commerce-sdk-isomorphic'
import { ApiClients, QueryResponse } from './types'
import useCommerceApi from './useCommerceApi'

type Argument<T extends (arg: any) => unknown> = T extends (arg: infer R) => unknown ? R : never
const useAsync = <T>(fn: () => Promise<T>, deps?: unknown[]): QueryResponse<T> => {
    // This is a stub implementation to validate the types.
    // The real implementation will be more React-y.
    const result: QueryResponse<T> = {
        isLoading: true
    }
    fn()
        .then(data => {
            result.isLoading = false
            result.data = data
        })
        .catch(error => {
            result.isLoading = false
            result.error = error
        })
    return result
}

export const useBasket = (arg: Argument<ApiClients<any>['shopperBaskets']['getBasket']>): QueryResponse<ShopperBasketsTypes.Basket> => {
    const {shopperBaskets} = useCommerceApi()
    return useAsync(() => shopperBaskets.getBasket(arg), [arg])
}
