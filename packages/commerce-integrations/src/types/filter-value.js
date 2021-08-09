/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Integer} from './integer'

/**
 * @memberOf module:types
 * @typedef {Object} FilterValue
 * @property {module:types.Integer} count The filter value hit count. (For example, 10.)
 * @property {String} label The filter value label text (For example, 'Red'.)
 * @property {String} value The filter value (For example, 'red'.)
 */
export const FilterValue = {
    count: Integer,
    label: PropTypes.string,
    value: PropTypes.string
}
