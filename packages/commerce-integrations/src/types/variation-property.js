/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {VariationPropertyValue} from './variation-property-value'

export const VariationProperty = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    values: PropTypes.arrayOf(PropTypes.shape(VariationPropertyValue))
}

/**
 * Represents things like "color", "size", "width", etc.
 *
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} VariationProperty
 * @property {String} id The variation property id.
 * @property {String} label The variation property label.
 * @property {Array.<module:@mobify/commerce-integrations/dist/types.VariationPropertyValue>} values The variation property values.
 */
