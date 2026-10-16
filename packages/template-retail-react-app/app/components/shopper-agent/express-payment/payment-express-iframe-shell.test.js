/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

const mockPostExpressPaymentEvent = jest.fn(() => true)

jest.mock('@salesforce/retail-react-app/app/hooks/use-app-origin', () => ({
    useAppOrigin: jest.fn(() => 'https://store.example.com')
}))

jest.mock(
    '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/messages',
    () => ({
        ...jest.requireActual(
            '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/messages'
        ),
        postExpressPaymentEvent: (...args) => mockPostExpressPaymentEvent(...args)
    })
)

import PaymentExpressIframeShell from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/payment-express-iframe-shell'

describe('PaymentExpressIframeShell', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders the product fixture and reports availability with a measured height', async () => {
        window.history.pushState(
            {},
            '',
            '/Payments-ExpressProduct?pid=sku-1&quantity=2&parentOrigin=https%3A%2F%2Fstore.example.com'
        )

        renderWithProviders(<PaymentExpressIframeShell />)

        expect(screen.getByTestId('payment-express-iframe-shell')).toHaveAttribute(
            'data-payment-surface',
            'product'
        )
        expect(screen.getByText('Product: sku-1, quantity: 2')).toBeInTheDocument()
        await waitFor(() =>
            expect(mockPostExpressPaymentEvent).toHaveBeenCalledWith({
                parentOrigin: 'https://store.example.com',
                type: 'express.payment.available',
                payload: {height: 44, paymentMethods: ['CONTRACT_TEST']}
            })
        )
    })

    test('rejects an invalid product context and reports unavailable', async () => {
        window.history.pushState(
            {},
            '',
            '/Payments-ExpressProduct?quantity=0&parentOrigin=https%3A%2F%2Fstore.example.com'
        )

        renderWithProviders(<PaymentExpressIframeShell />)

        expect(screen.getByTestId('express-payment-invalid-context')).toBeInTheDocument()
        await waitFor(() =>
            expect(mockPostExpressPaymentEvent).toHaveBeenCalledWith({
                parentOrigin: 'https://store.example.com',
                type: 'express.payment.unavailable',
                payload: {}
            })
        )
    })

    test('rejects a parent origin that is not the storefront origin', () => {
        window.history.pushState(
            {},
            '',
            '/Payments-Express?parentOrigin=https%3A%2F%2Fattacker.example.com'
        )

        renderWithProviders(<PaymentExpressIframeShell />)

        expect(screen.getByTestId('express-payment-invalid-origin')).toBeInTheDocument()
        expect(mockPostExpressPaymentEvent).not.toHaveBeenCalled()
    })
})
