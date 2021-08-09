/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Category} from './category'

/**
 * @memberOf module:types
 * @typedef {Object} CategoryList
 * @property {Array.<module:types.Category>} data
 * @property {Number} count
 * @property {Number} total
 */
export const CategoryList = {
    data: PropTypes.arrayOf(PropTypes.shape(Category)),
    count: PropTypes.number,
    total: PropTypes.number
}
