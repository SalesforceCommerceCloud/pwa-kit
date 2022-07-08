import {BasketsResult} from 'commerce-sdk-isomorphic'
import {ShopperCustomerParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCustomerBaskets = (
    params: ShopperCustomerParams,
    source: []
): QueryResponse<BasketsResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerBaskets
