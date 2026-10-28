/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

const mockPostExpressPaymentEvent = jest.fn(() => true)
const mockUseExpressPaymentBasket = jest.fn(() => ({
    basketId: 'basket-1',
    status: 'ready'
}))

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

jest.mock(
    '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/use-express-payment-basket',
    () =>
        (...args) =>
            mockUseExpressPaymentBasket(...args)
)

import ExpressPaymentIframeShell from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/express-payment-iframe-shell'
import ContractTestProvider from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/contract-test-provider'
import MinimalProviderFixture from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/test-fixtures/minimal-provider-fixture'

describe('ExpressPaymentIframeShell', () => {
    let resizeObserverCallback

    beforeEach(() => {
        jest.clearAllMocks()
        resizeObserverCallback = undefined
        global.ResizeObserver = jest.fn((callback) => {
            resizeObserverCallback = callback
            return {observe: jest.fn(), disconnect: jest.fn()}
        })
    })

    afterEach(() => {
        delete global.ResizeObserver
    })

    test('renders the product fixture and reports availability with a measured height', async () => {
        window.history.pushState(
            {},
            '',
            '/Payments-ExpressProduct?pid=sku-1&quantity=2&parentOrigin=https%3A%2F%2Fstore.example.com'
        )

        renderWithProviders(<ExpressPaymentIframeShell Provider={ContractTestProvider} />)

        expect(screen.getByTestId('express-payment-iframe-shell')).toHaveAttribute(
            'data-payment-surface',
            'product'
        )
        expect(screen.getByText('Product: sku-1, quantity: 2')).toBeInTheDocument()
        await waitFor(() =>
            expect(mockPostExpressPaymentEvent).toHaveBeenCalledWith({
                parentOrigin: 'https://store.example.com',
                type: 'express.payment.available',
                payload: {height: 44}
            })
        )
    })

    test('delivers cart context and reports later height changes', async () => {
        window.history.pushState(
            {},
            '',
            '/Payments-Express?parentOrigin=https%3A%2F%2Fstore.example.com'
        )

        renderWithProviders(<ExpressPaymentIframeShell Provider={ContractTestProvider} />)

        const shell = screen.getByTestId('express-payment-iframe-shell')
        expect(shell).toHaveAttribute('data-payment-surface', 'cart')
        expect(screen.getByText('Cart payment surface, basket: basket-1')).toBeInTheDocument()
        expect(mockUseExpressPaymentBasket).toHaveBeenCalledWith({enabled: true})

        shell.getBoundingClientRect = jest.fn(() => ({height: 172.2}))
        resizeObserverCallback()

        await waitFor(() =>
            expect(mockPostExpressPaymentEvent).toHaveBeenCalledWith({
                parentOrigin: 'https://store.example.com',
                type: 'express.payment.available',
                payload: {height: 173}
            })
        )

        shell.getBoundingClientRect = jest.fn(() => ({height: 800}))
        resizeObserverCallback()

        await waitFor(() =>
            expect(mockPostExpressPaymentEvent).toHaveBeenCalledWith({
                parentOrigin: 'https://store.example.com',
                type: 'express.payment.available',
                payload: {height: 800}
            })
        )
    })

    test('rejects an invalid product context and reports unavailable', async () => {
        window.history.pushState(
            {},
            '',
            '/Payments-ExpressProduct?quantity=0&parentOrigin=https%3A%2F%2Fstore.example.com'
        )

        renderWithProviders(<ExpressPaymentIframeShell />)

        expect(screen.queryByTestId('express-payment-iframe-shell')).not.toBeInTheDocument()
        await waitFor(() =>
            expect(mockPostExpressPaymentEvent).toHaveBeenCalledWith({
                parentOrigin: 'https://store.example.com',
                type: 'express.payment.unavailable',
                payload: {}
            })
        )
    })

    test('renders no payment UI and reports unavailable when no provider is selected', async () => {
        window.history.pushState(
            {},
            '',
            '/Payments-ExpressProduct?pid=sku-1&quantity=1&parentOrigin=https%3A%2F%2Fstore.example.com'
        )

        renderWithProviders(<ExpressPaymentIframeShell />)

        expect(screen.getByTestId('express-payment-iframe-shell')).toBeEmptyDOMElement()
        expect(
            screen.queryByTestId('express-payment-contract-test-provider')
        ).not.toBeInTheDocument()
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

        renderWithProviders(<ExpressPaymentIframeShell />)

        expect(screen.queryByTestId('express-payment-iframe-shell')).not.toBeInTheDocument()
        expect(mockPostExpressPaymentEvent).not.toHaveBeenCalled()
    })

    test('renders a contrasting provider through the same shell', async () => {
        const user = userEvent.setup()
        window.history.pushState(
            {},
            '',
            '/Payments-ExpressProduct?pid=sku-1&quantity=1&parentOrigin=https%3A%2F%2Fstore.example.com'
        )

        renderWithProviders(<ExpressPaymentIframeShell Provider={MinimalProviderFixture} />)

        expect(screen.getByTestId('express-payment-iframe-shell')).toHaveAttribute(
            'data-payment-surface',
            'product'
        )
        expect(screen.getByTestId('minimal-provider-fixture')).toBeInTheDocument()

        await user.click(screen.getByRole('button', {name: 'Begin local attempt'}))
        expect(screen.getByRole('status')).toHaveTextContent('Local attempts: 1')
        await waitFor(() =>
            expect(mockPostExpressPaymentEvent).toHaveBeenCalledWith({
                parentOrigin: 'https://store.example.com',
                type: 'express.payment.available',
                payload: {height: 44}
            })
        )
    })
})
