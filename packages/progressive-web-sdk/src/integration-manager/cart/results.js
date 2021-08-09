/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createTypedAction, createAction} from '../../utils/action-creation'
import {Cart, CartItems} from './types'

export const receiveCartItems = createTypedAction('Receive Cart Items', CartItems, ['items'])
export const receiveCartContents = createTypedAction('Receive Cart Contents', Cart)

export const receiveCartPageMeta = createAction('Receive Cart Totals', ['pageMeta'])
export const receiveCartTotals = createAction('Receive Cart Totals', [
    'shipping',
    'discount',
    'subtotal',
    'tax',
    'orderTotal'
])
export const receiveCartCustomContent = createAction('Receive Cart Custom Contents', ['custom'])
