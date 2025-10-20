/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import SFPaymentsExpress from '@salesforce/retail-react-app/app/components/sf-payments-express'
import basketWithSuit from '@salesforce/retail-react-app/app/mocks/basket-with-suit'
import emptyBasket from '@salesforce/retail-react-app/app/mocks/empty-basket'
import {EXPRESS_PAY_NOW} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'

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

// Mock the useCurrentBasket hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn()
}))

// Mock the SFPaymentsExpressButtons child component
jest.mock('@salesforce/retail-react-app/app/components/sf-payments-express-buttons', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PropTypes = require('prop-types')

    const MockSFPaymentsExpressButtons = ({
        usage,
        paymentCurrency,
        paymentCountryCode,
        initialAmount,
        expressButtonLayout,
        maximumButtonCount
    }) => {
        return (
            <div data-testid="sf-payments-express-buttons">
                <div data-testid="usage">{usage}</div>
                <div data-testid="payment-currency">{paymentCurrency}</div>
                <div data-testid="payment-country-code">{paymentCountryCode}</div>
                <div data-testid="initial-amount">{initialAmount}</div>
                <div data-testid="express-button-layout">{expressButtonLayout}</div>
                <div data-testid="maximum-button-count">{maximumButtonCount}</div>
            </div>
        )
    }

    MockSFPaymentsExpressButtons.propTypes = {
        usage: PropTypes.number,
        paymentCurrency: PropTypes.string,
        paymentCountryCode: PropTypes.string,
        initialAmount: PropTypes.number,
        expressButtonLayout: PropTypes.string,
        maximumButtonCount: PropTypes.number
    }

    return MockSFPaymentsExpressButtons
})

// Import after mocking
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

// Helper function to normalize basket data (convert snake_case to camelCase)
const normalizeBasket = (basket) => {
    if (!basket) return {}
    return {
        ...basket,
        basketId: basket.basketId || basket.basket_id,
        orderTotal: basket.orderTotal || basket.order_total,
        productSubTotal: basket.productSubTotal || basket.product_sub_total
    }
}

// Helper function to create mock basket data
const createMockBasket = (basket) => {
    const normalizedBasket = normalizeBasket(basket)
    return {
        data: normalizedBasket,
        derivedData: {
            hasBasket: !!normalizedBasket?.basketId,
            totalItems:
                normalizedBasket?.productItems?.reduce((sum, item) => sum + item.quantity, 0) || 0,
            shipmentIdToTotalItems: {},
            totalDeliveryShipments: 0,
            totalPickupShipments: 0,
            pickupStoreIds: [],
            isMissingShippingAddress: false,
            isMissingShippingMethod: false,
            totalShippingCost: 0
        },
        currency: normalizedBasket?.currency || 'USD'
    }
}

afterEach(() => {
    jest.clearAllMocks()
})

describe('SFPaymentsExpress', () => {
    test('renders SFPaymentsExpressButtons when basket exists', () => {
        useCurrentBasket.mockReturnValue(createMockBasket(basketWithSuit))

        renderWithProviders(<SFPaymentsExpress />)

        expect(screen.getByTestId('sf-payments-express-buttons')).toBeInTheDocument()
        expect(screen.getByTestId('usage')).toHaveTextContent(EXPRESS_PAY_NOW)
        expect(screen.getByTestId('payment-currency')).toHaveTextContent(basketWithSuit.currency)
        expect(screen.getByTestId('payment-country-code')).toHaveTextContent('')
        expect(screen.getByTestId('initial-amount')).toHaveTextContent(
            (basketWithSuit.order_total || basketWithSuit.orderTotal).toString()
        )
        expect(screen.getByTestId('express-button-layout')).toHaveTextContent('vertical')
    })

    test('renders null when basket does not exist', () => {
        useCurrentBasket.mockReturnValue(createMockBasket(null))

        renderWithProviders(<SFPaymentsExpress />)

        expect(screen.queryByTestId('sf-payments-express-buttons')).not.toBeInTheDocument()
    })

    test('renders null when basketId is not present', () => {
        useCurrentBasket.mockReturnValue(
            createMockBasket({...basketWithSuit, basketId: null, basket_id: null})
        )

        renderWithProviders(<SFPaymentsExpress />)

        expect(screen.queryByTestId('sf-payments-express-buttons')).not.toBeInTheDocument()
    })

    test('passes correct props with custom expressButtonLayout', () => {
        useCurrentBasket.mockReturnValue(createMockBasket(basketWithSuit))

        renderWithProviders(<SFPaymentsExpress expressButtonLayout="horizontal" />)

        expect(screen.getByTestId('express-button-layout')).toHaveTextContent('horizontal')
    })

    test('passes correct props with custom maximumButtonCount', () => {
        useCurrentBasket.mockReturnValue(createMockBasket(basketWithSuit))

        renderWithProviders(<SFPaymentsExpress maximumButtonCount={3} />)

        expect(screen.getByTestId('maximum-button-count')).toHaveTextContent('3')
    })

    test('passes onPaymentMethodsRendered callback when provided', () => {
        useCurrentBasket.mockReturnValue(createMockBasket(basketWithSuit))

        const mockCallback = jest.fn()
        renderWithProviders(<SFPaymentsExpress onPaymentMethodsRendered={mockCallback} />)

        expect(screen.getByTestId('sf-payments-express-buttons')).toBeInTheDocument()
    })

    test('uses orderTotal as initialAmount when available', () => {
        const basketWithOrderTotal = {
            ...basketWithSuit,
            orderTotal: 100,
            productSubTotal: 50
        }

        useCurrentBasket.mockReturnValue(createMockBasket(basketWithOrderTotal))

        renderWithProviders(<SFPaymentsExpress />)

        expect(screen.getByTestId('initial-amount')).toHaveTextContent('100')
    })

    test('uses productSubTotal as initialAmount when orderTotal is not available', () => {
        const basketWithoutOrderTotal = {
            ...basketWithSuit,
            orderTotal: null,
            order_total: null, // Also set snake_case version to null
            productSubTotal: 50,
            product_sub_total: 50
        }

        useCurrentBasket.mockReturnValue(createMockBasket(basketWithoutOrderTotal))

        renderWithProviders(<SFPaymentsExpress />)

        expect(screen.getByTestId('initial-amount')).toHaveTextContent('50')
    })

    test('passes billingAddress countryCode as paymentCountryCode', () => {
        const basketWithBillingAddress = {
            ...basketWithSuit,
            billingAddress: {
                countryCode: 'US'
            }
        }

        useCurrentBasket.mockReturnValue(createMockBasket(basketWithBillingAddress))

        renderWithProviders(<SFPaymentsExpress />)

        expect(screen.getByTestId('payment-country-code')).toHaveTextContent('US')
    })

    test('handles empty basket correctly', () => {
        useCurrentBasket.mockReturnValue(createMockBasket(emptyBasket))

        renderWithProviders(<SFPaymentsExpress />)

        expect(screen.getByTestId('sf-payments-express-buttons')).toBeInTheDocument()
        expect(screen.getByTestId('payment-currency')).toHaveTextContent(emptyBasket.currency)
        expect(screen.getByTestId('initial-amount')).toHaveTextContent('0')
    })

    test('calls useCurrentBasket hook', () => {
        useCurrentBasket.mockReturnValue(createMockBasket(basketWithSuit))

        renderWithProviders(<SFPaymentsExpress />)

        expect(screen.getByTestId('sf-payments-express-buttons')).toBeInTheDocument()
        expect(useCurrentBasket).toHaveBeenCalled()
    })
})
