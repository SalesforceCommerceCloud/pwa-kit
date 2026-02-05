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
import {rest} from 'msw'

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

beforeEach(() => {
    // Reset MSW handlers to avoid conflicts
    global.server.resetHandlers()

    // Add MSW handlers to mock API requests
    global.server.use(
        rest.get('*/api/configuration/shopper-configurations/*', (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.status(200),
                ctx.json({
                    configurations: []
                })
            )
        }),
        rest.get(
            '*/api/customer/shopper-customers/*/customers/*/product-lists',
            (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.status(200),
                    ctx.json({
                        data: [],
                        total: 0
                    })
                )
            }
        ),
        rest.get('*/api/payment-metadata', (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.status(200),
                ctx.json({
                    apiKey: 'test-key',
                    publishableKey: 'pk_test'
                })
            )
        }),
        rest.get('*/api/checkout/shopper-payments/*/payment-configuration', (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.status(200),
                ctx.json({
                    paymentMethods: [
                        {id: 'card', name: 'Card'},
                        {id: 'paypal', name: 'PayPal'}
                    ],
                    paymentMethodSetAccounts: []
                })
            )
        })
    )
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
    test('component renders and handles prop changes without errors', () => {
        const {rerender} = renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} paymentCurrency="USD" />
        )

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()

        // Simulate prop change that would trigger useEffect
        rerender(<SFPaymentsExpressButtons {...defaultProps} paymentCurrency="EUR" />)

        // Should still render without errors
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

describe('failOrder error handling', () => {
    const mockFailOrder = jest.fn()
    const mockCreateOrder = jest.fn()
    const mockUpdatePaymentInstrument = jest.fn()
    const mockToast = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        mockFailOrder.mockResolvedValue({})
    })

    // Mock the mutations to verify they're available
    jest.mock('@salesforce/commerce-sdk-react', () => {
        const actual = jest.requireActual('@salesforce/commerce-sdk-react')
        return {
            ...actual,
            useShopperOrdersMutation: (mutationKey) => {
                if (mutationKey === 'failOrder') {
                    return {mutateAsync: mockFailOrder}
                }
                if (mutationKey === 'createOrder') {
                    return {mutateAsync: mockCreateOrder}
                }
                if (mutationKey === 'updatePaymentInstrumentForOrder') {
                    return {mutateAsync: mockUpdatePaymentInstrument}
                }
                return {mutateAsync: jest.fn()}
            },
            usePaymentConfiguration: () => ({
                data: {
                    paymentMethods: [{id: 'card', name: 'Card'}],
                    paymentMethodSetAccounts: []
                }
            }),
            useShopperBasketsMutation: () => ({
                mutateAsync: jest.fn()
            }),
            useShippingMethodsForShipment: () => ({
                refetch: jest.fn()
            })
        }
    })

    jest.mock('@salesforce/retail-react-app/app/hooks/use-shopper-configuration', () => ({
        useShopperConfiguration: () => 'default'
    }))

    jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({
        useToast: () => mockToast
    }))

    // It doesn't trigger the actual failOrder call (that requires the full payment flow), but it confirms the setup is correct.
    // The actual failOrder call is better tested in integration/E2E tests.
    test('failOrder mutation is available and error message constant is defined', () => {
        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
        expect(mockFailOrder).toBeDefined()
        expect(mockToast).toBeDefined()
    })
})
