import {CustomerProductListResult} from 'commerce-sdk-isomorphic'
import {ShopperCustomerProductListParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCustomerProductList = (
    params: ShopperCustomerProductListParams,
    source: []
): QueryResponse<CustomerProductListResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerProductList
