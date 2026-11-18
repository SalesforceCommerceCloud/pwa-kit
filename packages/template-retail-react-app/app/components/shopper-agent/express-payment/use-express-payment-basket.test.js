/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {selectExpressPaymentBasket} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/use-express-payment-basket'

describe('selectExpressPaymentBasket', () => {
    test('selects the first non-temporary basket', () => {
        const temporaryBasket = {basketId: 'temporary', temporaryBasket: true}
        const activeBasket = {basketId: 'active', temporaryBasket: false}

        expect(selectExpressPaymentBasket([temporaryBasket, activeBasket])).toBe(activeBasket)
    })

    test('returns undefined when no active basket exists', () => {
        expect(
            selectExpressPaymentBasket([{basketId: 'temporary', temporaryBasket: true}])
        ).toBeUndefined()
    })
})
