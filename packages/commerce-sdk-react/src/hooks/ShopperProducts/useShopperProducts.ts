import {ProductResult} from 'commerce-sdk-isomorphic'
import {ShopperProductsParams} from './types'
import {QueryResponse} from '../../types'

const useShopperProducts = (
    params: ShopperProductsParams,
    source: []
): QueryResponse<ProductResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperProducts
