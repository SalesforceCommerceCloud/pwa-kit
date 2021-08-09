/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Image} from './image'
import {VariationProperty} from './variation-property'

/**
 * @memberOf module:types
 * @typedef {Object} ProductSearchResult
 * @property {Boolean} available Whether the product is available for order.
 * @property {String} productId The product id.
 * @property {String} productName The product name.
 * @property {Number} price The product price.
 * @property {Number} rating The product rating.
 * @property {module:types.Image} defaultImage The product main image.
 * @property {Array.<module:types.VariationProperty>} variationProperties The product variations.
 */
export const ProductSearchResult = {
    available: PropTypes.bool.isRequired,
    productId: PropTypes.string.isRequired,
    productName: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    rating: PropTypes.number,
    defaultImage: PropTypes.shape(Image).isRequired,
    variationProperties: PropTypes.arrayOf(PropTypes.shape(VariationProperty))
}
