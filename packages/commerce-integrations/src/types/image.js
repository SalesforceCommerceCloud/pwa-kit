/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'

/**
 * @memberOf module:types
 * @typedef {Object} Image
 * @property {String} alt The image alt text.
 * @property {String} description The image description.
 * @property {String} src The image src.
 * @property {String} title The image title.
 */
export const Image = {
    alt: PropTypes.string,
    description: PropTypes.string,
    src: PropTypes.string.isRequired,
    title: PropTypes.string
}
