/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    buildExpressPaymentContext,
    EXPRESS_PAYMENT_PROVIDER_API_VERSION
} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/use-express-payment-context'
import {EXPRESS_PAYMENT_MODES} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/contract'

const baseContext = {
    siteId: 'RefArchGlobal',
    locale: 'en-GB',
    currency: 'GBP'
}

describe('buildExpressPaymentContext', () => {
    test('builds the basic cart context', () => {
        expect(
            buildExpressPaymentContext({
                ...baseContext,
                pathname: '/Payments-Express',
                search: '',
                basketId: 'basket-1',
                basketStatus: 'ready'
            })
        ).toEqual({
            context: {
                providerApiVersion: EXPRESS_PAYMENT_PROVIDER_API_VERSION,
                mode: EXPRESS_PAYMENT_MODES.SHOPPER_AGENT,
                surface: 'cart',
                ...baseContext,
                basket: {id: 'basket-1', status: 'ready'}
            },
            isValid: true
        })
    })

    test('builds the basic product context', () => {
        expect(
            buildExpressPaymentContext({
                ...baseContext,
                pathname: '/Payments-ExpressProduct',
                search: '?pid=sku-1&quantity=2'
            })
        ).toEqual({
            context: {
                providerApiVersion: EXPRESS_PAYMENT_PROVIDER_API_VERSION,
                mode: EXPRESS_PAYMENT_MODES.SHOPPER_AGENT,
                surface: 'product',
                ...baseContext,
                productId: 'sku-1',
                quantity: 2
            },
            isValid: true
        })
    })

    test('defaults product quantity to one', () => {
        const result = buildExpressPaymentContext({
            ...baseContext,
            pathname: '/Payments-ExpressProduct',
            search: '?pid=sku-1'
        })

        expect(result.context.quantity).toBe(1)
        expect(result.isValid).toBe(true)
    })

    test.each(['?quantity=1', '?pid=%20%20%20&quantity=1', '?pid=sku-1&quantity=0'])(
        'rejects invalid product context %s',
        (search) => {
            expect(
                buildExpressPaymentContext({
                    ...baseContext,
                    pathname: '/Payments-ExpressProduct',
                    search
                }).isValid
            ).toBe(false)
        }
    )
})
