/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {isShopperAgentExpressPaymentPath} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/routes'

describe('isShopperAgentExpressPaymentPath', () => {
    test.each([
        '/Payments-Express',
        '/Payments-Express/',
        '/Payments-ExpressProduct',
        '/Payments-ExpressProduct/',
        '/RefArch/en-GB/Payments-Express',
        '/Payments-ExpressProduct?pid=sku-1'
    ])('recognizes the iframe route %s', (path) => {
        expect(isShopperAgentExpressPaymentPath(path)).toBe(true)
    })

    test.each([
        '',
        '/',
        '/cart',
        '/Payments-ExpressCheckout',
        '/Payments-ExpressProduct/details'
    ])('does not recognize the storefront route %s', (path) => {
        expect(isShopperAgentExpressPaymentPath(path)).toBe(false)
    })
})
