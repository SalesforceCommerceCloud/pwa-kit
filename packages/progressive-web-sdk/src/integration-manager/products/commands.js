/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {EVENT_ACTION} from '../../analytics/data-objects/'
import {dispatchWishlistAnalytics, sendProductDetailAnalytics} from '../../analytics/actions'

let connector = {}

export const register = (commands) => {
    connector = commands
}

/**
 * Initializes any required data for the Product Details page
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initProductDetailsPage = (url, routeName) => (dispatch) => {
    return dispatch(connector.initProductDetailsPage(url, routeName)).then(() => {
        dispatch(sendProductDetailAnalytics(routeName))
    })
}

/**
 * Called when the user selects a product variation. This provides a
 * hook so that the connector can take some action if needed.
 * @function
 * @param {object} variationSelections The user's product variation selections
 * @param {object} variants The list of product variants
 * @param {object} categoryIds The list of product variation category IDs
 */
export const getProductVariantData = (variationSelections, variants, categoryIds) =>
    connector.getProductVariantData(variationSelections, variants, categoryIds)

/**
 * Add a product to the wishlist
 * @function
 * @param productId {string} The product's ID
 * @param productURL {string} The URL of the product's detail page
 * @param quantity {string} The quantity of items being added to the wishlist
 */
export const addItemToWishlist = (productId, productURL, quantity) => (dispatch, getState) => {
    return dispatch(connector.addItemToWishlist(productId, productURL, quantity)).then(
        (...args) => {
            dispatchWishlistAnalytics(
                EVENT_ACTION.addToWishlist,
                dispatch,
                getState,
                productId,
                quantity
            )
            return args
        }
    )
}
