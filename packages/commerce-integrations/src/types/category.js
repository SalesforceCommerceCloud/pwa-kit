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

/**
 * @memberOf module:types
 * @typedef {Object} Category
 * @property {String} id The category id.
 * @property {String} name The category name.
 * @property {String} description The category description.
 * @property {module:types.Image} thumbnailImage The category thumbnail image.
 * @property {module:types.Image} backgroundImage The category background image.
 * @property {Array.<module:types.Category>} categories The subcategories.
 */
export const Category = {
    ...categoryShape,
    categories: PropTypes.arrayOf(PropTypes.shape(categoryShape))
}
