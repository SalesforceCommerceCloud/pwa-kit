/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useBasket, usePaymentMethodsForBasket} from './query'
import {QueryMap} from './utils'

/**
 * @private
 */
export const queryMap = {
    basket(params: {basketId: string; arg: any}): QueryMap {
        const {basketId, arg} = params
        return {
            name: 'basket',
            key: ['/baskets', basketId, arg],
            // XXX: we're not actually using `hook` - remove it?
            // I believe React hooks are meant to be called explicitly, and so we shouldn't dynamically call them
            hook: () => useBasket(arg)
        }
    },
    paymentMethodsForBasket(params: {basketId: string; arg: any}): QueryMap {
        const {basketId, arg} = params
        return {
            name: 'paymentMethodsForBasket',
            key: ['/baskets', basketId, '/payment-methods', arg],
            hook: () => usePaymentMethodsForBasket(arg)
        }
    },
    // TODO
    priceBooksForBasket() {},
    shippingMethodsForShipment() {},
    taxesFromBasket() {}
}
