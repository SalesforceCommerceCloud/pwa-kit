/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'

export const PaymentMethod = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    types: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string
        })
    )
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} PaymentMethod
 * @property {String} id The payment method id.
 * @property {String} name The payment method name.
 * @property {Array<Object>} types The different types of the particular payment method. (For example, a credit card payment method can have types Visa and Mastercard.)
 */
