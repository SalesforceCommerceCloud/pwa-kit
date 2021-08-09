/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import Immutable from 'immutable'
import * as selectors from './selectors'

/* eslint-disable newline-per-chained-call */

const addressData = {
    firstname: 'Test',
    lastname: 'User',
    addressLine1: '123 B street'
}
const currentOrderItems = [
    {
        itemName: 'Test Item',
        price: '100'
    }
]
const currentOrder = {
    date: '03/19/2017',
    status: 'complete',
    items: currentOrderItems,
    total: '120.00',
    tax: '5.00',
    shippingTotal: '15.00',
    subtotal: '100',
    billingAddress: addressData,
    paymentMethods: ['Visa **** **** **** 1111'],
    shippingMethod: 'Express Shipping',
    shippingAddress: addressData
}
const orders = {
    123: currentOrder,
    456: {
        date: '02/19/2017',
        status: 'Delivered',
        items: [
            {
                itemName: 'New Item',
                price: '200'
            }
        ],
        total: '220.00',
        tax: '6.00',
        shippingTotal: '14.00',
        billingAddress: addressData,
        paymentMethods: ['Visa **** **** **** 1111'],
        shippingMethod: 'Express Shipping',
        shippingAddress: addressData
    }
}
const appState = {
    user: Immutable.fromJS({
        currentOrderNumber: '123',
        orders
    }),
    products: Immutable.fromJS({
        3: {
            title: 'test'
        },
        5: {
            title: 'test 2'
        }
    })
}

test('getCurrentOrderNumber returns the current order number', () => {
    expect(selectors.getCurrentOrderNumber(appState)).toEqual('123')
})

test('getOrders returns the map of orders', () => {
    expect(selectors.getOrders(appState).toJS()).toEqual(orders)
})

test('getOrders returns an empty map if no orders are in the store', () => {
    const emptyOrderState = {
        user: Immutable.Map()
    }
    expect(selectors.getOrders(emptyOrderState)).toEqual(Immutable.Map())
})

test('getCurrentOrder returns the current order', () => {
    expect(selectors.getCurrentOrder(appState).toJS()).toEqual(currentOrder)
})

test('getCurrentOorder returns an empty map if no current order is found', () => {
    const noCurrentOrderState = {
        user: Immutable.fromJS({currentOrder: '123'})
    }
    expect(selectors.getCurrentOrder(noCurrentOrderState)).toEqual(Immutable.Map())
})

test('getOrderDate gets the current orders date', () => {
    expect(selectors.getOrderDate(appState)).toEqual('03/19/2017')
})

test('getOrderStatus gets the current orders status', () => {
    expect(selectors.getOrderStatus(appState)).toEqual('complete')
})

test('getOrderItems gets the current orders items', () => {
    expect(selectors.getOrderItems(appState).toJS()).toEqual(currentOrderItems)
})

test('getOrderTotal gets the current orders total', () => {
    expect(selectors.getOrderTotal(appState)).toEqual(currentOrder.total)
})

test('getOrderTax gets the current orders tax', () => {
    expect(selectors.getOrderTax(appState)).toEqual(currentOrder.tax)
})

test('getOrderShippingTotal gets the current orders shipping total', () => {
    expect(selectors.getOrderShippingTotal(appState)).toEqual(currentOrder.shippingTotal)
})

test('getOrderSubtotal gets the current orders subtotal', () => {
    expect(selectors.getOrderSubtotal(appState)).toEqual(currentOrder.subtotal)
})

test('getOrderBillingAddress gets the current orders billing address', () => {
    expect(selectors.getOrderBillingAddress(appState).toJS()).toEqual(addressData)
})

test('getOrderShippingAddress gets the current orders shipping address', () => {
    expect(selectors.getOrderShippingAddress(appState).toJS()).toEqual(addressData)
})

test('getOrderPaymentMethods gets the current orders payment method', () => {
    expect(selectors.getOrderPaymentMethods(appState).toJS()).toEqual(currentOrder.paymentMethods)
})

test('getOrderShippingMethod gets the current orders shipping method', () => {
    expect(selectors.getOrderShippingMethod(appState)).toEqual(currentOrder.shippingMethod)
})
