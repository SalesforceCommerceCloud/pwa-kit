/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryParams} from '../../types'

interface ShopperPromotionsParams extends QueryParams {
    ids?: string[]
}

interface ShopperPromotionsForCampaignParams extends QueryParams {
    campaignId?: string
    startDate?: string
    endDate?: string
}

export type {ShopperPromotionsParams, ShopperPromotionsForCampaignParams}
