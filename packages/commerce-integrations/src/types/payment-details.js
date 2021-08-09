/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {PositiveInteger} from './positive-integer'

/**
 * @memberOf module:types
 * @typedef {Object} PaymentDetails Details of the payment method (such as credit card, Paypal, or gift card).
 * @property {String} type The type of payment method (such as Visa or Mastercard).
 * @property {String} holderName The name of the account holder.
 * @property {String} number The card/account number or code (such as credit card number, or gift card code).
 * @property {String} maskedNumber The card/account number or code, masked.
 * @property {String} username The card/account username. (For example, Paypal username.)
 * @property {module:types.PositiveInteger} expiryMonth The month when the card/account expires, in number form.
 * @property {module:types.PositiveInteger} expiryYear The year when the card/account expires.
 * @property {String} ccv The credit card's cvv (card verification value).
 */
export const PaymentDetails = {
    type: PropTypes.string,
    holderName: PropTypes.string,
    number: PropTypes.string,
    maskedNumber: PropTypes.string,
    username: PropTypes.string,
    expiryMonth: PositiveInteger,
    expiryYear: PositiveInteger,
    ccv: PropTypes.string
}
