// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import Immutable from 'immutable'
import {createSelector} from 'reselect'
import {createGetSelector} from 'reselect-immutable-helpers'
import {getUser} from '../selectors'

export const getCurrentOrderNumber = createGetSelector(getUser, 'currentOrderNumber', '')
export const getOrders = createGetSelector(getUser, 'orders', Immutable.Map())

export const getCurrentOrder = createSelector(
    getOrders,
    getCurrentOrderNumber,
    (orders, currentOrdeNumber) => orders.get(currentOrdeNumber) || Immutable.Map()
)

export const getOrderPageMeta = createGetSelector(getCurrentOrder, 'pageMeta', Immutable.Map())
export const getOrderDate = createGetSelector(getCurrentOrder, 'date')
export const getOrderStatus = createGetSelector(getCurrentOrder, 'status')
export const getOrderItems = createGetSelector(getCurrentOrder, 'items')
export const getOrderTotal = createGetSelector(getCurrentOrder, 'total')
export const getOrderTax = createGetSelector(getCurrentOrder, 'tax')
export const getOrderShippingTotal = createGetSelector(getCurrentOrder, 'shippingTotal')
export const getOrderSubtotal = createGetSelector(getCurrentOrder, 'subtotal')
export const getOrderBillingAddress = createGetSelector(getCurrentOrder, 'billingAddress')
export const getOrderPaymentMethods = createGetSelector(
    getCurrentOrder,
    'paymentMethods',
    Immutable.List()
)
export const getOrderShippingMethod = createGetSelector(getCurrentOrder, 'shippingMethod')
export const getOrderShippingAddress = createGetSelector(getCurrentOrder, 'shippingAddress')
