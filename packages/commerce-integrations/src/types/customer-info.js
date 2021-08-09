/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Email} from './email'

export const CustomerInformation = {
    id: PropTypes.string.isRequired,
    email: Email
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} CustomerInformation
 * @property {String} id The customer id.
 * @property {module:@mobify/commerce-integrations/dist/types.Email} email The customer's email.
 */
