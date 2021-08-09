/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import * as actions from './actions'
import thunk from 'redux-thunk'
import configureStore from 'redux-mock-store'

describe('Product list actions', () => {
    test(`initialize action without error`, () => {
        const productA = {
            productId: 'a',
            productName: 'a'
        }
        const productB = {
            productId: 'b',
            productName: 'b'
        }
        const query = 123
        const productSearchRequest = {
            results: [productA, productB],
            selectedFilters: {
                categoryId: 'some category'
            },
            query
        }
        class MockConnector {
            searchProducts() {
                return Promise.resolve(productSearchRequest)
            }

            getCategory() {
                return Promise.resolve({
                    id: 'id',
                    name: 'name',
                    categories: []
                })
            }
        }

        const storeFactory = configureStore([
            thunk.withExtraArgument({connector: new MockConnector()})
        ])

        const store = storeFactory({})
        store.dispatch(actions.initialize(query)).then(() => {
            expect(store.getActions()).toEqual([
                {
                    payload: {
                        searchRequest: query,
                        error: null
                    },
                    type: 'CATEGORY_LIST_UI_STATE_RECEIVED'
                },
                {
                    payload: {
                        a: {
                            id: productA.productId,
                            name: productA.productName
                        },
                        b: {
                            id: productB.productId,
                            name: productB.productName
                        }
                    },
                    type: 'PRODUCTS_RECEIVED'
                },
                {
                    payload: {
                        123: productSearchRequest
                    },
                    type: 'PRODUCT_SEARCH_RECEIVED'
                },
                {
                    payload: {
                        root: {
                            categories: [],
                            id: 'id',
                            name: 'name'
                        }
                    },
                    type: 'CATEGORIES_RECEIVED'
                },
                {
                    payload: {
                        pageMetaData: {
                            title: `${productSearchRequest.results.length} results for "some category"`,
                            keywords: query,
                            description: query
                        }
                    },
                    type: 'PAGE_METADATA_RECEIVED'
                }
            ])
        })
    })
})
