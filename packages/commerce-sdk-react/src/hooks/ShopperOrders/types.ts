/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryParams} from '../types'

export interface ShopperOrderParams extends QueryParams {
    orderNo?: string
}

export enum ShopperOrderActions {
    createOrder = 'createOrder',
    createPaymentInstrumentForOrder = 'createPaymentInstrumentForOrder',
    removePaymentInstrumentFromOrder = 'removePaymentInstrumentFromOrder',
    updatePaymentInstrumentForOrder = 'updatePaymentInstrumentForOrder',
}
