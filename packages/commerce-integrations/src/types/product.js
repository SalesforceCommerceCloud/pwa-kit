/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {ImageSet} from './image-set'
import {Integer} from './integer'
import {Variation} from './variation'
import {VariationProperty} from './variation-property'

export const Product = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    imageSets: PropTypes.arrayOf(PropTypes.shape(ImageSet)),
    description: PropTypes.string,
    categoryId: PropTypes.string,
    brand: PropTypes.string,
    minimumOrderQuantity: Integer,
    stepQuantity: Integer,
    upc: PropTypes.string,
    unit: PropTypes.string,
    price: PropTypes.number,
    prices: PropTypes.object,
    variations: PropTypes.arrayOf(PropTypes.shape(Variation)),
    variationProperties: PropTypes.arrayOf(PropTypes.shape(VariationProperty)),
    variationValues: PropTypes.object
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} Product
 * @property {String} id The product id.
 * @property {String} name The product name.
 * @property {Array.<module:@mobify/commerce-integrations/dist/types.ImageSet>} imageSets The product's image-sets.
 * @property {String} description The product's description.
 * @property {String} categoryId The product's main category id.
 * @property {String} brand The product's brand name.
 * @property {module:@mobify/commerce-integrations/dist/types.Integer} minimumOrderQuantity The product's minimum order quantity.
 * @property {module:@mobify/commerce-integrations/dist/types.Integer} stepQuantity The product's step quantity.
 * @property {String} upc The product's universal product code.
 * @property {String} unit The product's units, such as 'each', 'ea', or 'pair'.
 * @property {Number} price The default price.
 * @property {Object} prices The map of price type label and value. For example: {'Regular': 99.99, 'Sale': 69.99}
 * @property {Array.<module:@mobify/commerce-integrations/dist/types.Variation>} variations The different variations of the product.
 * @property {Array.<module:@mobify/commerce-integrations/dist/types.VariationProperty>} variationProperties All the product variations' different properties.
 * @property {Object} variationValues The product's property values.
 */
