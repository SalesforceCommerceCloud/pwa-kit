import {ActionResponse} from '../../types'
import {ShopperOrderActions} from './types'

// Q: how do we link the return types for actions?
type execute = () => Promise<any>

const useShopperOrderAction = (action: ShopperOrderActions): ActionResponse<execute> => {
    return {
        execute: () => Promise.resolve(),
        isLoading: true,
        error: undefined,
    }
}

export default useShopperOrderAction
