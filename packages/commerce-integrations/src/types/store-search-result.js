/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Integer, Store} from './index'

/**
 * @memberOf module:types
 * @typedef {Object} StoreSearchResult
 * @property {module:types.Integer} count The number of stores returned.
 * @property {module:types.Integer} start A zero-based index page number.
 * @property {module:types.Integer} total The total number of search hits.
 * @property {Array<module:types.Store>} stores The list of stores returned.
 */
export const StoreSearchResult = {
    count: Integer,
    start: Integer,
    total: Integer,
    stores: PropTypes.arrayOf(PropTypes.shape(Store)).isRequired
}
