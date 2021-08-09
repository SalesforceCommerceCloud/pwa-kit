/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {FilterValue} from './filter-value'

/**
 * @memberOf module:types
 * @typedef {Object} Filter
 * @property {String} propertyId The filter's property id. (For example, color or size.)
 * @property {String} label The filter's text used for labels. (For example, the filter color may have a label attribute of "Color".)
 * @property {Array.<module:types.FilterValue>} values The filter values.
 */
export const Filter = {
    propertyId: PropTypes.string,
    label: PropTypes.string,
    values: PropTypes.arrayOf(PropTypes.shape(FilterValue))
}
