/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createAction} from '../../utils/action-creation'

export const setSigninLoaded = createAction('Set Sign In Page Loaded')
export const receiveSigninData = createAction('Receive Sign In Page Data')

export const setRegisterLoaded = createAction('Set Register Page Loaded')
export const receiveRegisterData = createAction('Receive Register Page Data')

export const receiveAccountDashboardUIData = createAction('Receive Account Dashboard Data')

export const receiveAccountInfoData = createAction('Receive Account Info Data')
export const receiveAccountInfoUIData = createAction('Receive Account Info UI Data')

export const receiveAccountOrderUIData = createAction('Receive Account Order UI Data')
export const receiveAccountOrderListData = createAction('Receive Account Order List Data', [
    'orders'
])

export const receiveCurrentOrderNumber = createAction('Receive Current Order Id', [
    'currentOrderNumber'
])

export const receiveWishlistData = createAction('Receive wishlist data', ['wishlist'])
export const receiveWishlistUIData = createAction('Receive Wishlist UI Data')
export const removeWishlistItem = createAction('Remove Wishlist Item', ['removeItemId'])
export const receiveUpdatedWishlistItem = createAction('Receives a updated Wishlist Item data')
export const receiveWishlistCustomContent = createAction('Receive Wishlist custom content')

export const receiveAccountAddressUIData = createAction('Receive Account Address UI Data')
export const receiveSavedAddresses = createAction('Receive Saved Addresses', ['savedAddresses'])
