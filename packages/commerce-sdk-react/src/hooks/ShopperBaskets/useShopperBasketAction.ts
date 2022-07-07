import {ActionResponse} from '../../types'
import {ShopperBasketActions} from './types'

type execute = () => Promise<any>

const useShopperBasketAction = (action: ShopperBasketActions): ActionResponse<execute> => {
    return {
        execute: () => Promise.resolve(),
        isLoading: true,
        error: undefined,
    }
}

export default useShopperBasketAction
