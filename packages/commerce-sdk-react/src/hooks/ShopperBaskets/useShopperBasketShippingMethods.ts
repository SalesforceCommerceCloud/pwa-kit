import {ShippingMethodResult} from 'commerce-sdk-isomorphic'
import {QueryResponse} from '../../types'
import {ShopperBasketParams} from './types'

const useShopperBasketShippingMethods = (
    params: ShopperBasketParams,
    source: []
): QueryResponse<ShippingMethodResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperBasketShippingMethods
