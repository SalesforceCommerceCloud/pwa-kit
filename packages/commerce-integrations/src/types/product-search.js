/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Integer} from './integer'
import {Filter} from './filter'
import {ProductSearchResult} from './product-search-result'
import {SortOption} from './sort-option'

/**
 * @memberOf module:types
 * @typedef {Object} ProductSearch
 * @property {module:types.Integer} count The number of products returned.
 * @property {Array.<module:types.Filter>} filters The available search filters.
 * @property {Array.<module:types.ProductSearchResult>} results The product search results.
 * @property {String} query The search query.
 * @property {Object} selectedFilters The selected filters applied to the results as a propertyId and value map.
 * @property {String} selectedSortingOption The selected sorting option. NOTE: Only single sorting is supported.
 * @property {Array.<module:types.SortOption>} sortingOptions The available sorting options.
 * @property {module:types.Integer} start The search start index.
 * @property {module:types.Integer} total The search hit count.
 */
export const ProductSearch = {
    count: Integer.isRequired,
    filters: PropTypes.arrayOf(PropTypes.shape(Filter)),
    results: PropTypes.arrayOf(PropTypes.shape(ProductSearchResult)),
    query: PropTypes.string,
    selectedFilters: PropTypes.object,
    selectedSortingOption: PropTypes.string,
    sortingOptions: PropTypes.arrayOf(PropTypes.shape(SortOption)),
    start: Integer.isRequired,
    total: Integer.isRequired
}
