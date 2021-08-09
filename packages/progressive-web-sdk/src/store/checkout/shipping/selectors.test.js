/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import Immutable from 'immutable'
import * as selectors from './selectors'

const custom = {
    test: 'billing custom content'
}
const shippingAddress = {
    lastname: 'Test',
    telephone: '(234) 234-2345',
    sameAsShipping: true,
    addressLine1: '123 test street',
    addressLine2: 'apt B',
    shippingMethodId: 'freeshipping_freeshipping',
    isInitialized: true,
    city: 'Seattle',
    name: 'Test Test',
    postcode: '98122',
    regionId: '62',
    countryId: 'US',
    username: 'jennifer@mobify.com',
    firstname: 'Test',
    company: 'test company',
    custom
}

const expressShip = {
    label: 'express',
    cost: '20.00',
    id: 'expressship'
}
const shippingMethods = [
    {
        label: 'free',
        cost: '0.00',
        id: 'freeship'
    },
    expressShip
]
const defaultShippingAddressId = 3
const selectedShippingMethodId = 'expressship'
const email = 'test@mobify.com'
const appState = {
    checkout: Immutable.fromJS({
        email,
        shippingAddress,
        defaultShippingAddressId,
        selectedShippingMethodId,
        shippingMethods
    })
}

test('getShippingAddressCustomContent gets checkout shipping address custom content', () => {
    expect(selectors.getShippingAddressCustomContent(appState).toJS()).toEqual(custom)
})

test('getShippingAddressCustomContent returns empty object when undefined', () => {
    const emptyCustomState = {
        checkout: appState.checkout.deleteIn(['shippingAddress', 'custom'])
    }
    expect(selectors.getShippingAddressCustomContent(emptyCustomState).toJS()).toEqual({})
})

test('getShippingFirstName gets the shipping first name', () => {
    expect(selectors.getShippingFirstName(appState)).toEqual(shippingAddress.firstname)
})

test('getShippingLastName gets the shipping last name', () => {
    expect(selectors.getShippingLastName(appState)).toEqual(shippingAddress.lastname)
})

test('getShippingAddressLineOne gets address line one', () => {
    expect(selectors.getAddressLineOne(appState)).toEqual(shippingAddress.addressLine1)
})

test('getShippingAddressLineTwo gets address line two', () => {
    expect(selectors.getAddressLineTwo(appState)).toEqual(shippingAddress.addressLine2)
})

test('getTelephone gets the telephone number', () => {
    expect(selectors.getTelephone(appState)).toEqual(shippingAddress.telephone)
})

test('getPostcode gets the postcode', () => {
    expect(selectors.getPostcode(appState)).toEqual(shippingAddress.postcode)
})

test('getCompany gets the company', () => {
    expect(selectors.getCompany(appState)).toEqual(shippingAddress.company)
})

test('getRegionId gets the regionId', () => {
    expect(selectors.getRegionId(appState)).toEqual(shippingAddress.regionId)
})

test('getCountryId gets the countryId', () => {
    expect(selectors.getCountryId(appState)).toEqual(shippingAddress.countryId)
})

test('getCity gets the city', () => {
    expect(selectors.getCity(appState)).toEqual(shippingAddress.city)
})

test('getSelectedSavedAddressId gets the selected saved address ID', () => {
    expect(selectors.getSelectedSavedAddressId(appState)).toEqual(defaultShippingAddressId)
})

test('getSelectedShippingMethodValue gets the selected shipping method value', () => {
    expect(selectors.getSelectedShippingMethodValue(appState)).toEqual(selectedShippingMethodId)
})

test('getShippingFullName gets the selected shipping first and last names', () => {
    expect(selectors.getShippingFullName(appState)).toEqual(
        `${shippingAddress.firstname} ${shippingAddress.lastname}`
    )
})

test('getInitialShippingAddress gets the shipping form initial values with no saved address id', () => {
    const expected = {
        ...shippingAddress,
        username: email,
        shippingMethodId: selectedShippingMethodId
    }
    const stateWithoutSavedID = {
        checkout: appState.checkout.delete('defaultShippingAddressId')
    }

    expect(selectors.getInitialShippingAddress(stateWithoutSavedID).toJS()).toEqual(expected)
})

test('getInitialShippingAddress gets the shipping form initial values with a saved address id', () => {
    const expected = {
        ...shippingAddress,
        username: email,
        shippingMethodId: selectedShippingMethodId,
        savedAddress: `${defaultShippingAddressId}`
    }

    expect(selectors.getInitialShippingAddress(appState).toJS()).toEqual(expected)
})

test('getSelectedShippingMethod returns an empty map when no shipping methods exist', () => {
    const stateWithoutShippingMethods = {
        checkout: appState.checkout.delete('shippingMethods')
    }

    expect(selectors.getSelectedShippingMethod(stateWithoutShippingMethods).toJS()).toEqual({})
})

test('getSelectedShippingMethod gets the selected shipping method', () => {
    expect(selectors.getSelectedShippingMethod(appState).toJS()).toEqual(expressShip)
})

test('getSelectedShippingMethod returns the first method when no selected value', () => {
    const appStateWithoutSelectedMethodID = {
        checkout: appState.checkout.delete('selectedShippingMethodId')
    }
    expect(selectors.getSelectedShippingMethod(appStateWithoutSelectedMethodID).toJS()).toEqual(
        shippingMethods[0]
    )
})
