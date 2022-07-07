import {Product} from 'commerce-sdk-isomorphic'
import {ShopperProductParams} from './types'
import {QueryResponse} from '../../types'

const useShopperProduct = (params: ShopperProductParams, source: []): QueryResponse<Product> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperProduct
