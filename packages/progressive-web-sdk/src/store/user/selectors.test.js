/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import Immutable from 'immutable'
import * as selectors from './selectors'
import {WISHLIST_TITLE_DEFAULT} from './constants'

/* eslint-disable newline-per-chained-call */

const custom = {test: 'test'}
const wishlistTitle = 'Test title'
const shareURL = '/test/share/url'
const wishlistID = '123'
const defaultAddress = {
    preferred: true,
    firstname: 'default',
    lastname: 'user',
    addressLine1: '123 default street',
    city: 'test city',
    countryId: 'US',
    postcode: '98122',
    telephone: '2342342345'
}
const nonDefaultAddresses = [
    {
        firstname: 'test',
        lastname: 'user',
        addressLine1: '123 test street',
        city: 'test city',
        countryId: 'US',
        postcode: '90210',
        telephone: '2342342345'
    }
]
const savedAddresses = [...nonDefaultAddresses, defaultAddress]

const appState = {
    user: Immutable.fromJS({
        isLoggedIn: true,
        custom,
        savedAddresses,
        wishlist: {
            title: wishlistTitle,
            shareURL,
            id: wishlistID,
            custom,
            products: [
                {
                    productId: '3',
                    quantity: 2
                },
                {
                    productId: '5',
                    quantity: 1
                }
            ]
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
const PLACEHOLDER = {
    text: undefined
}

test('getUserCustomContent gets user custom content', () => {
    expect(selectors.getUserCustomContent(appState).toJS()).toEqual(custom)
})

test('getUserCustomContent returns empty object when undefined', () => {
    const emptyCustomState = {
        user: Immutable.fromJS({})
    }
    expect(selectors.getUserCustomContent(emptyCustomState).toJS()).toEqual({})
})

test('getWishlistCustomContent gets wishlist custom content', () => {
    expect(selectors.getWishlistCustomContent(appState).toJS()).toEqual(custom)
})

test('getCheckoutCustomContent returns empty object when undefined', () => {
    const emptyCustomState = {
        user: Immutable.fromJS({})
    }
    expect(selectors.getWishlistCustomContent(emptyCustomState).toJS()).toEqual({})
})

test('getIsLoggedIn returns true when isLoggedIn is true', () => {
    expect(selectors.getIsLoggedIn(appState)).toEqual(true)
})

test('getIsLoggedIn is falsy when value not present in state', () => {
    const emptyIsLoggedInState = {
        user: Immutable.Map()
    }
    expect(selectors.getIsLoggedIn(emptyIsLoggedInState)).toBeFalsy()
})

test('getWishlistTitle returns correct title when present in state', () => {
    expect(selectors.getWishlistTitle(appState)).toEqual(wishlistTitle)
})

test('getWishlistTitle returns default title when no title present in state', () => {
    const stateWithNoWishlistTitle = {
        user: Immutable.fromJS({
            wishlist: {}
        })
    }
    expect(selectors.getWishlistTitle(stateWithNoWishlistTitle)).toEqual(WISHLIST_TITLE_DEFAULT)
})

test('getWishlistShareURL returns correct URL when present in state', () => {
    expect(selectors.getWishlistShareURL(appState)).toEqual(shareURL)
})

test('getWishlistID returns correct ID when present in state', () => {
    expect(selectors.getWishlistID(appState)).toEqual(wishlistID)
})

test('getWishlistProducts returns correct list of products', () => {
    const expectedProducts = [
        {
            id: '3',
            title: 'test',
            productId: '3',
            quantity: 2
        },
        {
            id: '5',
            title: 'test 2',
            productId: '5',
            quantity: 1
        }
    ]

    expect(selectors.getWishlistProducts(appState).toJS()).toEqual(expectedProducts)
})

test('getWishlistProducts returns default if no products exist', () => {
    const initialState = {
        user: Immutable.fromJS({
            wishlist: {
                products: [
                    {
                        productId: '3',
                        quantity: 2
                    }
                ]
            }
        }),
        products: Immutable.fromJS({
            7: {
                id: '7',
                title: 'test'
            }
        })
    }
    const expected = Immutable.fromJS([{}])

    expect(selectors.getWishlistProducts(initialState)).toEqual(expected)
})

test('getWishlistItemCount returns number of products in the wishlist', () => {
    expect(selectors.getWishlistItemCount(appState)).toEqual(2)
})

test('getDefaultAddress returns the default address', () => {
    expect(selectors.getDefaultAddress(appState)).toEqual(defaultAddress)
})

test('getDefaultAddress returns a default if no addresses are in the state', () => {
    const initialState = {
        user: Immutable.Map()
    }

    expect(selectors.getDefaultAddress(initialState)).toEqual(Immutable.Map())
})

test('getAddresses returns the non-default addresses', () => {
    expect(selectors.getAddresses(appState)).toEqual(nonDefaultAddresses)
})

test('getAddresses returns a list of placeholders if no addresses are in the state', () => {
    const initialState = {
        user: Immutable.Map()
    }
    const placeholderList = Immutable.List(new Array(5).fill(PLACEHOLDER))

    expect(selectors.getAddresses(initialState)).toEqual(placeholderList)
})

test('getSavedAddresses gets the saved address list', () => {
    expect(selectors.getSavedAddresses(appState).toJS()).toEqual(savedAddresses)
})
