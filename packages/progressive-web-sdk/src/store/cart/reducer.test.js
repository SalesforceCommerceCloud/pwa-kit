/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import Immutable from 'immutable'
import reducer from './reducer'
import * as results from '../../integration-manager/cart/results'

/* eslint-disable newline-per-chained-call */

const initialState = Immutable.Map()

test('unknown action type leaves state unchanged', () => {
    const action = {
        type: 'qwertyuiop'
    }
    expect(reducer(initialState, action)).toEqual(Immutable.Map())
})

test('receiveCartCustomContent updates the custom branch of the cart state', () => {
    const customContent = {test: 'cart content'}
    const expectedState = Immutable.fromJS({custom: customContent})
    const action = results.receiveCartCustomContent(customContent)

    expect(reducer(initialState, action)).toEqual(expectedState)
})

test('receiveCartContents updates the cart contents', () => {
    const cartContents = {
        subtotal: '10.00',
        orderTotal: '10.00',
        items: [
            {
                id: '1234',
                productId: '3',
                href: 'product/url',
                quantity: 1,
                itemPrice: '6.00',
                linePrice: '6.00',
                configureUrl: '/configure/url'
            },
            {
                id: '5678',
                productId: '5',
                href: 'product/url/2',
                quantity: 1,
                itemPrice: '4.00',
                linePrice: '4.00',
                configureUrl: '/configure/url/2'
            }
        ]
    }
    const expectedState = Immutable.fromJS(cartContents)
    const action = results.receiveCartContents(cartContents)

    expect(reducer(initialState, action)).toEqual(expectedState)
})

test('receiveCartTotals updates the cart totals', () => {
    const cartTotals = {
        shipping: {
            label: 'express',
            amount: '10.00'
        },
        discount: {
            amount: '-5.99',
            label: 'test discount',
            code: '123'
        },
        subtotal: '20.00',
        tax: {
            amount: '0.00',
            label: 'tax'
        },
        orderTotal: '24.01'
    }
    const action = results.receiveCartTotals(
        cartTotals.shipping,
        cartTotals.discount,
        cartTotals.subtotal,
        cartTotals.tax,
        cartTotals.orderTotal
    )
    const expectedState = Immutable.fromJS(cartTotals)

    expect(reducer(initialState, action)).toEqual(expectedState)
})
