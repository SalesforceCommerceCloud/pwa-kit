/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryParams} from '../types'

export interface CommonSearchParams {
    q?: string | undefined
    limit?: number | undefined
}

export interface ShopperSearchProductParams extends QueryParams, CommonSearchParams {
    refine?: string
    sort?: string
    offset?: number
}

export type ShopperSearchSuggestionsParams = QueryParams & CommonSearchParams
