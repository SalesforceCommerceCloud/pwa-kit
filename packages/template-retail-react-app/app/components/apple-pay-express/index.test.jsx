/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, waitFor} from '@testing-library/react'
import {ApplePayExpress} from '@salesforce/retail-react-app/app/components/apple-pay-express/index'

// Mock AdyenCheckout
jest.mock('@adyen/adyen-web', () => ({
    __esModule: true,
    default: jest.fn()
}))

// Mock the useExpressPaymentSetup hook
jest.mock(
    '@salesforce/retail-react-app/app/components/express/hooks/use-express-payment-setup',
    () => ({
        useExpressPaymentSetup: jest.fn()
    })
)

// Mock the express-payment-utils module
jest.mock(
    '@salesforce/retail-react-app/app/components/express/utils/express-payment-utils',
    () => ({
        createAdyenCheckout: jest.fn(),
        validateExpressPaymentSetup: jest.fn(),
        isMissingOrderTotalError: jest.fn(),
        getExpressPaymentDependencies: jest.fn(),
        getPaymentMethodConfig: jest.fn()
    })
)

// Mock the component's utility functions
jest.mock('./index', () => ({
    ...jest.requireActual('./index'),
    getApplePaymentMethodConfig: jest.fn(),
    getAppleButtonConfig: jest.fn()
}))

// Mock temporary basket utilities
jest.mock('@salesforce/retail-react-app/app/components/express/utils/pdp/temporary-basket', () => ({
    createTemporaryBasket: jest.fn(),
    deleteTemporaryBasket: jest.fn(),
    cleanupTemporaryBasket: jest.fn()
}))

// Mock basket calculation utilities
jest.mock(
    '@salesforce/retail-react-app/app/components/express/utils/pdp/basket-calculation',
    () => ({
        getBasketWithTotals: jest.fn(),
        forceOrderCalculation: jest.fn()
    })
)

// Mock the useMultiSite hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: jest.fn()
}))

// Mock the useNavigation hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-navigation', () => ({
    __esModule: true,
    default: jest.fn()
}))

// Mock the useStandalonePaymentMethods hook
jest.mock(
    '@salesforce/retail-react-app/app/components/express/hooks/use-standalone-payment-methods',
    () => ({
        useStandalonePaymentMethods: jest.fn()
    })
)

// Import mocked modules
import AdyenCheckout from '@adyen/adyen-web'
import {useExpressPaymentSetup} from '@salesforce/retail-react-app/app/components/express/hooks/use-express-payment-setup'
import {
    createAdyenCheckout,
    validateExpressPaymentSetup,
    isMissingOrderTotalError,
    getExpressPaymentDependencies,
    getPaymentMethodConfig
} from '@salesforce/retail-react-app/app/components/express/utils/express-payment-utils'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useStandalonePaymentMethods} from '@salesforce/retail-react-app/app/components/express/hooks/use-standalone-payment-methods'
import {
    getApplePaymentMethodConfig,
    getAppleButtonConfig
} from '@salesforce/retail-react-app/app/components/apple-pay-express/index'

