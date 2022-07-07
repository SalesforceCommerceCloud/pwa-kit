import {Category} from 'commerce-sdk-isomorphic'
import {ShopperCategoryParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCategory = (params: ShopperCategoryParams, source: []): QueryResponse<Category> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCategory
