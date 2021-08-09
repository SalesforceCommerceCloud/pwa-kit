/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import * as Runtypes from 'runtypes'
import {Products, ProductUIData} from './types'
import {createTypedAction} from '../../utils/action-creation'

export const receiveProductDetailsUIData = createTypedAction(
    'Receive Product Details UI data',
    Runtypes.Dictionary(ProductUIData)
)

export const receiveProductDetailsProductData = createTypedAction(
    'Receive Product Details product data',
    Products
)

export const receiveProductListProductData = createTypedAction(
    'Receive ProductList product data',
    Products
)

export const receiveCartProductData = createTypedAction('Receive Cart product data', Products)

export const receiveWishlistProductData = createTypedAction('Receive product Data', Products)

export const receiveProductsData = createTypedAction('Receive Products Data', Products)
