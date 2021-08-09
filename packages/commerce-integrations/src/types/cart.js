/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {CustomerInformation} from './customer-info'
import {CartItem} from './cart-item'
import {CouponEntry} from './coupon-entry'
import {OrderAddress} from './order-address'
import {ShippingMethod} from './shipping-method'
import {Payment} from './payment'
import {PaymentMethod} from './payment-method'

/**
 * @memberOf module:types
 * @typedef {Object} Cart
 * @property {String} id The cart id.
 * @property {module:types.CustomerInformation} customerInfo The information about the cart owner.
 * @property {Array.<module:types.CartItem>} items The cart items.
 * @property {module:types.OrderAddress} shippingAddress The destination shipping address.
 * @property {module:types.OrderAddress} billingAddress The billing address.
 * @property {Array.<module:types.ShippingMethod>} shippingMethods All the possible shipping methods for the cart.
 * @property {Array.<module:types.PaymentMethod>} paymentMethods All the possible payment methods for the cart.
 * @property {String} selectedShippingMethodId The selected shipping method for the cart.
 * @property {Array.<module:types.Payment>} payments All the current payments applied to the cart (such as credit card or gift card).
 * @property {Array.<module:types.CouponEntry>} couponEntries All the current coupons applied to the cart.
 * @property {Number} subtotal The subtotal before shipping, discounts, and tax.
 * @property {Number} shipping The shipping cost.
 * @property {Number} discounts The total of all discounts applied to the cart.
 * @property {Number} tax The total tax of the cart.
 * @property {Number} total The total cost of all the items in the cart after discounts, shipping, and tax.
 *
 */
export const Cart = {
    id: PropTypes.string.isRequired,
    customerInfo: PropTypes.shape(CustomerInformation),
    items: PropTypes.arrayOf(PropTypes.shape(CartItem)),
    shippingAddress: PropTypes.shape(OrderAddress),
    billingAddress: PropTypes.shape(OrderAddress),
    shippingMethods: PropTypes.arrayOf(PropTypes.shape(ShippingMethod)),
    paymentMethods: PropTypes.arrayOf(PropTypes.shape(PaymentMethod)),
    selectedShippingMethodId: PropTypes.string,
    payments: PropTypes.arrayOf(PropTypes.shape(Payment)),
    couponEntries: PropTypes.arrayOf(PropTypes.shape(CouponEntry)),
    subtotal: PropTypes.number,
    shipping: PropTypes.number,
    discounts: PropTypes.number,
    tax: PropTypes.number,
    total: PropTypes.number
}
