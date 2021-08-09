/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import Immutable from 'immutable'
import * as selectors from './selectors'

const custom = {
    test: 'billing custom content'
}
const billingAddress = {
    lastname: 'Test',
    telephone: '(234) 234-2345',
    sameAsShipping: true,
    addressLine1: '123 test street',
    shippingMethodId: 'freeshipping_freeshipping',
    isInitialized: true,
    city: 'Seattle',
    name: 'Test Test',
    postcode: '98122',
    regionId: '62',
    countryId: 'US',
    username: 'jennifer@mobify.com',
    firstname: 'Test',
    custom
}
const billingSameAsShipping = true
const appState = {
    checkout: Immutable.fromJS({
        billingAddress,
        billingSameAsShipping
    })
}

test('getBillingAddressCustomContent gets checkout billing custom content', () => {
    expect(selectors.getBillingAddressCustomContent(appState).toJS()).toEqual(custom)
})

test('getBillingAddressCustomContent returns empty object when undefined', () => {
    const emptyCustomState = {
        checkout: appState.checkout.deleteIn(['billingAddress', 'custom'])
    }
    expect(selectors.getBillingAddressCustomContent(emptyCustomState).toJS()).toEqual({})
})

test('getBillingInitialValues gets the initial values for the billing form', () => {
    expect(selectors.getBillingInitialValues(appState).toJS()).toEqual({
        ...billingAddress,
        billingSameAsShipping
    })
})
