/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'

/* eslint-disable no-use-before-define */
export const Customer = {
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string
}
/* eslint-enable no-use-before-define */

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} Customer
 * @property {String} id The customer's id.
 * @property {String} firstName The customer's first name.
 * @property {String} lastName The customer's last name.
 * @property {String} email The customer's email address.
 */
