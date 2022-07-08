import {PublicProductListResult} from 'commerce-sdk-isomorphic'
import {ShopperCustomerPublicProductListParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCustomerPublicProductLists = (
    params: ShopperCustomerPublicProductListParams,
    source: []
): QueryResponse<PublicProductListResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerPublicProductLists
