import {PublicProductList} from 'commerce-sdk-isomorphic'
import {ShopperCustomerPublicProductListParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCustomerPublicProductList = (
    params: ShopperCustomerPublicProductListParams,
    source: []
): QueryResponse<PublicProductList> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerPublicProductList
