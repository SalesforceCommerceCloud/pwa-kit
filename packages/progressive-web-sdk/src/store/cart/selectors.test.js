/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import Immutable from 'immutable'
import * as selectors from './selectors'

/* eslint-disable newline-per-chained-call */

const appState = {
    cart: Immutable.fromJS({
        shipping: {
            label: 'express',
            amount: '10.00'
        },
        coupons: [
            {
                couponCode: 'MAGIC',
                text: 'Promotion: 15% off',
                amount: '-54.75',
                id: '0eae5a7fa2655732704f4fa245'
            },
            {
                couponCode: 'AMAZE',
                text: 'Buy 100 get 5 dollars off',
                amount: '-5.00',
                id: '4a75f5c1d2ba9698800c537d5e'
            }
        ],
        discount: '20.00',
        subtotal: '10.00',
        tax: {
            amount: '0.00',
            label: 'tax'
        },
        orderTotal: '14.01',
        pageMeta: {
            title: 'Cart title',
            description: 'Cart description',
            keywords: 'Cart keywords'
        },
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
        ],
        custom: {
            test: 'test'
        }
    }),
    products: Immutable.fromJS({
        3: {
            id: '3',
            title: 'test'
        },
        5: {
            id: '5',
            title: 'test 2'
        }
    })
}

const noItemsState = {
    cart: Immutable.Map()
}

test('getCartCustomContent gets custom content object', () => {
    expect(selectors.getCartCustomContent(appState).toJS()).toEqual({test: 'test'})
})

test('getCartCustomContent returns empty object when it is not populated', () => {
    const emptyCustomState = {
        cart: appState.cart.delete('custom')
    }
    expect(selectors.getCartCustomContent(emptyCustomState).toJS()).toEqual({})
})

test('getCartPageMeta gets the cart pageMeta', () => {
    const pageMeta = Immutable.fromJS({
        title: 'Cart title',
        description: 'Cart description',
        keywords: 'Cart keywords'
    })
    expect(selectors.getCartPageMeta(appState)).toEqual(pageMeta)
})

test('getSubtotal gets the cart subtotal', () => {
    expect(selectors.getSubtotal(appState)).toEqual('10.00')
})

test('getOrderTotal gets the cart order total', () => {
    expect(selectors.getOrderTotal(appState)).toEqual('14.01')
})

test('getTax gets the cart tax', () => {
    const expectedTax = Immutable.fromJS({amount: '0.00', label: 'tax'})
    expect(selectors.getTax(appState)).toEqual(expectedTax)
})

test('getCoupons gets the coupons array', () => {
    const coupons = Immutable.fromJS([
        {
            couponCode: 'MAGIC',
            text: 'Promotion: 15% off',
            amount: '-54.75',
            id: '0eae5a7fa2655732704f4fa245'
        },
        {
            couponCode: 'AMAZE',
            text: 'Buy 100 get 5 dollars off',
            amount: '-5.00',
            id: '4a75f5c1d2ba9698800c537d5e'
        }
    ])
    expect(selectors.getCoupons(appState)).toEqual(coupons)
})

test('getDiscount gets the total discount applied to cart', () => {
    expect(selectors.getDiscount(appState)).toEqual('20.00')
})

test('getShippingAmount gets the Shipping amount', () => {
    expect(selectors.getShippingAmount(appState)).toEqual('10.00')
})

test('getShippingLabel gets the Shipping label', () => {
    expect(selectors.getShippingLabel(appState)).toEqual('express')
})

test('getCartItems gets the cart Items', () => {
    const expectedItems = [
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

    expect(selectors.getCartItems(appState).toJS()).toEqual(expectedItems)
})

test('getCartHasItems returns true when there are items in the cart', () => {
    expect(selectors.getCartHasItems(appState)).toBe(true)
})

test('getCartHasItems returns false when there are no items in the cart', () => {
    expect(selectors.getCartHasItems(noItemsState)).toBe(false)
})

test('getCartSummaryCount returns 0 for empty carts', () => {
    expect(selectors.getCartSummaryCount(noItemsState)).toBe(0)
})

test('getCartSummaryCount gets the summary count', () => {
    expect(selectors.getCartSummaryCount(appState)).toBe(2)
})

test('getCartLoaded returns true when cart contains items', () => {
    expect(selectors.getCartLoaded(appState)).toBe(true)
})

test('getCartLoaded returns true when cart contains items', () => {
    expect(selectors.getCartLoaded(noItemsState)).toBe(false)
})

test('getCartItemsFull', () => {
    expect(selectors.getCartItemsFull(appState).toJS()).toEqual([
        {
            configureUrl: '/configure/url',
            href: 'product/url',
            id: '1234',
            itemPrice: '6.00',
            linePrice: '6.00',
            productId: '3',
            quantity: 1,
            title: 'test'
        },
        {
            configureUrl: '/configure/url/2',
            href: 'product/url/2',
            id: '5678',
            itemPrice: '4.00',
            linePrice: '4.00',
            productId: '5',
            quantity: 1,
            title: 'test 2'
        }
    ])
})

test('getItemById returns an empty array when given a non existing item id', () => {
    expect(
        selectors
            .getItemById('1234')(appState)
            .toJS()
    ).toEqual({
        id: '1234',
        productId: '3',
        href: 'product/url',
        quantity: 1,
        itemPrice: '6.00',
        linePrice: '6.00',
        configureUrl: '/configure/url'
    })
})

test('getItemById returns an empty array when given a non existing item id', () => {
    expect(
        selectors
            .getItemById('12345')(appState)
            .toJS()
    ).toEqual({})
})

test('getProductIdByItemId returns product id when given a proper item id', () => {
    expect(selectors.getProductIdByItemId('1234')(appState)).toBe('3')
})

test('getProductIdByItemId returns product id when given a proper item id', () => {
    expect(selectors.getProductIdByItemId('12345')(appState)).toBe(undefined)
})
