import {Taxes} from 'commerce-sdk-isomorphic'
import {ShopperOrderParams} from './types'
import {QueryResponse} from '../../types'

const useShopperOrderTaxes = (params: ShopperOrderParams, source: []): QueryResponse<Taxes> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperOrderTaxes
