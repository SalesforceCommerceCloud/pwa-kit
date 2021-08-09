/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'

export const Variation = {
    id: PropTypes.string.isRequired,
    price: PropTypes.number,
    orderable: PropTypes.boolean,
    values: PropTypes.object
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} Variation
 * @property {String} id The variation id (NOTE: In some cases this value may have to be generated).
 * @property {Number} price The product price.
 * @property {Boolean} orderable Whether this variation of the product can be ordered.
 * @property {Object} values The variation values.
 */
