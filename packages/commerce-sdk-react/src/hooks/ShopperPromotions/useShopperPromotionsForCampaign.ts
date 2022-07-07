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
        error: undefined,
    }
}

export default useShopperPromotionsForCampaign
