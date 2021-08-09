/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Category} from './category'

export const CategoryList = {
    data: PropTypes.arrayOf(PropTypes.shape(Category)),
    count: PropTypes.number,
    total: PropTypes.number
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} CategoryList
 * @property {Array.<module:@mobify/commerce-integrations/dist/types.Category>} data
 * @property {Number} count
 * @property {Number} total
 */
