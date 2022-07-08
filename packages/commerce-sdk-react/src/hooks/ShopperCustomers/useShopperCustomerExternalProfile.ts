import {CustomerExternalProfile} from 'commerce-sdk-isomorphic'
import {ShopperCustomerExternalProfileParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCustomer = (
    params: ShopperCustomerExternalProfileParams,
    source: []
): QueryResponse<CustomerExternalProfile> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomer
