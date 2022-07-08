import {ActionResponse} from '../../types'
import {ShopperCustomerActions} from './types'

// Q: how do we link the return types for actions?
type execute = () => Promise<any>

const useShopperCustomerAction = (action: ShopperCustomerActions): ActionResponse<execute> => {
    return {
        execute: () => Promise.resolve(),
        isLoading: true,
        error: undefined,
    }
}

export default useShopperCustomerAction
