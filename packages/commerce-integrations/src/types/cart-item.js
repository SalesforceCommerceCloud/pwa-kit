/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {PositiveInteger} from './positive-integer'

/**
 * @memberOf module:types
 * @typedef {Object} CartItem
 * @property {String} id The cart id.
 * @property {String} productId The product id.
 * @property {String} productName The product name.
 * @property {module:types.PositiveInteger} quantity The quantity of this product in the cart.
 * @property {Number} baseItemPrice The price for one unit of this product before discounts.
 * @property {Number} baseLinePrice The price for all units of this product before discounts (usually baseItemPrice multiplied by quantity).
 * @property {Number} itemPrice The price for one unit of this product after discounts.
 * @property {Number} linePrice The price for all units of this product in the cart, after discounts (usually baseItemPrice multiplied by quantity).
 */
export const CartItem = {
    id: PropTypes.string.isRequired,
    productId: PropTypes.string.isRequired,
    productName: PropTypes.string,
    quantity: PositiveInteger.isRequired,
    baseItemPrice: PropTypes.number.isRequired,
    baseLinePrice: PropTypes.number.isRequired,
    itemPrice: PropTypes.number.isRequired,
    linePrice: PropTypes.number.isRequired
}
