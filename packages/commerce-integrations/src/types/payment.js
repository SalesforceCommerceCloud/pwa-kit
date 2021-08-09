/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {PaymentDetails} from './payment-details'

/**
 * @memberOf module:types
 * @typedef {Object} Payment
 * @property {String} id The payment id.
 * @property {Number} amount The payment amount.
 * @property {String} methodId The payment method id.
 * @property {module:types.PaymentDetails} details The customer's payment details for the specified payment method.
 */
export const Payment = {
    id: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    methodId: PropTypes.string.isRequired,
    details: PropTypes.shape(PaymentDetails)
}
