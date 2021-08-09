/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import * as Runtypes from 'runtypes'

import {URL, Meta, Money, ProductID, Text, Integer, Identifier} from '../types'

const CartItem = Runtypes.Record({
    id: Identifier,
    productId: ProductID,
    href: URL, // This is temporary
    quantity: Integer,
    /**
     * The unit price of the item
     */
    itemPrice: Money,
    /**
     * The aggregated line price of the item (typically qty * itemPrice)
     */
    linePrice: Money
})

const Coupon = Runtypes.Record({
    id: Identifier,
    couponCode: Text,
    text: Text,
    amount: Money
})

const Tax = Runtypes.Record({
    label: Text,
    amount: Money
})

const Shipping = Runtypes.Record({
    amount: Money
}).And(
    Runtypes.Partial({
        label: Text
    })
)

export const CartItems = Runtypes.Array(CartItem)

export const Cart = Runtypes.Record({
    /**
     * The cart items in the cart
     */
    items: CartItems,
    /**
     * The total of all cart line items before shipping and taxes.
     */
    subtotal: Money,
    /**
     * The total price of the order, including products, shipping and tax
     */
    orderTotal: Money
}).And(
    Runtypes.Partial({
        /**
         * Page title and meta tag data for SEO purposes
         */
        pageMeta: Meta,
        /**
         * The total discount applied to this cart
         */
        discount: Money,
        /**
         * The coupons and vouchers applied to this cart
         */
        coupons: Runtypes.Array(Coupon),
        /**
         * All taxes applied to items in this cart
         */
        taxes: Tax,
        /**
         * Sum of shipping charges applied to this cart
         */
        shipping: Shipping
    })
)
