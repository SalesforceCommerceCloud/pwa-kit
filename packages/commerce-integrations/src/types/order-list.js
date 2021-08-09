/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Order} from './order'

/**
 * @memberOf module:types
 * @typedef {Object} OrderList
 * @property {Number} count.
 * @property {Array.<module:types.Product>} data.
 * @property {Number} total.
 */
export const OrderList = {
    count: PropTypes.number,
    data: PropTypes.arrayOf(PropTypes.shape(Order)),
    total: PropTypes.number
}
