/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Integer} from './integer'

export const ProductSearchRequest = {
    count: Integer,
    filters: PropTypes.object,
    query: PropTypes.string,
    sort: PropTypes.string,
    start: Integer
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} ProductSearchRequest
 * @property {module:@mobify/commerce-integrations/dist/types.Integer} count The number of products to return.
 * @property {Object} filters The search result filters.
 * @property {String} query The search query.
 * @property {module:@mobify/commerce-integrations/dist/types.Integer} start The starting position.
 * @property {String} sort The sorting method.
 */
