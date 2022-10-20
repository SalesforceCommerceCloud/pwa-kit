/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import useWishlist from './use-wishlist'
import useCustomerProductLists from '../commerce-api/hooks/useCustomerProductLists'
import {renderWithProviders} from '../utils/test-utils'

jest.mock('../commerce-api/hooks/useCustomerProductLists')

const mockData = {
    isInitialized: true,
    data: {
        f25ad12f60bdf2fb6ec932b78e: {
            creationDate: '2021-09-23T07:52:23.009Z',
            customerProductListItems: [
                {
                    currency: 'GBP',
                    id: '56e805396da83b7eca167913b1',
                    imageGroups: [
                        {
                            images: [
                                {
                                    alt: 'Drape Neck Dress., , large',
                                    disBaseLink:
                                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2bf7e719/images/large/PG.10251589.JJ3WDXX.PZ.jpg',
                                    link:
                                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2bf7e719/images/large/PG.10251589.JJ3WDXX.PZ.jpg',
                                    title: 'Drape Neck Dress., '
                                },
                                {
                                    alt: 'Drape Neck Dress., , large',
                                    disBaseLink:
                                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3bdcd88e/images/large/PG.10251589.JJ3WDXX.BZ.jpg',
                                    link:
                                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3bdcd88e/images/large/PG.10251589.JJ3WDXX.BZ.jpg',
                                    title: 'Drape Neck Dress., '
                                }
                            ],
                            viewType: 'large'
                        },
                        {
                            images: [
                                {
                                    alt: 'Drape Neck Dress., , medium',
                                    disBaseLink:
                                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw06ea3ef5/images/medium/PG.10251589.JJ3WDXX.PZ.jpg',
                                    link:
                                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw06ea3ef5/images/medium/PG.10251589.JJ3WDXX.PZ.jpg',
                                    title: 'Drape Neck Dress., '
                                },
                                {
                                    alt: 'Drape Neck Dress., , medium',
                                    disBaseLink:
                                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9e791206/images/medium/PG.10251589.JJ3WDXX.BZ.jpg',
                                    link:
                                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9e791206/images/medium/PG.10251589.JJ3WDXX.BZ.jpg',
                                    title: 'Drape Neck Dress., '
                                }
                            ],
                            viewType: 'medium'
                        },
                        {
                            images: [
                                {
                                    alt: 'Drape Neck Dress., , small',
                                    disBaseLink:
                                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw70771d1e/images/small/PG.10251589.JJ3WDXX.PZ.jpg',
                                    link:
                                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw70771d1e/images/small/PG.10251589.JJ3WDXX.PZ.jpg',
                                    title: 'Drape Neck Dress., '
                                },
                                {
                                    alt: 'Drape Neck Dress., , small',
                                    disBaseLink:
                                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6c634209/images/small/PG.10251589.JJ3WDXX.BZ.jpg',
                                    link:
                                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6c634209/images/small/PG.10251589.JJ3WDXX.BZ.jpg',
                                    title: 'Drape Neck Dress., '
                                }
                            ],
                            viewType: 'small'
                        }
                    ],
                    inventory: {
                        ats: 398,
                        backorderable: false,
                        id: 'inventory_m',
                        orderable: true,
                        preorderable: false,
                        stockLevel: 398
                    },
                    longDescription:
                        'Look your best in this drape neck dress. Sure to turn heads! ',
                    master: {
                        masterId: '25697212M',
                        orderable: true,
                        price: 76.16
                    },
                    minOrderQuantity: 1,
                    name: 'Drape Neck Dress.',
                    pageDescription:
                        'Look your best in this drape neck dress. Sure to turn heads! ',
                    pageTitle: 'Drape Neck Dress.',
                    price: 76.16,
                    pricePerUnit: 76.16,
                    primaryCategoryId: 'womens-clothing-dresses',
                    shortDescription:
                        'Look your best in this drape neck dress. Sure to turn heads! ',
                    stepQuantity: 1,
                    type: {
                        master: true
                    },
                    validFrom: {
                        default: '2011-03-18T04:00:00.000Z'
                    },
                    variants: [
                        {
                            orderable: true,
                            price: 76.16,
                            productId: '701644351229M',
                            variationValues: {
                                color: 'JJ3WDXX',
                                size: '9LG'
                            }
                        },
                        {
                            orderable: true,
                            price: 76.16,
                            productId: '701644351250M',
                            variationValues: {
                                color: 'JJ3WDXX',
                                size: '9XL'
                            }
                        },
                        {
                            orderable: true,
                            price: 76.16,
                            productId: '701644351236M',
                            variationValues: {
                                color: 'JJ3WDXX',
                                size: '9MD'
                            }
                        },
                        {
                            orderable: true,
                            price: 76.16,
                            productId: '701644351243M',
                            variationValues: {
                                color: 'JJ3WDXX',
                                size: '9SM'
                            }
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            name: 'Colour',
                            values: [
                                {
                                    name: 'Black Multi',
                                    orderable: true,
                                    value: 'JJ3WDXX'
                                }
                            ]
                        },
                        {
                            id: 'size',
                            name: 'Size',
                            values: [
                                {
                                    name: 'S',
                                    orderable: true,
                                    value: '9SM'
                                },
                                {
                                    name: 'M',
                                    orderable: true,
                                    value: '9MD'
                                },
                                {
                                    name: 'L',
                                    orderable: true,
                                    value: '9LG'
                                },
                                {
                                    name: 'XL',
                                    orderable: true,
                                    value: '9XL'
                                }
                            ]
                        }
                    ],
                    c_isNewtest: true,
                    priority: 1,
                    productId: '25697212M',
                    public: false,
                    purchasedQuantity: 0,
                    quantity: 1
                }
            ],
            event: {},
            id: 'f25ad12f60bdf2fb6ec932b78e',
            lastModified: '2021-09-23T08:40:12.103Z',
            name: 'PWA wishlist',
            public: false,
            type: 'wish_list',
            hasDetail: true
        }
    }
}

const MockComponent = () => {
    const wishlist = useWishlist()
    result = wishlist

    return null
}

let result

describe('useWishlist hook', () => {
    // since hooks must only run with in a React component
    // we use a global variable to inspect the value
    // and cleans it up before each test case
    beforeEach(() => {
        result = undefined
    })
    test('getters returns correct value', () => {
        const mockFindListByName = jest
            .fn()
            .mockReturnValue(mockData.data['f25ad12f60bdf2fb6ec932b78e'])
        useCustomerProductLists.mockReturnValue({
            findListByName: mockFindListByName
        })
        renderWithProviders(<MockComponent />)

        expect(result.data.id).toBe('f25ad12f60bdf2fb6ec932b78e')
        expect(result.items).toEqual(
            mockData.data['f25ad12f60bdf2fb6ec932b78e'].customerProductListItems
        )
        expect(result.isEmpty).toEqual(false)
        expect(result.isInitialized).toEqual(true)
        expect(result.hasDetail).toEqual(true)
        expect(mockFindListByName).toBeCalled()
    })
    test('init', () => {
        const mock = jest.fn()
        useCustomerProductLists.mockReturnValue({
            getOrCreateList: mock,
            findListByName: jest.fn()
        })
        renderWithProviders(<MockComponent />)
        result.init()

        expect(mock).toBeCalled()
    })
    test('createListItem', () => {
        const mock = jest.fn()
        const mockFindListByName = jest
            .fn()
            .mockReturnValue(mockData.data['f25ad12f60bdf2fb6ec932b78e'])

        useCustomerProductLists.mockReturnValue({
            createListItem: mock,
            findListByName: mockFindListByName
        })
        renderWithProviders(<MockComponent />)
        result.createListItem()

        expect(mock).toBeCalled()
    })
    test('updateListItem', () => {
        const mock = jest.fn()
        const mockFindListByName = jest
            .fn()
            .mockReturnValue(mockData.data['f25ad12f60bdf2fb6ec932b78e'])

        useCustomerProductLists.mockReturnValue({
            updateListItem: mock,
            findListByName: mockFindListByName
        })
        renderWithProviders(<MockComponent />)
        result.updateListItem()

        expect(mock).toBeCalled()
    })
    test('removeListItem', () => {
        const mock = jest.fn()
        const mockFindListByName = jest
            .fn()
            .mockReturnValue(mockData.data['f25ad12f60bdf2fb6ec932b78e'])

        useCustomerProductLists.mockReturnValue({
            removeListItem: mock,
            findListByName: mockFindListByName
        })
        renderWithProviders(<MockComponent />)
        result.removeListItem()

        expect(mock).toBeCalled()
    })
    test('removeListItemByProductId', () => {
        const mock = jest.fn()
        const mockFindListByName = jest
            .fn()
            .mockReturnValue(mockData.data['f25ad12f60bdf2fb6ec932b78e'])

        useCustomerProductLists.mockReturnValue({
            removeListItemByProductId: mock,
            findListByName: mockFindListByName
        })
        renderWithProviders(<MockComponent />)
        result.removeListItemByProductId()

        expect(mock).toBeCalled()
    })
    test('createListItem also calls init if not already initialized', () => {
        const mock = jest.fn()
        const mockFindListByName = jest.fn().mockReturnValue({})

        useCustomerProductLists.mockReturnValue({
            createListItem: mock,
            findListByName: mockFindListByName
        })
        renderWithProviders(<MockComponent />)
        result.init = jest.fn()

        result.createListItem()

        expect(result.init).toBeCalled()
    })
})
