/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render} from '@testing-library/react'

import UnavailableExpressPaymentProvider from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/providers/unavailable-express-payment-provider'

describe('UnavailableExpressPaymentProvider', () => {
    test('renders nothing and reports unavailable', () => {
        const lifecycle = {
            available: jest.fn(),
            unavailable: jest.fn(),
            success: jest.fn(),
            failure: jest.fn(),
            cancel: jest.fn()
        }

        const {container} = render(
            <UnavailableExpressPaymentProvider
                context={{
                    providerApiVersion: 1,
                    mode: 'shopper-agent',
                    surface: 'product',
                    siteId: 'site-1',
                    locale: 'en-US',
                    currency: 'USD',
                    productId: 'product-1',
                    quantity: 1
                }}
                lifecycle={lifecycle}
            />
        )

        expect(container).toBeEmptyDOMElement()
        expect(lifecycle.unavailable).toHaveBeenCalledTimes(1)
        expect(lifecycle.available).not.toHaveBeenCalled()
    })
})
