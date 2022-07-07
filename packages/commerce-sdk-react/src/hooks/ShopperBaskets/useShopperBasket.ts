import {Basket} from 'commerce-sdk-isomorphic'
import {ShopperBasketParams} from './types'
import {QueryResponse} from '../../types'

const useShopperBasket = (params: useShopperBasketParams, source: []): QueryResponse<Basket> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperBasket
