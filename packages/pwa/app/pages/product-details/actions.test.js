/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import * as actions from './actions'
import thunk from 'redux-thunk'
import configureStore from 'redux-mock-store'

describe('Product Details actions', () => {
    test(`initialize action without error`, () => {
        const product = {
            name: 'a',
            description: 'b'
        }
        const productId = 123
        class MockConnector {
            getProduct() {
                return Promise.resolve(product)
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
        store.dispatch(actions.initialize(productId)).then(() => {
            expect(store.getActions()).toEqual([
                {
                    payload: {
                        productId,
                        variationValues: undefined,
                        error: undefined
                    },
                    type: 'PRODUCT_UI_STATE_RECEIVED'
                },
                {
                    payload: {
                        123: product
                    },
                    type: 'PRODUCTS_RECEIVED'
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
                            description: 'b',
                            title: 'a'
                        }
                    },
                    type: 'PAGE_METADATA_RECEIVED'
                }
            ])
        })
    })

    test(`initialize action with error`, () => {
        const errorMessage = 'this is an intentional error'
        const productId = 123
        class MockConnector {
            getProduct() {
                return Promise.resolve().then(() => {
                    throw new Error(errorMessage)
                })
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
        store.dispatch(actions.initialize(productId)).then(() => {
            expect(store.getActions()).toEqual([
                {
                    payload: {
                        productId,
                        variationValues: undefined,
                        error: undefined
                    },
                    type: 'PRODUCT_UI_STATE_RECEIVED'
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
                        error: errorMessage
                    },
                    type: 'PRODUCT_UI_STATE_RECEIVED'
                },
                {
                    payload: {
                        pageMetaData: {
                            description: undefined,
                            title: undefined
                        }
                    },
                    type: 'PAGE_METADATA_RECEIVED'
                }
            ])
        })
    })
})
