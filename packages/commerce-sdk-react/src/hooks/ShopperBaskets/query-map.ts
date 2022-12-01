/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {QueryMap} from './utils'

/**
 * @private
 */
export const queryMap = {
    basket(params: {basketId: string; arg: any}): QueryMap {
        const {basketId, arg} = params
        return {
            name: 'basket',
            key: ['/baskets', basketId, arg]
        }
    },
    paymentMethodsForBasket(params: {basketId: string; arg: any}): QueryMap {
        const {basketId, arg} = params
        return {
            name: 'paymentMethodsForBasket',
            key: ['/baskets', basketId, '/payment-methods', arg]
        }
    },
    // TODO
    priceBooksForBasket() {},
    shippingMethodsForShipment() {},
    taxesFromBasket() {}
}
