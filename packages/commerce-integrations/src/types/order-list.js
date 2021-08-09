/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Order} from './order'

export const OrderList = {
    count: PropTypes.number,
    data: PropTypes.arrayOf(PropTypes.shape(Order)),
    total: PropTypes.number
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} OrderList
 * @property {Number} count.
 * @property {Array.<module:@mobify/commerce-integrations/dist/types.Product>} data.
 * @property {Number} total.
 */
