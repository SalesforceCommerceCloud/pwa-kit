/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Image} from './image'

const categoryShape = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    description: PropTypes.string,
    thumbnailImage: PropTypes.shape(Image),
    backgroundImage: PropTypes.shape(Image)
}

export const Category = {
    ...categoryShape,
    categories: PropTypes.arrayOf(PropTypes.shape(categoryShape))
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} Category
 * @property {String} id The category id.
 * @property {String} name The category name.
 * @property {String} description The category description.
 * @property {module:@mobify/commerce-integrations/dist/types.Image} thumbnailImage The category thumbnail image.
 * @property {module:@mobify/commerce-integrations/dist/types.Image} backgroundImage The category background image.
 * @property {Array.<module:@mobify/commerce-integrations/dist/types.Category>} categories The subcategories.
 */
