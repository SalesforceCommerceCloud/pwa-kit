/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import {handleActions} from 'redux-actions'
import {mergePayload, mergePayloadSkipList, setCustomContent} from '../../utils/reducer-utils'
import {setLoggedIn, receiveUserCustomContent} from '../../integration-manager/results'
import {
    receiveAccountInfoData,
    receiveWishlistData,
    removeWishlistItem,
    receiveWishlistCustomContent,
    receiveAccountOrderListData,
    receiveCurrentOrderNumber,
    receiveUpdatedWishlistItem,
    receiveSavedAddresses
} from '../../integration-manager/account/results.js'

const initialState = Immutable.Map()

const userReducer = handleActions(
    {
        [setLoggedIn]: mergePayload,
        [receiveUserCustomContent]: mergePayload,
        [receiveSavedAddresses]: mergePayloadSkipList,
        [receiveAccountInfoData]: mergePayload,
        [receiveWishlistData]: mergePayloadSkipList,
        [removeWishlistItem]: (state, {payload: {removeItemId}}) => {
            const wishlistProductsPath = ['wishlist', 'products']
            return state.setIn(
                wishlistProductsPath,
                state
                    .getIn(wishlistProductsPath)
                    .filter((item) => item.get('itemId') !== removeItemId)
            )
        },
        [receiveAccountOrderListData]: mergePayload,
        [receiveCurrentOrderNumber]: mergePayload,
        [receiveWishlistCustomContent]: setCustomContent('wishlist'),
        [receiveUpdatedWishlistItem]: (state, {payload: {itemId, quantity}}) => {
            const wishlistProductsPath = ['wishlist', 'products']
            const wishlistProducts = state.getIn(wishlistProductsPath)
            const productIndex = wishlistProducts.findIndex(
                (product) => product.get('itemId') === itemId
            )

            const updatedWishlistProducts = wishlistProducts.setIn(
                [productIndex, 'quantity'],
                quantity
            )

            return state.setIn(wishlistProductsPath, updatedWishlistProducts)
        }
    },
    initialState
)

export default userReducer
