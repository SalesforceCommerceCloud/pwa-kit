/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {EVENT_ACTION} from '../../analytics/data-objects/'
import {dispatchCartAnalytics} from '../../analytics/actions'
import {getProductIdByItemId, getItemById} from '../../store/cart/selectors'

let connector = {}

export const register = (commands) => {
    connector = commands
}
/**
 * Initializes any required data for the Cart page
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initCartPage = (url, routeName) => connector.initCartPage(url, routeName)

/**
 * Retrieves the current cart information.
 * @function
 */
export const getCart = () => connector.getCart()

/**
 * Adds a product to the cart
 * @function
 * @param productId {string} The product's ID
 * @param quantity {number} The quantity to add
 * @param variant {object} (optional, connector-specific object) The variant to be added.
 * Check out the configured connector's commands for the required variant object-shape
 */
export const addToCart = (productId, quantity, variant) => (dispatch, getState) => {
    return dispatch(connector.addToCart(productId, quantity, variant)).then((cart) => {
        dispatchCartAnalytics(EVENT_ACTION.addToCart, dispatch, getState, productId, quantity)
        return cart
    })
}

/**
 * Removes an item from the cart
 * @function
 * @param itemID {string} The cart item ID to remove
 */
export const removeFromCart = (itemId) => (dispatch, getState) => {
    const state = getState()
    const productId = getProductIdByItemId(itemId)(state)
    const currentQuantity = getItemById(itemId)(state).get('quantity')
    return dispatch(connector.removeFromCart(itemId)).then((cart) => {
        dispatchCartAnalytics(
            EVENT_ACTION.removeFromCart,
            dispatch,
            getState,
            productId,
            currentQuantity
        )
        return cart
    })
}

/**
 * Removes an item from the cart
 * @function
 * @param itemID {string} The cart item ID to update
 * @param quantity {number} The new quantity
 * @param productId {string} The new product ID to replace cart item
 * @param variant {object} (optional, connector-specific object) The new product variant
 * Check out the configured connector's commands for the required variant object-shape
 */
export const updateCartItem = (itemId, quantity, productId, variant) => (dispatch, getState) => {
    const currentQuantity = getItemById(itemId)(getState()).get('quantity')
    const deltaQuantity = quantity - currentQuantity
    return dispatch(connector.updateCartItem(itemId, quantity, productId, variant)).then((cart) => {
        if (deltaQuantity > 0) {
            dispatchCartAnalytics(
                EVENT_ACTION.addToCart,
                dispatch,
                getState,
                productId,
                deltaQuantity
            )
        } else if (deltaQuantity < 0) {
            dispatchCartAnalytics(
                EVENT_ACTION.removeFromCart,
                dispatch,
                getState,
                productId,
                -deltaQuantity
            )
        }
        return cart
    })
}

/**
 * Updates the quantity of the given item in the cart
 * @function
 * @param itemID {string} The cart item ID to update
 * @param quantity {number} The new quantity
 */
export const updateItemQuantity = (itemId, newQuantity) => (dispatch, getState) => {
    const currentQuantity = getItemById(itemId)(getState()).get('quantity')
    const deltaQuantity = newQuantity - currentQuantity
    return dispatch(connector.updateItemQuantity(itemId, newQuantity)).then((cart) => {
        const productId = getProductIdByItemId(itemId)(getState())
        if (deltaQuantity > 0) {
            dispatchCartAnalytics(
                EVENT_ACTION.addToCart,
                dispatch,
                getState,
                productId,
                deltaQuantity
            )
        } else if (deltaQuantity < 0) {
            dispatchCartAnalytics(
                EVENT_ACTION.removeFromCart,
                dispatch,
                getState,
                productId,
                -deltaQuantity
            )
        }
        return cart
    })
}

/**
 * Add a product to the wishlist
 * @deprecated Use the addItemToWishlist command instead found under integration-manager/products/commands
 * @function
 * @param productId {string} The product's ID
 * @param productURL {strin} The URL of the product's detail page
 */
export const addToWishlist = (productId, productURL) => {
    console.warn(
        'The addToWishlist command has been deprecated in favour of addItemToWishlist found under integration-manager/products/commands.'
    )
    return connector.addToWishlist(productId, productURL)
}

/**
 * Estimates taxes for a proposed address and shipping method
 * @function
 * @param address {object} The address to use for tax estimation
 * @param shippingMethod {string} The shipping method to use for tax estimation (connector-specific!)
 */
export const fetchTaxEstimate = (address, shippingMethod) =>
    connector.fetchTaxEstimate(address, shippingMethod)

/**
 * Adds promo code
 * @function
 * @param couponCode {string} The coupon code to be applied
 */
export const putPromoCode = (couponCode) => connector.putPromoCode(couponCode)

/**
 * Deletes promo code
 * @function
 * @param couponCode {string} The coupon code to be removed
 */
export const deletePromoCode = (couponCode) => connector.deletePromoCode(couponCode)
