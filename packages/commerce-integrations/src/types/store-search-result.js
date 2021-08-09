/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Integer, Store} from './index'

export const StoreSearchResult = {
    count: Integer,
    start: Integer,
    total: Integer,
    stores: PropTypes.arrayOf(PropTypes.shape(Store)).isRequired
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} StoreSearchResult
 * @property {module:@mobify/commerce-integrations/dist/types.Integer} count The number of stores returned.
 * @property {module:@mobify/commerce-integrations/dist/types.Integer} start A zero-based index page number.
 * @property {module:@mobify/commerce-integrations/dist/types.Integer} total The total number of search hits.
 * @property {Array<module:@mobify/commerce-integrations/dist/types.Store>} stores The list of stores returned.
 */
