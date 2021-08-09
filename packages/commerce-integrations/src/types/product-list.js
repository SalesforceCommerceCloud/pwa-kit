/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Product} from './product'

/**
 * @memberOf module:types
 * @typedef {Object} ProductList
 * @property {Number} count.
 * @property {Array.<module:types.Product>} data.
 * @property {Number} total.
 */
export const ProductList = {
    count: PropTypes.number,
    data: PropTypes.arrayOf(PropTypes.shape(Product)),
    total: PropTypes.number
}
