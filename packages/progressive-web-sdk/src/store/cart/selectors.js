/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import {createSelector} from 'reselect'
import {createGetSelector} from 'reselect-immutable-helpers'
import {getProducts} from '../products/selectors'

export const getCart = ({cart}) => cart
export const getCartCustomContent = createGetSelector(getCart, 'custom', Immutable.Map())

export const getCartLoaded = createSelector(
    getCart,
    (cart) => {
        return cart.get('items') !== undefined
    }
)

/**
 * @return Returns list of cart items
 */
export const getCartItems = createGetSelector(getCart, 'items', Immutable.List())

/**
 * @return Returns list of cart items merged with the product data for each cart item
 */
export const getCartItemsFull = createSelector(
    getCartItems,
    getProducts,
    (items, products) =>
        items.map((item) => {
            const productId = item.get('productId')
            const cartId = item.get('id')
            return item
                .mergeDeep(products.find((product) => productId === product.get('id')))
                .set('id', cartId)
        })
)

export const getItemById = (itemId) =>
    createSelector(
        getCartItems,
        (items) => {
            const filteredItems = items.filter((item) => itemId === item.get('id'))
            return filteredItems.size ? filteredItems.get(0) : Immutable.Map()
        }
    )

export const getProductIdByItemId = (itemId) => createGetSelector(getItemById(itemId), 'productId')

export const getCartHasItems = createSelector(
    getCartItems,
    (items) => items.size > 0
)

export const getCartSummaryCount = createSelector(
    getCartItems,
    (items) => items.reduce((quantity, cartItem) => quantity + cartItem.get('quantity'), 0)
)

export const getCartPageMeta = createGetSelector(getCart, 'pageMeta', Immutable.Map())

export const getSubtotal = createGetSelector(getCart, 'subtotal')
export const getOrderTotal = createGetSelector(getCart, 'orderTotal')
export const getTax = createGetSelector(getCart, 'tax')

export const getCoupons = createGetSelector(getCart, 'coupons', Immutable.List())
export const getDiscount = createGetSelector(getCart, 'discount')

export const getShipping = createGetSelector(getCart, 'shipping', Immutable.Map())
export const getShippingAmount = createGetSelector(getShipping, 'amount')
export const getShippingLabel = createGetSelector(getShipping, 'label')
