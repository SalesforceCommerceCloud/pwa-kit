/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import {createSelector} from 'reselect'
import {createGetSelector} from 'reselect-immutable-helpers'
import {getBillingSameAsShipping, getCheckout} from '../selectors'

export const getBillingAddress = createGetSelector(getCheckout, 'billingAddress', Immutable.Map())

export const getBillingInitialValues = createSelector(
    getBillingAddress,
    getBillingSameAsShipping,
    (billingAddress, billingSameAsShipping) =>
        billingAddress.set('billingSameAsShipping', billingSameAsShipping)
)

export const getBillingAddressCustomContent = createGetSelector(
    getBillingAddress,
    'custom',
    Immutable.Map()
)
