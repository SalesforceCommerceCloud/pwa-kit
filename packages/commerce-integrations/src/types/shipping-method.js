/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
/**
 * @memberOf module:types
 * @typedef {Object} ShippingMethod
 * @property {String} id The shipping method id.
 * @property {String} name The shipping method name.
 * @property {Number} cost The cost of shipping.
 */
export const ShippingMethod = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    cost: PropTypes.number.isRequired
}
