/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import reducer from './reducer'
import * as results from '../../integration-manager/products/results'
import * as selectors from './selectors'

const testProduct = {
    id: '2',
    title: 'test',
    price: '1.99',
    href: '/test/product.html',
    available: true,
    customProperty: 'customValue'
}
const initialState = Immutable.Map()

test('unknown action type leaves state unchanged', () => {
    const action = {
        type: 'qwertyuiop'
    }
    expect(reducer(initialState, action)).toBe(initialState)
})

test('receiveProductDetailsProductData adds to the product map', () => {
    expect(selectors.getProductById('1')({products: initialState})).toEqual(Immutable.Map())

    const productsState = reducer(
        initialState,
        results.receiveProductDetailsProductData({1: testProduct})
    )

    expect(
        selectors
            .getProductById('1')({products: productsState})
            .toJS()
    ).toEqual(testProduct)
})

test('receiveProductListProductData adds to the product map without overriding values', () => {
    const state = Immutable.fromJS({
        1: {
            title: 'test',
            price: '14.99',
            href: '/test/product.html',
            available: true,
            thumbnail: {
                src: '/thumbnail.jpg'
            }
        }
    })

    const productsState = reducer(state, results.receiveProductListProductData({1: testProduct}))
    const productData = selectors
        .getProductById('1')({products: productsState})
        .toJS()
    const productThumbnail = selectors.getProductThumbnailById('1')({products: productsState})

    expect(productData.price).toEqual(state.get('1').get('price'))
    expect(productThumbnail).toEqual(state.get('1').get('thumbnail'))
})

test('receiveCartProductData adds to the product map without overriding values', () => {
    const state = Immutable.fromJS({
        1: {
            title: 'test',
            price: '14.99',
            href: '/test/product.html',
            available: true,
            customProperty: ''
        }
    })

    const productsState = reducer(state, results.receiveCartProductData({1: testProduct}))
    const productData = selectors
        .getProductById('1')({products: productsState})
        .toJS()

    expect(productData.price).toEqual(state.get('1').get('price'))
})
