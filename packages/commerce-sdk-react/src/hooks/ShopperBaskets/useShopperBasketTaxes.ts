import {Taxes} from 'commerce-sdk-isomorphic'
import {QueryResponse} from '../../types'
import {ShopperBasketParams} from './types'

const useShopperBasketTaxes = (params: ShopperBasketParams, source: []): QueryResponse<Taxes> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperBasketTaxes
