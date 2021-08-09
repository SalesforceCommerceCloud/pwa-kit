/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import {handleActions} from 'redux-actions'
import {mergePayload, setCustomContent} from '../../utils/reducer-utils'
import * as integrationManagerResults from '../../integration-manager/checkout/results'

const checkoutReducer = handleActions(
    {
        [integrationManagerResults.receiveCheckoutLocations]: mergePayload,
        [integrationManagerResults.receiveBillingAddress]: mergePayload,
        [integrationManagerResults.receiveShippingAddress]: mergePayload,
        [integrationManagerResults.receiveUserEmail]: mergePayload,
        [integrationManagerResults.receiveCheckoutPageMeta]: mergePayload,
        [integrationManagerResults.receiveCheckoutCustomContent]: mergePayload,
        [integrationManagerResults.receiveSelectedShippingMethod]: mergePayload,
        [integrationManagerResults.receiveBillingSameAsShipping]: mergePayload,
        [integrationManagerResults.receiveLocationsCustomContent]: setCustomContent('locations'),
        [integrationManagerResults.receiveShippingAddressCustomContent]: setCustomContent(
            'shippingAddress'
        ),
        [integrationManagerResults.receiveBillingAddressCustomContent]: setCustomContent(
            'billingAddress'
        ),
        [integrationManagerResults.receiveShippingMethods]: (state, {payload}) =>
            // Using `set` here will make sure the list in the store is
            // correctly truncated.
            state.set('shippingMethods', Immutable.fromJS(payload)),
        [integrationManagerResults.setDefaultShippingAddressId]: mergePayload
    },
    Immutable.Map()
)

export default checkoutReducer
