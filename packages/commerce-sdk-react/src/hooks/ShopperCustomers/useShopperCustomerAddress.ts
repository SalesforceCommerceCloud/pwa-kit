import {CustomerAddress} from 'commerce-sdk-isomorphic'
import {ShopperCustomerAddressParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCustomerAddress = (
    params: ShopperCustomerAddressParams,
    source: []
): QueryResponse<CustomerAddress> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerAddress
