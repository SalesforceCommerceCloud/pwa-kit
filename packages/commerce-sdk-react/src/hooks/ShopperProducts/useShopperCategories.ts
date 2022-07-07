import {CategoryResult} from 'commerce-sdk-isomorphic'
import {ShopperCategoriesParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCategories = (
    params: ShopperCategoriesParams,
    source: []
): QueryResponse<CategoryResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCategories
