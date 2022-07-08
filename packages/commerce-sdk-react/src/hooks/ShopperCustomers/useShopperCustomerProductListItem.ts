import {CustomerProductListItem} from 'commerce-sdk-isomorphic'
import {ShopperCustomerProductListItemParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCustomerProductListItem = (
    params: ShopperCustomerProductListItemParams,
    source: []
): QueryResponse<CustomerProductListItem> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerProductListItem
