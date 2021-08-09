/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import {handleActions} from 'redux-actions'
import {mergePayloadSkipList} from '../../utils/reducer-utils'
import {
    receiveProductDetailsProductData,
    receiveProductListProductData,
    receiveCartProductData,
    receiveWishlistProductData,
    receiveProductsData
} from '../../integration-manager/products/results'

const initialState = Immutable.Map()

const mergeWithoutOverwriting = (state, {payload}) =>
    state.mergeDeepWith((prev, next) => prev || next, payload)

const productReducer = handleActions(
    {
        [receiveProductDetailsProductData]: mergePayloadSkipList,
        [receiveProductListProductData]: mergeWithoutOverwriting,
        [receiveCartProductData]: mergeWithoutOverwriting,
        [receiveWishlistProductData]: mergeWithoutOverwriting,
        [receiveProductsData]: mergeWithoutOverwriting
    },
    initialState
)

export default productReducer
