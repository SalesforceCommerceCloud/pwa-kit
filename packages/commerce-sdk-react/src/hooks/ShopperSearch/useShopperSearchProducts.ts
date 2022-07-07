import {ProductSearchResult} from 'commerce-sdk-isomorphic'
import {ShopperSearchProductParams} from './types'
import {QueryResponse} from '../../types'

const useShopperSearchProducts = (
    params: ShopperSearchProductParams,
    source: []
): QueryResponse<ProductSearchResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperSearchProducts
