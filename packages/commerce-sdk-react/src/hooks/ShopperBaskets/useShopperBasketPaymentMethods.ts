import {PaymentMethodResult} from 'commerce-sdk-isomorphic'
import {QueryResponse} from '../../types'
import {ShopperBasketParams} from './types'

const useShopperBasketPaymentMethods = (
    params: ShopperBasketParams,
    source: []
): QueryResponse<PaymentMethodResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperBasketPaymentMethods
