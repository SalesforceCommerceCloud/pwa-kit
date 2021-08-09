/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createAction} from '../utils/action-creation'

export const receiveHomeData = createAction('Receive Home Data')
export const receiveNavigationData = createAction('Receive Navigation Data')
export const receiveCategory = createAction('Receive Category Data')
export const setLoggedIn = createAction('Set Logged in flag', ['isLoggedIn'])
export const setNavigationAccountLink = createAction('Set Navigation Account Link Text')
export const setCheckoutShippingURL = createAction('Set Checkout Shipping URL', [
    'checkoutShippingURL'
])
export const setCartURL = createAction('Set Cart URL', ['cartURL'])
export const setWishlistURL = createAction('Set Wishlist URL', ['wishlistURL'])
export const setSignInURL = createAction('Set SignIn URL', ['signInURL'])
export const setAccountAddressURL = createAction('Set AccountAddress URL', ['accountAddressURL'])
export const setAccountInfoURL = createAction('Set AccountInfo URL', ['accountInfoURL'])
export const receiveOrderConfirmationContents = createAction(
    'Receive Order Confirmation Contents',
    ['confirmationData']
)
export const receiveSearchSuggestions = createAction('Receive search suggestions')
export const setCurrentURL = createAction('Set Current URL', ['currentURL'])
export const receiveCurrentProductId = createAction('Receive current product ID', [
    'currentProduct'
])
export const receiveUserCustomContent = createAction('Receive User Custom Content', ['custom'])
export const setAccountURL = createAction('Set Account URL', ['accountURL'])
export const setAccountOrderListURL = createAction('Set Account Order List URL', ['orderListURL'])
export const receiveSelectedCurrency = createAction('Receive Currency Data', ['selectedCurrency'])
export const receiveAvailableCurrencies = createAction('Receive available currencies', [
    'availableCurrencies'
])
