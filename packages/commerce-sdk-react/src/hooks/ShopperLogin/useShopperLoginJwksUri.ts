/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryParams, QueryResponse, DependencyList} from '../types'

// phase 2
const useShopperLoginJwksUri = (
    params: QueryParams,
    source: DependencyList
): QueryResponse<Object> => {
    return {
        // @ts-ignore
        data: {},
        isLoading: false,
        error: undefined
    }
}

export default useShopperLoginJwksUri
