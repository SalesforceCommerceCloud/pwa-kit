/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Product} from './product'

export const ProductList = {
    count: PropTypes.number,
    data: PropTypes.arrayOf(PropTypes.shape(Product)),
    total: PropTypes.number
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} ProductList
 * @property {Number} count.
 * @property {Array.<module:@mobify/commerce-integrations/dist/types.Product>} data.
 * @property {Number} total.
 */
