import {Order} from 'commerce-sdk-isomorphic'
import {ShopperOrderParams} from './types'
import {QueryResponse} from '../../types'

const useShopperOrder = (params: ShopperOrderParams, source: []): QueryResponse<Order> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperOrder
