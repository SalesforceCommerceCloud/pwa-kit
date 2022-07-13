/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {PromotionResult} from 'commerce-sdk-isomorphic'
import {ShopperPromotionsForCampaignParams} from './types'
import {QueryResponse} from '../../types'

const useShopperPromotionsForCampaign = (
    params: ShopperPromotionsForCampaignParams,
    source: []
): QueryResponse<PromotionResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined
    }
}

export default useShopperPromotionsForCampaign
