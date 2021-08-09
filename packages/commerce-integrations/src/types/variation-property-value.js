/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Image} from './image'

export const VariationPropertyValue = {
    name: PropTypes.string,
    value: PropTypes.string,
    mainImage: PropTypes.shape(Image),
    swatchImage: PropTypes.shape(Image)
}

/**
 * Represents values for properties (e.g. size property would have the individual sizes).
 *
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} VariationPropertyValue
 * @property {String} name
 * @property {String} value
 * @property {Image} mainImage
 * @property {Image} swatchImage
 */
