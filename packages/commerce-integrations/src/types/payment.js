/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {PaymentDetails} from './payment-details'

export const Payment = {
    id: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    methodId: PropTypes.string.isRequired,
    details: PropTypes.shape(PaymentDetails)
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} Payment
 * @property {String} id The payment id.
 * @property {Number} amount The payment amount.
 * @property {String} methodId The payment method id.
 * @property {module:@mobify/commerce-integrations/dist/types.PaymentDetails} details The customer's payment details for the specified payment method.
 */
