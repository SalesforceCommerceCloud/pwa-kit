import {CustomerProductListResult} from 'commerce-sdk-isomorphic'
import {ShopperCustomerParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCustomerProductLists = (
    params: ShopperCustomerParams,
    source: []
): QueryResponse<CustomerProductListResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerProductLists
