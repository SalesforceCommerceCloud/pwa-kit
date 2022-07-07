import {PriceBookIds} from 'commerce-sdk-isomorphic'
import {QueryResponse} from '../../types'
import {ShopperBasketParams} from './types'

const useShopperBasketPriceBooks = (
    params: ShopperBasketParams,
    source: []
): QueryResponse<PriceBookIds> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperBasketPriceBooks
