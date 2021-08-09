/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'

/**
 * @memberOf module:types
 * @typedef {Object} SortOption
 * @property {String} id The unique sort identifier.
 * @property {String} label The sort label.
 */
export const SortOption = {
    id: PropTypes.string,
    label: PropTypes.string
}
