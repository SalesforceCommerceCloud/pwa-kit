/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import Immutable from 'immutable'
import reducer from './reducer'
import {receiveUserCustomContent, setLoggedIn} from '../../integration-manager/results'
import {
    removeWishlistItem,
    receiveWishlistData,
    receiveSavedAddresses,
    receiveWishlistCustomContent,
    receiveUpdatedWishlistItem
} from '../../integration-manager/account/results.js'

/* eslint-disable newline-per-chained-call */

test('unknown action type leaves state unchanged', () => {
    const action = {
        type: 'qwertyuiop'
    }
    expect(reducer(Immutable.Map(), action)).toEqual(Immutable.Map())
})

test('receiveUserCustomContent updates the custom branch of the user state', () => {
    const customContent = {test: 'user content'}
    const expectedState = Immutable.fromJS({custom: customContent})
    const action = receiveUserCustomContent(customContent)

    expect(reducer(Immutable.Map(), action)).toEqual(expectedState)
})

test('Calling setLoggedIn with true sets isLoggedIn to true', () => {
    const expectedState = Immutable.fromJS({isLoggedIn: true})
    const action = setLoggedIn(true)

    expect(reducer(Immutable.Map(), action)).toEqual(expectedState)
})

test('Calling setLoggedIn with false sets isLoggedIn to false', () => {
    const expectedState = Immutable.fromJS({isLoggedIn: false})
    const action = setLoggedIn(false)

    expect(reducer(Immutable.Map(), action)).toEqual(expectedState)
})

test('Calling removeWishlistItem with a product ID not present in the wishlist makes no changes', () => {
    const appState = Immutable.fromJS({
        wishlist: {
            products: [{itemId: '3'}, {itemId: '5'}]
        }
    })
    const action = removeWishlistItem('6')

    expect(reducer(appState, action)).toEqual(appState)
})

test('Calling removeWishlistItem with a product ID present in the wishlist removes the item', () => {
    const appState = Immutable.fromJS({
        wishlist: {
            products: [{itemId: '3'}, {itemId: '5'}]
        }
    })
    const expectedState = Immutable.fromJS({
        wishlist: {
            products: [{itemId: '3'}]
        }
    })
    const action = removeWishlistItem('5')

    expect(reducer(appState, action)).toEqual(expectedState)
})

test('receiveWishlistData updates the wishlist contents', () => {
    const appState = Immutable.Map()
    const wishlistData = {
        products: [{productId: '3'}, {productId: '5'}],
        title: 'test title',
        id: '1'
    }
    const expectedState = Immutable.fromJS({
        wishlist: wishlistData
    })
    const action = receiveWishlistData(wishlistData)

    expect(reducer(appState, action)).toEqual(expectedState)
})

test('receiveWishlistData with fewer products than current state remove items', () => {
    const appState = Immutable.fromJS({
        wishlist: {
            products: [{productId: '3'}, {productId: '5'}]
        }
    })
    const wishlistData = {
        products: [{productId: '3'}],
        title: 'test title',
        id: '1'
    }
    const expectedState = Immutable.fromJS({
        wishlist: wishlistData
    })
    const action = receiveWishlistData(wishlistData)

    expect(reducer(appState, action)).toEqual(expectedState)
})

test('receiveSavedAddresses updates the wishlist contents', () => {
    const appState = Immutable.Map()
    const addressData = {
        firstname: 'test',
        lastname: 'user',
        addressLine1: '123 test street',
        city: 'test city',
        countryId: 'US',
        postcode: '90210',
        telephone: '2342342345'
    }
    const expectedState = Immutable.fromJS({
        savedAddresses: addressData
    })
    const action = receiveSavedAddresses(addressData)

    expect(reducer(appState, action)).toEqual(expectedState)
})

test('receiveSavedAddresses with fewer addresses than current state remove items', () => {
    const appState = Immutable.fromJS({
        savedAddresses: [
            {
                firstname: 'test',
                lastname: 'user',
                addressLine1: '123 test street',
                city: 'test city',
                countryId: 'US',
                postcode: '90210',
                telephone: '2342342345'
            },
            {
                preferred: true,
                firstname: 'default',
                lastname: 'user',
                addressLine1: '123 default street',
                city: 'test city',
                countryId: 'US',
                postcode: '98122',
                telephone: '2342342345'
            }
        ]
    })
    const addressData = [
        {
            preferred: true,
            firstname: 'default',
            lastname: 'user',
            addressLine1: '123 default street',
            city: 'test city',
            countryId: 'US',
            postcode: '98122',
            telephone: '2342342345'
        }
    ]
    const expectedState = Immutable.fromJS({
        savedAddresses: addressData
    })
    const action = receiveSavedAddresses(addressData)

    expect(reducer(appState, action)).toEqual(expectedState)
})

test('receiveWishlistCustomContent updates the custom branch of the wishlist user state', () => {
    const customContent = {test: 'user content'}
    const expectedState = {wishlist: {custom: customContent}}
    const action = receiveWishlistCustomContent(customContent)

    expect(reducer(Immutable.Map(), action).toJS()).toEqual(expectedState)
})

test("receiveUpdatedWishlistItem updates the correct wishlist item's quantity", () => {
    const appState = Immutable.fromJS({
        wishlist: {
            products: [
                {
                    itemId: '1',
                    productId: '3',
                    quantity: 5
                },
                {
                    itemId: '2',
                    productId: '5',
                    quantity: 10
                }
            ]
        }
    })

    const action = receiveUpdatedWishlistItem({itemId: '2', quantity: 2})
    const expectedState = Immutable.fromJS({
        wishlist: {
            products: [
                {
                    itemId: '1',
                    productId: '3',
                    quantity: 5
                },
                {
                    itemId: '2',
                    productId: '5',
                    quantity: 2
                }
            ]
        }
    })

    expect(reducer(appState, action)).toEqual(expectedState)
})
