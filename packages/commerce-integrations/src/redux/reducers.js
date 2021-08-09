/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2017 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import {handleActions} from 'redux-actions'
import {
    receiveCartData,
    receiveCartPaymentMethods,
    receiveCartShippingMethods,
    receiveCategoryData,
    receiveCustomerData,
    receiveOrderData,
    receiveProductData,
    receiveProductSearchData,
    receiveStoreData,
    receiveStoreSearchData
} from './actions'
import {skipListsMerger} from './utils'

const initialState = Immutable.Map()

const cartReducer = handleActions(
    {
        [receiveCartData]: (state, {payload}) => {
            const replaceState = !state || !payload || state.get('id') !== payload.id

            return replaceState
                ? Immutable.fromJS(payload)
                : state.mergeWith(skipListsMerger, payload)
        },
        [receiveCartPaymentMethods]: (state, {payload}) =>
            state.mergeDeep({
                paymentMethods: payload
            }),
        [receiveCartShippingMethods]: (state, {payload}) =>
            state.mergeDeep({
                shippingMethods: payload
            })
    },
    null
)

// TODO: This reducer isn't smart enough to reduce child categories into the root
// 'categories' redux branch, we should make it do that.
const categoryReducer = handleActions(
    {
        [receiveCategoryData]: (state, {payload}) => state.mergeDeep(payload)
    },
    initialState
)

const customerReducer = handleActions(
    {
        [receiveCustomerData]: (state, {payload}) => {
            return payload ? (state || initialState).mergeDeep(payload) : null
        }
    },
    null
)

const orderReducer = handleActions(
    {
        [receiveOrderData]: (state, {payload}) => state.mergeDeep(payload)
    },
    initialState
)

const productReducer = handleActions(
    {
        [receiveProductData]: (state, {payload}) => state.mergeDeep(payload)
    },
    initialState
)

const productSearchReducer = handleActions(
    {
        [receiveProductSearchData]: (state, {payload}) => state.mergeDeep(payload)
    },
    initialState
)

const storeReducer = handleActions(
    {
        [receiveStoreData]: (state, {payload}) => state.mergeDeep(payload)
    },
    initialState
)

const storeSearchReducer = handleActions(
    {
        [receiveStoreSearchData]: (state, {payload}) => state.mergeDeep(payload)
    },
    initialState
)

// const simpleReducer = (state = null) => state

export default {
    cart: cartReducer,
    categories: categoryReducer,
    customer: customerReducer,
    orders: orderReducer,
    products: productReducer,
    productSearches: productSearchReducer,
    stores: storeReducer,
    storeSearches: storeSearchReducer
}
