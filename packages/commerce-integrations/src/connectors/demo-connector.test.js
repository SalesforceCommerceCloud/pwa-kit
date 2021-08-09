/* eslint-disable max-nested-callbacks */

import {DemoConnector} from './demo-connector'
import * as types from '../types'
import {propTypeErrors} from '../utils/test-utils'

jest.setTimeout(20000)

describe(`The Demo Connector`, () => {
    const makeConnector = () => Promise.resolve(new DemoConnector({}))

    test('Getting a category', () => {
        return makeConnector()
            .then((connector) => connector.getCategory('root'))
            .then((data) => expect(propTypeErrors(types.Category, data)).toBeFalsy())
    })

    test('Getting a category, not found', () => {
        return makeConnector().then((connector) => {
            expect(connector.getCategory('not-a-category')).rejects.toThrow()
        })
    })

    test('Getting a product', () => {
        return makeConnector()
            .then((connector) => connector.getProduct('1'))
            .then((data) => expect(propTypeErrors(types.Product, data)).toBeFalsy())
    })

    test('Getting a product, not found', () => {
        return makeConnector().then((connector) => {
            expect(connector.getProduct('not-a-product')).rejects.toThrow()
        })
    })

    test('Searching for products, no results', () => {
        return makeConnector()
            .then((connector) =>
                connector.searchProducts({filters: {categoryId: 'tshirts'}, query: ''})
            )
            .then((data) => expect(propTypeErrors(types.ProductSearch, data)).toBeFalsy())
    })

    test('Searching for products, no results', () => {
        return makeConnector()
            .then((connector) =>
                connector.searchProducts({filters: {categoryId: 'not-a-category'}, query: ''})
            )
            .then((data) => {
                expect(propTypeErrors(types.ProductSearch, data)).toBeFalsy()
                expect(data.results.length).toBe(0)
            })
    })
})
