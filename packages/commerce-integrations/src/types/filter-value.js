/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Integer} from './integer'

export const FilterValue = {
    count: Integer,
    label: PropTypes.string,
    value: PropTypes.string
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} FilterValue
 * @property {module:@mobify/commerce-integrations/dist/types.Integer} count The filter value hit count. (For example, 10.)
 * @property {String} label The filter value label text (For example, 'Red'.)
 * @property {String} value The filter value (For example, 'red'.)
 */
