/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'

export const CouponEntry = {
    id: PropTypes.string.isRequired,
    active: PropTypes.boolean,
    code: PropTypes.string.isRequired,
    name: PropTypes.string,
    description: PropTypes.string
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} CouponEntry
 * @property {String} id The coupon id.
 * @property {Boolean} active The coupon status, whether it's active or not.
 * @property {String} code The coupon code.
 * @property {String} name The coupon name.
 * @property {String} description The coupon description.
 */
