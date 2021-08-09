/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createSelector} from 'reselect'
import Immutable from 'immutable'
import {createGetSelector} from 'reselect-immutable-helpers'
import {getCheckout, getShippingMethods, getEmailAddress} from '../selectors'

export const getShippingAddress = createGetSelector(getCheckout, 'shippingAddress', Immutable.Map())
export const getSelectedSavedAddressId = createGetSelector(getCheckout, 'defaultShippingAddressId')
export const getSelectedShippingMethodValue = createGetSelector(
    getCheckout,
    'selectedShippingMethodId',
    ''
)

export const getInitialShippingAddress = createSelector(
    getCheckout,
    getEmailAddress,
    getShippingAddress,
    getSelectedSavedAddressId,
    getSelectedShippingMethodValue,
    (checkout, email, address, savedAddressId, shippingMethodId) => {
        address = address.set('shippingMethodId', shippingMethodId).set('username', email)
        if (savedAddressId) {
            return address.set('savedAddress', `${savedAddressId}`)
        }
        return address
    }
)

export const getSelectedShippingMethod = createSelector(
    getShippingMethods,
    getSelectedShippingMethodValue,
    (shippingMethods, selectedMethodValue) => {
        if (!shippingMethods.size) {
            return Immutable.Map()
        }
        const selectedValue = shippingMethods.filter(
            (method) => method.get('id') === selectedMethodValue
        )
        return selectedValue.size ? selectedValue.get(0) : shippingMethods.get(0)
    }
)

export const getShippingAddressCustomContent = createGetSelector(
    getShippingAddress,
    'custom',
    Immutable.Map()
)

export const getSelectedShippingRate = createGetSelector(getSelectedShippingMethod, 'cost', '')

export const getSelectedShippingLabel = createGetSelector(getSelectedShippingMethod, 'label', '')

export const getShippingFirstName = createGetSelector(getShippingAddress, 'firstname', '')

export const getShippingLastName = createGetSelector(getShippingAddress, 'lastname', '')

export const getShippingFullName = createSelector(
    getShippingFirstName,
    getShippingLastName,
    (firstName, lastName) => `${firstName} ${lastName}`
)

export const getStreet = createGetSelector(getShippingAddress, 'street', Immutable.List())

export const getAddressLineOne = createGetSelector(getShippingAddress, 'addressLine1')

export const getAddressLineTwo = createGetSelector(getShippingAddress, 'addressLine2')

export const getTelephone = createGetSelector(getShippingAddress, 'telephone')

export const getPostcode = createGetSelector(getShippingAddress, 'postcode')

export const getCompany = createGetSelector(getShippingAddress, 'company')

export const getRegionId = createGetSelector(getShippingAddress, 'regionId')

export const getCountryId = createGetSelector(getShippingAddress, 'countryId')

export const getCity = createGetSelector(getShippingAddress, 'city')

export const getIsInitialized = createGetSelector(getShippingAddress, 'isInitialized')
