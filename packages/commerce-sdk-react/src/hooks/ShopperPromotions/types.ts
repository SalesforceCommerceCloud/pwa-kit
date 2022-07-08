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
