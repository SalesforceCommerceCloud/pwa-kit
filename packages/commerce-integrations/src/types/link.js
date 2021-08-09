/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {URL} from './url'

/**
 * @memberOf module:types
 * @typedef {Object} Link
 * @property {module:types.URL} href The link's url.
 * @property {String} text The link's text.
 * @property {String} title The link's title.
 */
export const Link = PropTypes.shape({
    href: URL,
    text: PropTypes.string,
    title: PropTypes.string
})
