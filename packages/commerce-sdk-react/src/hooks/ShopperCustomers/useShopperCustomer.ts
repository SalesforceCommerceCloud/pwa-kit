import {Customer} from 'commerce-sdk-isomorphic'
import {ShopperCustomerParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCustomer = (params: ShopperCustomerParams, source: []): QueryResponse<Customer> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomer
