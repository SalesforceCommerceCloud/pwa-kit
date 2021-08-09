/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import * as Runtypes from 'runtypes'
import {
    createAction,
    createActionWithAnalytics,
    createTypedAction
} from '../../utils/action-creation'
import {EVENT_ACTION, Transaction, Product} from '../../analytics/data-objects/'
import {getCartItems, getOrderTotal, getTax} from '../../store/cart/selectors'
import {LocationList, ShippingMethods, Address} from './types'

export const receiveCheckoutLocations = createTypedAction(
    'Receive Checkout Locations',
    LocationList,
    'locations'
)
export const receiveShippingMethods = createTypedAction('Receive Shipping Methods', ShippingMethods)
export const receiveShippingAddress = createTypedAction(
    'Receive Shipping Address',
    Address,
    'shippingAddress'
)
export const receiveBillingAddress = createTypedAction(
    'Receive Billing Address',
    Address,
    'billingAddress'
)
export const receiveHasExistingCard = createTypedAction(
    'Receive Has Existing Cart flag',
    Runtypes.Boolean,
    'hasExistingCreditCard'
)

export const receiveCheckoutPageMeta = createAction('Receive Checkout Page Meta', ['pageMeta'])
export const receiveCheckoutCustomContent = createAction('Receive Checkout Custom Content', [
    'custom'
])
export const setDefaultShippingAddressId = createAction('Receive default shipping address ID', [
    'defaultShippingAddressId'
])
export const receiveBillingSameAsShipping = createAction('Receive Billing same as Shipping', [
    'billingSameAsShipping'
])
export const clearShippingAddress = createAction('Clear Shipping Address')

const remapProducts = (products) => {
    const mappedProducts = []
    products.forEach((product) => {
        const detail = 'product' in product ? product.product : product
        mappedProducts.push({
            [Product.ID]: detail.id,
            [Product.NAME]: detail.title,
            [Product.PRICE]: detail.price,
            [Product.QUANTITY]: product.quantity
        })
    })
    return mappedProducts
}

export const realReceiveCheckoutConfirmationData = createActionWithAnalytics(
    'Receive Checkout Confirmation Data',
    ['confirmationData'],
    EVENT_ACTION.purchase,
    (confirmationData, purchaseData) => {
        return new Transaction(
            {
                [Transaction.ID]: confirmationData.orderNumber,
                [Transaction.REVENUE]: purchaseData[Transaction.REVENUE],
                [Transaction.TAX]: purchaseData[Transaction.TAX]
            },
            purchaseData.products
        )
    }
)

// This is a proxy action to get state information before dispatching the real intended action
// The idea here is that we obtain the data in the state using selectors so that is can be
// used to build out the analytic data required for analytic manager
export const receiveCheckoutConfirmationData = (confirmationData) => (dispatch, getState) => {
    const currentState = getState()
    return dispatch(
        realReceiveCheckoutConfirmationData(confirmationData, {
            [Transaction.REVENUE]: getOrderTotal(currentState),
            [Transaction.TAX]: getTax(currentState),
            products: remapProducts(getCartItems(currentState).toJS())
        })
    )
}

export const receiveUserEmail = createAction('Receive User Email Address', ['email'])
export const receiveSelectedShippingMethod = createAction('Receive Selected Shipping Method', [
    'selectedShippingMethodId'
])
export const receiveLocationsCustomContent = createAction('Receive Locations Custom Content')
export const receiveShippingAddressCustomContent = createAction(
    'Receive Shipping Address Custom Content'
)
export const receiveBillingAddressCustomContent = createAction(
    'Receive Billing Address Custom Content'
)
