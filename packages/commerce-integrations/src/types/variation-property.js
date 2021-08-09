/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {VariationPropertyValue} from './variation-property-value'

/**
 * Represents things like "color", "size", "width", etc.
 *
 * @memberOf module:types
 * @typedef {Object} VariationProperty
 * @property {String} id The variation property id.
 * @property {String} label The variation property label.
 * @property {Array.<module:types.VariationPropertyValue>} values The variation property values.
 */
export const VariationProperty = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    values: PropTypes.arrayOf(PropTypes.shape(VariationPropertyValue))
}
