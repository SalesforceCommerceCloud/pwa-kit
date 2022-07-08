import {CustomerPaymentInstrument} from 'commerce-sdk-isomorphic'
import {ShopperCustomerPaymentInstrumentParams} from './types'
import {QueryResponse} from '../../types'

const useShopperCustomerPaymentInstrument = (
    params: ShopperCustomerPaymentInstrumentParams,
    source: []
): QueryResponse<CustomerPaymentInstrument> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerPaymentInstrument
