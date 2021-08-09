/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {URL} from './url'

export const Link = PropTypes.shape({
    href: URL,
    text: PropTypes.string,
    title: PropTypes.string
})

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} Link
 * @property {module:@mobify/commerce-integrations/dist/types.URL} href The link's url.
 * @property {String} text The link's text.
 * @property {String} title The link's title.
 */
