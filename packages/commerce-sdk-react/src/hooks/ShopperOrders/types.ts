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
    // phase 1
    createOrder = 'createOrder',

    // phase 2
    createPaymentInstrumentForOrder = 'createPaymentInstrumentForOrder',
    removePaymentInstrumentFromOrder = 'removePaymentInstrumentFromOrder',
    updatePaymentInstrumentForOrder = 'updatePaymentInstrumentForOrder',
}
