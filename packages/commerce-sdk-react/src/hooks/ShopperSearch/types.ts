/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryParams} from '../../types'

interface CommonSearchParams {
    q?: string | undefined
    limit?: number | undefined
}

interface ShopperSearchProductParams extends QueryParams, CommonSearchParams {
    refine?: string
    sort?: string
    offset?: number
}

type ShopperSearchSuggestionsParams = QueryParams & CommonSearchParams

export type {ShopperSearchProductParams, ShopperSearchSuggestionsParams}
