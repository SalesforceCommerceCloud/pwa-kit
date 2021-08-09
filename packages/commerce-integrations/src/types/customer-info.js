/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Email} from './email'

/**
 * @memberOf module:types
 * @typedef {Object} CustomerInformation
 * @property {String} id The customer id.
 * @property {module:types.Email} email The customer's email.
 */
export const CustomerInformation = {
    id: PropTypes.string.isRequired,
    email: Email
}
