import {QueryParams} from '../../types'

interface ShopperPromotionsParams extends QueryParams {
    ids: string[] | undefined
}

interface ShopperPromotionsForCampaignParams extends QueryParams {
    campaignId: string | undefined
    startDate: string | undefined
    endDate: string | undefined
}

export type {ShopperPromotionsParams, ShopperPromotionsForCampaignParams}
