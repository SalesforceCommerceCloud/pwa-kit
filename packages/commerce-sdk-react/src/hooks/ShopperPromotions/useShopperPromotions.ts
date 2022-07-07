import {PromotionResult} from 'commerce-sdk-isomorphic'
import {ShopperPromotionsParams} from './types'
import {QueryResponse} from '../../types'

const useShopperPromotions = (
    params: ShopperPromotionsParams,
    source: []
): QueryResponse<PromotionResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperPromotions
