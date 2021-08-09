/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {CustomerInformation} from './customer-info'
import {CartItem} from './cart-item'
import {OrderAddress} from './order-address'
import {Payment} from './payment'

/**
 * @memberOf module:types
 * @typedef {Object} Order
 * @property {String} id The order id.
 * @property {String} creationDate The date when the order was created.
 * @property {String} status The status of the order (such as validated, processed, shipped, or cancelled).
 * @property {module:types.CustomerInformation} customerInfo Information about the customer.
 * @property {Array.<module:types.CartItem>} items The order items.
 * @property {module:types.OrderAddress} shippingAddress The order's destination shipping address.
 * @property {module:types.OrderAddress} billingAddress The order's billing address.
 * @property {String} selectedShippingMethodId The selected shipping method for the order.
 * @property {Array.<module:types.Payment>} payments All the current payments for the order.
 * @property {Number} subtotal The subtotal before shipping, discounts, and tax.
 * @property {Number} shipping The shipping cost.
 * @property {Number} discounts The total discounts applied to the order.
 * @property {Number} tax The order's total tax.
 * @property {Number} total The order's total cost after discounts, shipping, and tax.
 *
 */
export const Order = {
    id: PropTypes.string.isRequired,
    creationDate: PropTypes.instanceOf(Date),
    status: PropTypes.string,
    customerInfo: PropTypes.shape(CustomerInformation),
    items: PropTypes.arrayOf(PropTypes.shape(CartItem)),
    shippingAddress: PropTypes.shape(OrderAddress),
    billingAddress: PropTypes.shape(OrderAddress),
    selectedShippingMethodId: PropTypes.string,
    payments: PropTypes.arrayOf(PropTypes.shape(Payment)),
    subtotal: PropTypes.number.isRequired,
    shipping: PropTypes.number.isRequired,
    discounts: PropTypes.number.isRequired,
    tax: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired
}
