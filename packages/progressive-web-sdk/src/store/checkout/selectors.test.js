/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import Immutable from 'immutable'
import * as selectors from './selectors'

/* eslint-disable newline-per-chained-call */

const countries = [
    {
        id: 'us',
        label: 'United States',
        regionRequired: true,
        postcodeRequired: true
    }
]

const regions = [
    {
        countryId: 'us',
        label: 'Alabama',
        id: 'AL'
    },
    {
        countryId: 'us',
        label: 'Alaska',
        id: 'AK'
    },
    {
        countryId: 'us',
        label: 'American Samoa',
        id: 'AS'
    },
    {
        countryId: 'us',
        label: 'Arizona',
        id: 'AZ'
    },
    {
        countryId: 'ca',
        label: 'British Columbia',
        id: 'BC'
    }
]

const email = 'test@email.com'
const billingSameAsShipping = true
const locationsCustom = {
    test: 'locations custom content'
}
const custom = {
    test: 'checkout custom content'
}
const shippingMethods = [
    {
        label: 'free',
        cost: '0.00',
        id: 'freeship'
    },
    {
        label: 'express',
        cost: '20.00',
        id: 'expressship'
    }
]
const appState = {
    checkout: Immutable.fromJS({
        email,
        locations: {
            countries,
            regions,
            custom: locationsCustom
        },
        billingSameAsShipping,
        custom,
        shippingMethods
    }),
    form: {
        testForm: {
            values: {
                countryId: 'us'
            }
        }
    }
}

test('getEmailAddress gets checkout email address', () => {
    expect(selectors.getEmailAddress(appState)).toEqual(email)
})

test('getCountries gets a list of country objects', () => {
    expect(selectors.getCountries(appState).toJS()).toEqual(countries)
})

test('getRegions gets a list of region objects', () => {
    expect(selectors.getRegions(appState).toJS()).toEqual(regions)
})

test('getBillingSameAsShipping gets the billingSameAsShipping value', () => {
    expect(selectors.getBillingSameAsShipping(appState)).toEqual(billingSameAsShipping)
})

test('getAvailableRegions returns regions for selected country', () => {
    const expected = [
        {
            countryId: 'us',
            label: 'Alabama',
            id: 'AL'
        },
        {
            countryId: 'us',
            label: 'Alaska',
            id: 'AK'
        },
        {
            countryId: 'us',
            label: 'American Samoa',
            id: 'AS'
        },
        {
            countryId: 'us',
            label: 'Arizona',
            id: 'AZ'
        }
    ]

    expect(
        selectors
            .getAvailableRegions('testForm')(appState)
            .toJS()
    ).toEqual(expected)
})

test('getSelectedCountryID returns countryId defined at selected form', () => {
    expect(selectors.getSelectedCountryID('testForm')(appState)).toEqual('us')
})

test('getSelectedCountryID returns null if no countryId defined at selected form', () => {
    expect(selectors.getSelectedCountryID('otherForm')(appState)).toBeNull()
})

test('getCheckoutCustomContent gets checkout custom content', () => {
    expect(selectors.getCheckoutCustomContent(appState).toJS()).toEqual(custom)
})

test('getCheckoutCustomContent returns empty object when undefined', () => {
    const emptyCustomState = {
        checkout: appState.checkout.delete('custom')
    }
    expect(selectors.getCheckoutCustomContent(emptyCustomState).toJS()).toEqual({})
})

test('getLocationsCustomContent gets locations custom content', () => {
    expect(selectors.getLocationsCustomContent(appState).toJS()).toEqual(locationsCustom)
})

test('getShippingMethods gets the shipping methods', () => {
    expect(selectors.getShippingMethods(appState).toJS()).toEqual(shippingMethods)
})