describe('ApplePayExpress', () => {
    // Mock data
    const mockBasket = {
        basketId: 'test-basket',
        orderTotal: 100,
        currency: 'USD',
        customerInfo: {
            customerId: 'test-customer'
        }
    }

    const mockAdyenEnvironment = {
        ADYEN_ENVIRONMENT: 'test',
        ADYEN_CLIENT_KEY: 'test_key'
    }

    const mockAdyenPaymentMethods = {
        paymentMethods: [
            {
                type: 'applepay',
                configuration: {
                    merchantName: 'Test Merchant'
                }
            }
        ],
        applicationInfo: {},
        environment: mockAdyenEnvironment,
        applicableShippingMethods: [],
        fetchShippingMethods: jest.fn()
    }

    const mockProps = {
        adyenPaymentMethods: mockAdyenPaymentMethods,
        authToken: 'test-token',
        locale: {id: 'en-US'},
        site: {id: 'test-site'},
        basket: mockBasket,
        sku: null,
        quantity: 1,
        isPdpMode: false,
        manager: {
            setPaymentMethodAvailable: jest.fn(),
            setPaymentMethodUnavailable: jest.fn()
        }
    }

    beforeEach(() => {
        jest.clearAllMocks()

        // Mock useMultiSite hook
        useMultiSite.mockReturnValue({
            locale: {id: 'en-US'},
            site: {id: 'test-site'}
        })

        // Mock useNavigation hook
        useNavigation.mockReturnValue(jest.fn())

        // Mock useStandalonePaymentMethods hook
        useStandalonePaymentMethods.mockReturnValue({
            paymentMethods: null,
            loading: false,
            error: null
        })

        // Mock the useExpressPaymentSetup hook
        useExpressPaymentSetup.mockReturnValue({
            locale: {id: 'en-US'},
            site: {id: 'test-site'},
            tempBasket: null,
            setTempBasket: jest.fn(),
            currentSku: null,
            hasRequiredBasketData: true
        })

        // Mock AdyenCheckout
        const mockCreate = jest.fn()
        const mockIsAvailable = jest.fn()
        const mockMount = jest.fn()

        AdyenCheckout.mockResolvedValue({
            create: mockCreate.mockResolvedValue({
                isAvailable: mockIsAvailable.mockResolvedValue(true),
                mount: mockMount
            })
        })

        // Mock createAdyenCheckout
        createAdyenCheckout.mockResolvedValue({
            create: mockCreate.mockResolvedValue({
                isAvailable: mockIsAvailable.mockResolvedValue(true),
                mount: mockMount
            })
        })

        // Mock validateExpressPaymentSetup
        validateExpressPaymentSetup.mockReturnValue(true)

        // Mock isMissingOrderTotalError
        isMissingOrderTotalError.mockReturnValue(false)

        // Mock getExpressPaymentDependencies
        getExpressPaymentDependencies.mockReturnValue([])

        // Mock getPaymentMethodConfig
        getPaymentMethodConfig.mockReturnValue({
            merchantName: 'Test Merchant'
        })

        // Mock getApplePaymentMethodConfig
        getApplePaymentMethodConfig.mockReturnValue({
            merchantName: 'Test Merchant'
        })

        // Mock getAppleButtonConfig
        getAppleButtonConfig.mockReturnValue({
            showPayButton: true,
            isExpress: true,
            configuration: {merchantName: 'Test Merchant'},
            amount: {currency: 'USD', value: 10000}
        })
    })

    it('renders without crashing', () => {
        render(<ApplePayExpress {...mockProps} />)
        expect(true).toBe(true)
    })

    it('initializes AdyenCheckout when validation passes', async () => {
        render(<ApplePayExpress {...mockProps} />)

        await waitFor(() => {
            expect(createAdyenCheckout).toHaveBeenCalledWith(
                mockAdyenEnvironment,
                {id: 'en-US'},
                {}
            )
        })
    })

    it('sets payment method as unavailable when validation fails', async () => {
        validateExpressPaymentSetup.mockReturnValue(false)

        render(<ApplePayExpress {...mockProps} />)

        await waitFor(() => {
            expect(mockProps.manager.setPaymentMethodUnavailable).toHaveBeenCalledWith('applepay')
        })
    })

    it('sets payment method as unavailable when adyenPaymentMethods.environment is missing', async () => {
        const propsWithoutEnvironment = {
            ...mockProps,
            adyenPaymentMethods: {
                ...mockAdyenPaymentMethods,
                environment: undefined
            }
        }

        render(<ApplePayExpress {...propsWithoutEnvironment} />)

        await waitFor(() => {
            expect(mockProps.manager.setPaymentMethodUnavailable).toHaveBeenCalledWith('applepay')
        })
    })

    it('handles createAdyenCheckout failure', async () => {
        createAdyenCheckout.mockRejectedValue(new Error('Checkout creation failed'))

        render(<ApplePayExpress {...mockProps} />)

        await waitFor(() => {
            expect(mockProps.manager.setPaymentMethodUnavailable).toHaveBeenCalledWith('applepay')
        })
    })

    it('handles button creation failure', async () => {
        const mockCreate = jest.fn().mockRejectedValue(new Error('Button creation failed'))
        createAdyenCheckout.mockResolvedValue({
            create: mockCreate
        })

        render(<ApplePayExpress {...mockProps} />)

        await waitFor(() => {
            expect(mockProps.manager.setPaymentMethodUnavailable).toHaveBeenCalledWith('applepay')
        })
    })

    it('handles button availability check failure', async () => {
        const mockIsAvailable = jest.fn().mockRejectedValue(new Error('Availability check failed'))
        const mockCreate = jest.fn().mockResolvedValue({
            isAvailable: mockIsAvailable
        })
        createAdyenCheckout.mockResolvedValue({
            create: mockCreate
        })

        render(<ApplePayExpress {...mockProps} />)

        await waitFor(() => {
            expect(mockProps.manager.setPaymentMethodUnavailable).toHaveBeenCalledWith('applepay')
        })
    })

    it('handles button availability returning false', async () => {
        const mockIsAvailable = jest.fn().mockResolvedValue(false)
        const mockCreate = jest.fn().mockResolvedValue({
            isAvailable: mockIsAvailable
        })
        createAdyenCheckout.mockResolvedValue({
            create: mockCreate
        })

        render(<ApplePayExpress {...mockProps} />)

        await waitFor(() => {
            expect(mockProps.manager.setPaymentMethodUnavailable).toHaveBeenCalledWith('applepay')
        })
    })

    it('handles button mount failure', async () => {
        const mockMount = jest.fn().mockRejectedValue(new Error('Mount failed'))
        const mockIsAvailable = jest.fn().mockResolvedValue(true)
        const mockCreate = jest.fn().mockResolvedValue({
            isAvailable: mockIsAvailable,
            mount: mockMount
        })
        createAdyenCheckout.mockResolvedValue({
            create: mockCreate
        })

        render(<ApplePayExpress {...mockProps} />)

        await waitFor(() => {
            expect(mockProps.manager.setPaymentMethodUnavailable).toHaveBeenCalledWith('applepay')
        })
    })

    it('sets payment method as available when everything succeeds', async () => {
        const mockMount = jest.fn().mockResolvedValue(undefined)
        const mockIsAvailable = jest.fn().mockResolvedValue(true)
        const mockCreate = jest.fn().mockResolvedValue({
            isAvailable: mockIsAvailable,
            mount: mockMount
        })
        createAdyenCheckout.mockResolvedValue({
            create: mockCreate
        })

        render(<ApplePayExpress {...mockProps} />)

        await waitFor(() => {
            expect(mockProps.manager.setPaymentMethodAvailable).toHaveBeenCalledWith('applepay')
        })
    })

    it('handles missing order total error gracefully', async () => {
        isMissingOrderTotalError.mockReturnValue(true)
        createAdyenCheckout.mockRejectedValue(new Error('Missing order total'))

        render(<ApplePayExpress {...mockProps} />)

        // Should not call setPaymentMethodUnavailable for expected PDP errors
        await waitFor(() => {
            expect(mockProps.manager.setPaymentMethodUnavailable).not.toHaveBeenCalled()
        })
    })

    it('works in PDP mode with SKU', async () => {
        const pdpProps = {
            ...mockProps,
            isPdpMode: true,
            sku: 'TEST-SKU',
            basket: undefined
        }

        // Mock useExpressPaymentSetup for PDP mode
        useExpressPaymentSetup.mockReturnValue({
            locale: {id: 'en-US'},
            site: {id: 'test-site'},
            tempBasket: null,
            setTempBasket: jest.fn(),
            currentSku: 'TEST-SKU',
            hasRequiredBasketData: false
        })

        render(<ApplePayExpress {...pdpProps} />)

        // Should still try to create checkout even without basket data in PDP mode
        await waitFor(() => {
            expect(createAdyenCheckout).toHaveBeenCalled()
        })
    })
})
