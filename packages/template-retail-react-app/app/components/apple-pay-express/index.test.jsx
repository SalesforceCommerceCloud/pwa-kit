/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, waitFor} from '@testing-library/react'
import {ApplePayExpress} from '@salesforce/retail-react-app/app/components/apple-pay-express/index'
import AdyenCheckout from '@adyen/adyen-web'
import {useAdyenExpressCheckout} from '@adyen/adyen-salesforce-pwa'
import {
    getApplePaymentMethodConfig,
    getCustomerShippingDetails,
    getCustomerBillingDetails,
    getAppleButtonConfig
} from '@salesforce/retail-react-app/app/components/apple-pay-express/index'
import {AdyenPaymentsService} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/payments'
import {AdyenShippingAddressService} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/shipping-address'
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/shipping-methods'

// Mock the AdyenCheckout module
jest.mock('@adyen/adyen-web', () => ({
    __esModule: true,
    default: jest.fn()
}))

// Mock the useAdyenExpressCheckout hook
jest.mock('@adyen/adyen-salesforce-pwa', () => ({
    useAdyenExpressCheckout: jest.fn()
}))

// Mock the utility services
jest.mock('@salesforce/retail-react-app/app/components/apple-pay-express/utils/payments', () => ({
    AdyenPaymentsService: jest.fn().mockImplementation(() => ({
        submitPayment: jest.fn()
    }))
}))

jest.mock(
    '@salesforce/retail-react-app/app/components/apple-pay-express/utils/shipping-address',
    () => ({
        AdyenShippingAddressService: jest.fn().mockImplementation(() => ({
            updateShippingAddress: jest.fn()
        }))
    })
)

jest.mock(
    '@salesforce/retail-react-app/app/components/apple-pay-express/utils/shipping-methods',
    () => ({
        AdyenShippingMethodsService: jest.fn().mockImplementation(() => ({
            updateShippingMethod: jest.fn()
        }))
    })
)

// Suppress MSW 'Found an unhandled' warnings for this test file
const originalConsoleError = console.error
beforeAll(() => {
    console.error = (...args) => {
        if (typeof args[0] === 'string' && args[0].startsWith('Found an unhandled')) {
            return
        }
        originalConsoleError(...args)
    }
})
afterAll(() => {
    console.error = originalConsoleError
})

describe('ApplePayExpress', () => {
    const mockProps = {
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

describe('Utility functions', () => {
    it('getApplePaymentMethodConfig returns config for applepay', () => {
        const paymentMethodsResponse = {
            paymentMethods: [
                {type: 'applepay', configuration: {merchantName: 'Test Merchant'}},
                {type: 'card', configuration: {}}
            ]
        }
        expect(getApplePaymentMethodConfig(paymentMethodsResponse)).toEqual({
            merchantName: 'Test Merchant'
        })
    })
    it('getApplePaymentMethodConfig returns null if not found', () => {
        expect(getApplePaymentMethodConfig({paymentMethods: [{type: 'card'}]})).toBeNull()
        expect(getApplePaymentMethodConfig(undefined)).toBeNull()
    })
    it('getCustomerShippingDetails returns correct structure', () => {
        const shippingContact = {
            locality: 'City',
            countryCode: 'US',
            addressLines: ['123 Main St', 'Apt 4'],
            postalCode: '12345',
            administrativeArea: 'CA',
            givenName: 'John',
            familyName: 'Doe',
            emailAddress: 'john@example.com',
            phoneNumber: '555-1234'
        }
        expect(getCustomerShippingDetails(shippingContact)).toEqual({
            deliveryAddress: {
                city: 'City',
                country: 'US',
                houseNumberOrName: 'Apt 4',
                postalCode: '12345',
                stateOrProvince: 'CA',
                street: '123 Main St'
            },
            profile: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '555-1234'
            }
        })
    })
    it('getCustomerBillingDetails returns correct structure', () => {
        const billingContact = {
            locality: 'City',
            countryCode: 'US',
            addressLines: ['123 Main St', 'Apt 4'],
            postalCode: '12345',
            administrativeArea: 'CA'
        }
        expect(getCustomerBillingDetails(billingContact)).toEqual({
            billingAddress: {
                city: 'City',
                country: 'US',
                houseNumberOrName: 'Apt 4',
                postalCode: '12345',
                stateOrProvince: 'CA',
                street: '123 Main St'
            }
        })
    })
})

describe('getAppleButtonConfig', () => {
    const mockAuthToken = 'token'
    const mockSite = 'site'
    const mockBasket = {
        basketId: 'basket',
        orderTotal: 100,
        currency: 'USD',
        customerInfo: {customerId: 'customer'}
    }
    const mockShippingMethods = [{name: 'Standard', description: 'desc', id: 'sm1', price: 10}]
    const mockApplePayConfig = {merchantName: 'Test Merchant'}
    const mockNavigate = jest.fn()
    const mockFetchShippingMethods = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns correct button config', () => {
        const config = getAppleButtonConfig(
            mockAuthToken,
            mockSite,
            mockBasket,
            mockShippingMethods,
            mockApplePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )
        expect(config.showPayButton).toBe(true)
        expect(config.isExpress).toBe(true)
        expect(config.configuration).toBe(mockApplePayConfig)
        expect(config.amount.currency).toBe('USD')
        expect(config.shippingMethods).toHaveLength(1)
    })

    it('onAuthorized resolves on successful payment', async () => {
        const config = getAppleButtonConfig(
            mockAuthToken,
            mockSite,
            mockBasket,
            mockShippingMethods,
            mockApplePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )
        // Mock the service directly
        const mockSubmitPayment = jest
            .fn()
            .mockResolvedValue({isFinal: true, isSuccessful: true, merchantReference: 'order123'})
        AdyenPaymentsService.mockImplementation(() => ({
            submitPayment: mockSubmitPayment
        }))

        const resolve = jest.fn()
        const reject = jest.fn()
        const event = {
            payment: {
                shippingContact: {},
                billingContact: {},
                token: {paymentData: 'data'}
            }
        }
        await config.onAuthorized(resolve, reject, event)
        expect(resolve).toHaveBeenCalled()
        expect(reject).not.toHaveBeenCalled()
    })

    it('onAuthorized rejects on failed payment', async () => {
        const config = getAppleButtonConfig(
            mockAuthToken,
            mockSite,
            mockBasket,
            mockShippingMethods,
            mockApplePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )
        const mockSubmitPayment = jest.fn().mockResolvedValue({isFinal: false, isSuccessful: false})
        AdyenPaymentsService.mockImplementation(() => ({
            submitPayment: mockSubmitPayment
        }))

        const resolve = jest.fn()
        const reject = jest.fn()
        const event = {
            payment: {
                shippingContact: {},
                billingContact: {},
                token: {paymentData: 'data'}
            }
        }
        await config.onAuthorized(resolve, reject, event)
        expect(resolve).not.toHaveBeenCalled()
        expect(reject).toHaveBeenCalled()
    })

    it('onAuthorized rejects on error', async () => {
        const config = getAppleButtonConfig(
            mockAuthToken,
            mockSite,
            mockBasket,
            mockShippingMethods,
            mockApplePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )
        const mockSubmitPayment = jest.fn().mockRejectedValue(new Error('fail'))
        AdyenPaymentsService.mockImplementation(() => ({
            submitPayment: mockSubmitPayment
        }))

        const resolve = jest.fn()
        const reject = jest.fn()
        const event = {
            payment: {
                shippingContact: {},
                billingContact: {},
                token: {paymentData: 'data'}
            }
        }
        await config.onAuthorized(resolve, reject, event)
        expect(resolve).not.toHaveBeenCalled()
        expect(reject).toHaveBeenCalled()
    })

    it('onError sends cancel message for CANCEL error', () => {
        const config = getAppleButtonConfig(
            mockAuthToken,
            mockSite,
            mockBasket,
            mockShippingMethods,
            mockApplePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )
        const postMessage = jest.fn()
        window.parent.postMessage = postMessage
        config.onError({name: 'CANCEL'}, {})
        expect(postMessage).toHaveBeenCalledWith(
            expect.objectContaining({type: 'express.payment.cancel'}),
            '*'
        )
    })
    it('onError sends failure message for other errors', () => {
        const config = getAppleButtonConfig(
            mockAuthToken,
            mockSite,
            mockBasket,
            mockShippingMethods,
            mockApplePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )
        const postMessage = jest.fn()
        window.parent.postMessage = postMessage
        config.onError({name: 'OTHER'}, {})
        expect(postMessage).toHaveBeenCalledWith(
            expect.objectContaining({type: 'express.payment.failure'}),
            '*'
        )
    })

    it('onShippingContactSelected resolves on successful address update', async () => {
        // Set up mocks before calling getAppleButtonConfig
        const mockUpdateShippingAddress = jest.fn().mockResolvedValue({success: true})
        const mockUpdateShippingMethod = jest
            .fn()
            .mockResolvedValue({orderTotal: 110, currency: 'USD'})
        AdyenShippingAddressService.mockImplementation(() => ({
            updateShippingAddress: mockUpdateShippingAddress
        }))
        AdyenShippingMethodsService.mockImplementation(() => ({
            updateShippingMethod: mockUpdateShippingMethod
        }))

        // Mock fetchShippingMethods
        const mockFetchShippingMethods = jest.fn().mockResolvedValue({
            applicableShippingMethods: [
                {id: 'sm1', name: 'Standard', description: '3-5 days', price: 10}
            ]
        })

        const config = getAppleButtonConfig(
            mockAuthToken,
            mockSite,
            mockBasket,
            mockShippingMethods,
            mockApplePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )

        const resolve = jest.fn()
        const reject = jest.fn()
        const event = {
            shippingContact: {
                locality: 'City',
                countryCode: 'US',
                addressLines: ['123 Main St'],
                postalCode: '12345',
                administrativeArea: 'CA'
            }
        }
        await config.onShippingContactSelected(resolve, reject, event)
        expect(resolve).toHaveBeenCalled()
        expect(reject).not.toHaveBeenCalled()
    })

    it('onShippingContactSelected rejects on address update error', async () => {
        const config = getAppleButtonConfig(
            mockAuthToken,
            mockSite,
            mockBasket,
            mockShippingMethods,
            mockApplePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )
        const mockUpdateShippingAddress = jest
            .fn()
            .mockRejectedValue(new Error('Address update failed'))
        AdyenShippingAddressService.mockImplementation(() => ({
            updateShippingAddress: mockUpdateShippingAddress
        }))

        const resolve = jest.fn()
        const reject = jest.fn()
        const event = {
            shippingContact: {
                locality: 'City',
                countryCode: 'US',
                addressLines: ['123 Main St'],
                postalCode: '12345',
                administrativeArea: 'CA'
            }
        }
        await config.onShippingContactSelected(resolve, reject, event)
        expect(resolve).not.toHaveBeenCalled()
        expect(reject).toHaveBeenCalled()
    })

    it('onShippingMethodSelected resolves on successful method update', async () => {
        // Set up mocks before calling getAppleButtonConfig
        const mockUpdateShippingMethod = jest
            .fn()
            .mockResolvedValue({orderTotal: 110, currency: 'USD'})
        AdyenShippingMethodsService.mockImplementation(() => ({
            updateShippingMethod: mockUpdateShippingMethod
        }))

        const config = getAppleButtonConfig(
            mockAuthToken,
            mockSite,
            mockBasket,
            mockShippingMethods,
            mockApplePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )

        const resolve = jest.fn()
        const reject = jest.fn()
        const event = {
            shippingMethod: {
                identifier: 'sm1',
                label: 'Standard Shipping',
                detail: '3-5 business days',
                amount: '10.00'
            }
        }
        await config.onShippingMethodSelected(resolve, reject, event)
        expect(resolve).toHaveBeenCalled()
        expect(reject).not.toHaveBeenCalled()
    })

    it('onShippingMethodSelected rejects on method update error', async () => {
        const config = getAppleButtonConfig(
            mockAuthToken,
            mockSite,
            mockBasket,
            mockShippingMethods,
            mockApplePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )
        const mockUpdateShippingMethod = jest
            .fn()
            .mockRejectedValue(new Error('Method update failed'))
        AdyenShippingMethodsService.mockImplementation(() => ({
            updateShippingMethod: mockUpdateShippingMethod
        }))

        const resolve = jest.fn()
        const reject = jest.fn()
        const event = {
            shippingMethod: {
                identifier: 'sm1',
                label: 'Standard Shipping',
                detail: '3-5 business days',
                amount: '10.00'
            }
        }
        await config.onShippingMethodSelected(resolve, reject, event)
        expect(resolve).not.toHaveBeenCalled()
        expect(reject).toHaveBeenCalled()
    })
})

describe('ApplePayExpress error and edge cases', () => {
    const mockProps = {shippingMethods: []}
    const mockAdyenEnvironment = {ADYEN_ENVIRONMENT: 'test', ADYEN_CLIENT_KEY: 'test_key'}
    const mockAdyenPaymentMethods = {
        paymentMethods: [{type: 'applepay', configuration: {merchantName: 'Test Merchant'}}],
        applicationInfo: {}
    }
    const mockBasket = {
        basketId: 'test-basket',
        orderTotal: 100,
        currency: 'USD',
        customerInfo: {customerId: 'test-customer'}
    }
    let originalPostMessage
    beforeEach(() => {
        jest.clearAllMocks()
        originalPostMessage = window.postMessage
        window.postMessage = jest.fn()
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
    })
    afterEach(() => {
        window.postMessage = originalPostMessage
    })
    it('handles AdyenCheckout throwing', async () => {
        AdyenCheckout.mockImplementation(() => {
            throw new Error('fail')
        })
        render(<ApplePayExpress {...mockProps} />)
        await waitFor(() => {
            expect(window.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({type: 'express.payment.unavailable'}),
                '*'
            )
        })
    })
    it('handles create throwing', async () => {
        AdyenCheckout.mockResolvedValue({
            create: jest.fn().mockImplementation(() => {
                throw new Error('fail create')
            })
        })
        render(<ApplePayExpress {...mockProps} />)
        await waitFor(() => {
            expect(window.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({type: 'express.payment.unavailable'}),
                '*'
            )
        })
    })
    it('handles isAvailable throwing', async () => {
        AdyenCheckout.mockResolvedValue({
            create: jest.fn().mockResolvedValue({
                isAvailable: jest.fn().mockImplementation(() => {
                    throw new Error('fail available')
                }),
                mount: jest.fn()
            })
        })
        render(<ApplePayExpress {...mockProps} />)
        await waitFor(() => {
            expect(window.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({type: 'express.payment.unavailable'}),
                '*'
            )
        })
    })
    it('handles isAvailable returning false', async () => {
        AdyenCheckout.mockResolvedValue({
            create: jest.fn().mockResolvedValue({
                isAvailable: jest.fn().mockResolvedValue(false),
                mount: jest.fn()
            })
        })
        render(<ApplePayExpress {...mockProps} />)
        await waitFor(() => {
            expect(window.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({type: 'express.payment.unavailable'}),
                '*'
            )
        })
    })
    it('handles mount throwing', async () => {
        AdyenCheckout.mockResolvedValue({
            create: jest.fn().mockResolvedValue({
                isAvailable: jest.fn().mockResolvedValue(true),
                mount: jest.fn().mockImplementation(() => {
                    throw new Error('fail mount')
                })
            })
        })
        render(<ApplePayExpress {...mockProps} />)
        await waitFor(() => {
            expect(window.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({type: 'express.payment.unavailable'}),
                '*'
            )
        })
    })
    it('handles missing basket/orderTotal', async () => {
        useAdyenExpressCheckout.mockReturnValue({
            adyenEnvironment: mockAdyenEnvironment,
            adyenPaymentMethods: mockAdyenPaymentMethods,
            basket: undefined,
            locale: {id: 'en-US'},
            site: 'test-site',
            authToken: 'test-token',
            navigate: jest.fn(),
            shippingMethods: {applicableShippingMethods: []},
            fetchShippingMethods: jest.fn()
        })
        render(<ApplePayExpress {...mockProps} />)
        // Should call AdyenCheckout once when basket is undefined
        await waitFor(() => {
            expect(AdyenCheckout).toHaveBeenCalledTimes(1)
        })
    })
    it('handles missing config', async () => {
        useAdyenExpressCheckout.mockReturnValue({
            adyenEnvironment: mockAdyenEnvironment,
            adyenPaymentMethods: {},
            basket: mockBasket,
            locale: {id: 'en-US'},
            site: 'test-site',
            authToken: 'test-token',
            navigate: jest.fn(),
            shippingMethods: {applicableShippingMethods: []},
            fetchShippingMethods: jest.fn()
        })
        AdyenCheckout.mockResolvedValue({
            create: jest.fn().mockResolvedValue({
                isAvailable: jest.fn().mockResolvedValue(true),
                mount: jest.fn()
            })
        })
        render(<ApplePayExpress {...mockProps} />)
        await waitFor(() => {
            expect(AdyenCheckout).toHaveBeenCalled()
        })
    })
})
