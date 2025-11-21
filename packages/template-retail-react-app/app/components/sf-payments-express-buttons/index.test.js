/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import SFPaymentsExpressButtons from '@salesforce/retail-react-app/app/components/sf-payments-express-buttons'
import {
    EXPRESS_PAY_NOW,
    EXPRESS_BUY_NOW
} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'

// Mock getConfig to provide necessary configuration
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    const actual = jest.requireActual('@salesforce/pwa-kit-runtime/utils/ssr-config')
    const mockConfig = jest.requireActual('@salesforce/retail-react-app/config/mocks/default')
    return {
        ...actual,
        getConfig: jest.fn(() => ({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                sfPayments: {
                    enabled: true
                }
            }
        }))
    }
})

// Mock the SF Payments hooks
jest.mock('@salesforce/retail-react-app/app/hooks/use-sf-payments-country', () => ({
    useSFPaymentsCountry: () => ({countryCode: 'US'})
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-sf-payments', () => {
    const actual = jest.requireActual('@salesforce/retail-react-app/app/hooks/use-sf-payments')
    return {
        ...actual,
        useSFPayments: () => ({
            sfp: null, // Not initialized
            metadata: null, // Not initialized
            startConfirming: jest.fn(),
            endConfirming: jest.fn()
        })
    }
})

afterEach(() => {
    jest.clearAllMocks()
})

const defaultProps = {
    usage: EXPRESS_PAY_NOW,
    paymentCurrency: 'USD',
    paymentCountryCode: 'US',
    initialAmount: 100,
    prepareBasket: jest.fn()
}
describe('SFPaymentsExpressButtons', () => {
    test('renders container element', () => {
        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders with EXPRESS_PAY_NOW usage', () => {
        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} usage={EXPRESS_PAY_NOW} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders with EXPRESS_BUY_NOW usage', () => {
        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} usage={EXPRESS_BUY_NOW} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders with horizontal layout', () => {
        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} expressButtonLayout="horizontal" />
        )

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders with vertical layout', () => {
        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} expressButtonLayout="vertical" />
        )

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders with maximumButtonCount prop', () => {
        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} maximumButtonCount={2} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders with onPaymentMethodsRendered callback', () => {
        const mockCallback = jest.fn()

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} onPaymentMethodsRendered={mockCallback} />
        )

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders with custom paymentCurrency', () => {
        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} paymentCurrency="EUR" />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders with custom initialAmount', () => {
        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} initialAmount={250} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders without paymentCountryCode (uses fallback)', () => {
        const propsWithoutCountry = {...defaultProps}
        delete propsWithoutCountry.paymentCountryCode

        renderWithProviders(<SFPaymentsExpressButtons {...propsWithoutCountry} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders with custom prepareBasket function', () => {
        const customPrepareBasket = jest.fn()

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={customPrepareBasket} />
        )

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })
    test('renders with onExpressPaymentCompleted callback', () => {
        const mockCallback = jest.fn()

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} onExpressPaymentCompleted={mockCallback} />
        )

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })
    test('renders with initialAmount of 0', () => {
        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} initialAmount={0} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })
})

describe('prepareBasket prop updates', () => {
    test('component handles prepareBasket prop changes without errors', () => {
        const prepareBasket1 = jest.fn()
        const {rerender} = renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket1} />
        )

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()

        // Change prepareBasket prop (simulates variant change on PDP)
        const prepareBasket2 = jest.fn()
        rerender(<SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket2} />)

        // Component should still render without errors
        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })
})
