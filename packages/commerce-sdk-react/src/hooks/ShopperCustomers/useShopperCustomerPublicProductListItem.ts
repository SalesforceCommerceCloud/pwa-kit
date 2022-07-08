import {PublicProductListItem} from 'commerce-sdk-isomorphic'
import {ShopperCustomerPublicProductListItemParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCustomerPublicProductListItem = (
    params: ShopperCustomerPublicProductListItemParams,
    source: []
): QueryResponse<PublicProductListItem> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerPublicProductListItem
