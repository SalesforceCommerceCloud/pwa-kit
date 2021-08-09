/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'

/* eslint-disable no-use-before-define */
export const CustomerRegistration = {
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    password: PropTypes.string.isRequired
}
/* eslint-enable no-use-before-define */

/* eslint-disable no-use-before-define */
export const HybrisCustomerRegistration = {
    titleCode: PropTypes.string.isRequired,
    ...CustomerRegistration
}
/* eslint-enable no-use-before-define */

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} CustomerRegistration
 * @property {String} firstName The customer's first name.
 * @property {String} lastName The customer's last name.
 * @property {String} email The customer's email address.
 * @property {String} password The customer's password.
 */

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} HybrisCustomerRegistration
 * @property {String} firstName The customer's first name.
 * @property {String} lastName The customer's last name.
 * @property {String} email The customer's email address.
 * @property {String} password The customer's password.
 * @property {String} titleCode The customer's title, such as Mr. or Mrs.
 */
