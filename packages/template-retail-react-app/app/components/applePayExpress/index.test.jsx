import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import {ApplePayExpress} from './index'
import AdyenCheckout from '@adyen/adyen-web'
import {useAdyenExpressCheckout} from '@adyen/adyen-salesforce-pwa'

// Mock the AdyenCheckout module
jest.mock('@adyen/adyen-web', () => ({
    __esModule: true,
    default: jest.fn()
}))

// Mock the useAdyenExpressCheckout hook
jest.mock('@adyen/adyen-salesforce-pwa', () => ({
    useAdyenExpressCheckout: jest.fn()
}))

describe('ApplePayExpress', () => {
    const mockProps = {
        showLoading: false,
        shippingMethods: []
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
        applicationInfo: {}
    }

    const mockBasket = {
        basketId: 'test-basket',
        orderTotal: 100,
        currency: 'USD',
        customerInfo: {
            customerId: 'test-customer'
        }
    }

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks()

        // Mock the useAdyenExpressCheckout hook
        useAdyenExpressCheckout.mockReturnValue({
            adyenEnvironment: mockAdyenEnvironment,
            adyenPaymentMethods: mockAdyenPaymentMethods,
            basket: mockBasket,
            locale: {id: 'en-US'},
            site: 'test-site',
            authToken: 'test-token',
            navigate: jest.fn(),
            shippingMethods: {applicableShippingMethods: []},
            fetchShippingMethods: jest.fn()
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
    })

    it('renders loading spinner when showLoading is true', () => {
        render(<ApplePayExpress {...mockProps} showLoading={true} />)
        expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('initializes AdyenCheckout with correct configuration', async () => {
        render(<ApplePayExpress {...mockProps} />)
        
        await waitFor(() => {
            expect(AdyenCheckout).toHaveBeenCalledWith({
                environment: mockAdyenEnvironment.ADYEN_ENVIRONMENT,
                clientKey: mockAdyenEnvironment.ADYEN_CLIENT_KEY,
                locale: 'en-US',
                analytics: {
                    analyticsData: {
                        applicationInfo: mockAdyenPaymentMethods.applicationInfo
                    }
                }
            })
        })
    })

    it('handles Apple Pay unavailability', async () => {
        // Mock AdyenCheckout to throw an error
        AdyenCheckout.mockRejectedValue(new Error('Apple Pay not available'))

        const originalPostMessage = window.postMessage
        const mockPostMessage = jest.fn()
        window.postMessage = mockPostMessage

        render(<ApplePayExpress {...mockProps} />)

        await waitFor(() => {
            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'express.payment.unavailable',
                    payload: {PAYMENT_METHOD: 'applepay'}
                }),
                '*'
            )
        })

        window.postMessage = originalPostMessage
    })

    it('mounts Apple Pay button when available', async () => {
        render(<ApplePayExpress {...mockProps} />)

        await waitFor(() => {
            expect(AdyenCheckout).toHaveBeenCalled()
        })
    })
})