import {PaymentMethodResult} from 'commerce-sdk-isomorphic'
import {ShopperOrderParams} from './types'
import {QueryResponse} from '../../types'

const useShopperOrderPaymentMethods = (
    params: ShopperOrderParams,
    source: []
): QueryResponse<PaymentMethodResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperOrderPaymentMethods
