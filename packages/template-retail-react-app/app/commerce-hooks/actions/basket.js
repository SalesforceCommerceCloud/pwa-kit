import {basketShopperAPI} from '../api'

export const addItemToCart = async (dispatch, item, basketId) => {
    const shopperBaskets = basketShopperAPI()
    console.log('shopperBaskets', shopperBaskets)
    dispatch({type: 'loading'})
    try {
        const res = await shopperBaskets.addItemToBasket({
            body: item,
            parameters: {basketId}
        })
        dispatch({type: 'add_to_cart', payload: res})
    } catch (err) {
        dispatch({type: 'basket_error'})
        throw new Error(err)
    }
}
