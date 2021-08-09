/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Image} from './image'
import {VariationProperty} from './variation-property'

export const ImageSet = {
    images: PropTypes.arrayOf(PropTypes.shape(Image)),
    variationProperties: PropTypes.arrayOf(PropTypes.shape(VariationProperty)),
    sizeType: PropTypes.string
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} ImageSet
 * @property {Array.<module:@mobify/commerce-integrations/dist/types.Image>} images The images.
 * @property {Array.<module:@mobify/commerce-integrations/dist/types.VariationProperty>} variationProperties The variation properties that apply to the images.
 * @property {String} sizeType The images size type (such as 'small', 'medium', 'large', or 'swatch').
 */
