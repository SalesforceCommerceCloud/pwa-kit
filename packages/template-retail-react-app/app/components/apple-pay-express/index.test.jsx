/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getApplePaymentMethodConfig,
    getCustomerShippingDetails,
    getCustomerBillingDetails,
    getAppleButtonConfig
} from '.'

// Mock the Adyen services and utilities
jest.mock('@adyen/adyen-web', () => ({
    __esModule: true,
    default: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/components/express/utils/shipping-methods', () => ({
    AdyenShippingMethodsService: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/components/express/utils/shipping-address', () => ({
    AdyenShippingAddressService: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/components/express/utils/payments', () => ({
    AdyenPaymentsService: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/components/express/utils/pdp/temporary-basket', () => ({
    createTemporaryBasket: jest.fn(),
    deleteTemporaryBasket: jest.fn(),
    cleanupTemporaryBasket: jest.fn()
}))

jest.mock(
    '@salesforce/retail-react-app/app/components/express/utils/pdp/basket-calculation',
    () => ({
        getBasketWithTotals: jest.fn(),
        forceOrderCalculation: jest.fn()
    })
)

jest.mock(
    '@salesforce/retail-react-app/app/components/express/utils/express-payment-utils',
    () => ({
        validateExpressPaymentSetup: jest.fn(),
        getExpressPaymentDependencies: jest.fn(),
        sendExpressMessage: jest.fn(),
        getPaymentMethodConfig: jest.fn(),
        isMissingOrderTotalError: jest.fn(),
        createAdyenCheckout: jest.fn()
    })
)

jest.mock('@salesforce/retail-react-app/app/components/express/utils/parsers', () => ({
    getCurrencyValueForApi: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/components/express/utils/constants', () => ({
    PAYMENT_METHODS: {
        APPLE_PAY: 'applepay'
    },
    EXPRESS_MESSAGES: {
        PAYMENT_SUCCESS: 'express.payment.success',
        PAYMENT_FAILURE: 'express.payment.failure',
        PAYMENT_CANCEL: 'express.payment.cancel'
    }
}))

// Import mocked modules
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-methods'
import {AdyenShippingAddressService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-address'
import {AdyenPaymentsService} from '@salesforce/retail-react-app/app/components/express/utils/payments'
import {
    createTemporaryBasket,
    deleteTemporaryBasket,
    cleanupTemporaryBasket
} from '@salesforce/retail-react-app/app/components/express/utils/pdp/temporary-basket'
import {
    getBasketWithTotals,
    forceOrderCalculation
} from '@salesforce/retail-react-app/app/components/express/utils/pdp/basket-calculation'
import {sendExpressMessage} from '@salesforce/retail-react-app/app/components/express/utils/express-payment-utils'
import {getCurrencyValueForApi} from '@salesforce/retail-react-app/app/components/express/utils/parsers'

describe('ApplePayExpress Utilities', () => {
    const mockAuthToken = 'test-auth-token'
    const mockSite = {id: 'test-site', name: 'Test Site'}
    const mockBasket = {
        basketId: 'test-basket-id',
        orderTotal: 100.0,
        currency: 'USD',
        customerInfo: {customerId: 'test-customer-id'}
    }
    const mockAdyenPaymentMethods = {
        environment: {
            ADYEN_ENVIRONMENT: 'test',
            ADYEN_CLIENT_KEY: 'test-key'
        },
        applicationInfo: {name: 'Test App'}
    }
    const mockShippingMethods = [
        {id: 'method-1', name: 'Standard Shipping', price: 5.99, description: 'Standard shipping'},
        {id: 'method-2', name: 'Express Shipping', price: 12.99, description: 'Express shipping'}
    ]

    let mockShippingMethodsService
    let mockShippingAddressService
    let mockPaymentsService

    beforeEach(() => {
        jest.clearAllMocks()

        // Mock services
        mockShippingMethodsService = {
            getShippingMethods: jest.fn(),
            updateShippingMethod: jest.fn()
        }
        mockShippingAddressService = {
            updateShippingAddress: jest.fn()
        }
        mockPaymentsService = {
            submitPayment: jest.fn()
        }

        AdyenShippingMethodsService.mockImplementation(() => mockShippingMethodsService)
        AdyenShippingAddressService.mockImplementation(() => mockShippingAddressService)
        AdyenPaymentsService.mockImplementation(() => mockPaymentsService)

        // Mock utility functions
        getCurrencyValueForApi.mockReturnValue(10000)
        getBasketWithTotals.mockResolvedValue(mockBasket)
        forceOrderCalculation.mockResolvedValue(mockBasket)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('getCustomerShippingDetails', () => {
        it('should format shipping contact correctly', () => {
            const shippingContact = {
                locality: 'Test City',
                countryCode: 'US',
                addressLines: ['123 Test St', 'Apt 123'],
                postalCode: '12345',
                administrativeArea: 'CA',
                givenName: 'John',
                familyName: 'Doe',
                emailAddress: 'john.doe@example.com',
                phoneNumber: '+1234567890'
            }

            const result = getCustomerShippingDetails(shippingContact)

            expect(result).toEqual({
                deliveryAddress: {
                    city: 'Test City',
                    country: 'US',
                    houseNumberOrName: 'Apt 123',
                    postalCode: '12345',
                    stateOrProvince: 'CA',
                    street: '123 Test St'
                },
                profile: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    phone: '+1234567890'
                }
            })
        })

        it('should handle missing address lines gracefully', () => {
            const shippingContact = {
                locality: 'Test City',
                countryCode: 'US',
                addressLines: ['123 Test St'],
                postalCode: '12345',
                administrativeArea: 'CA',
                givenName: 'John',
                familyName: 'Doe',
                emailAddress: 'john.doe@example.com',
                phoneNumber: '+1234567890'
            }

            const result = getCustomerShippingDetails(shippingContact)

            expect(result.deliveryAddress.houseNumberOrName).toBe('')
        })

        it('should handle missing optional fields gracefully', () => {
            const shippingContact = {
                locality: 'Test City',
                countryCode: 'US',
                addressLines: ['123 Test St'],
                postalCode: '12345',
                administrativeArea: 'CA'
            }

            const result = getCustomerShippingDetails(shippingContact)

            expect(result.profile.firstName).toBeUndefined()
            expect(result.profile.lastName).toBeUndefined()
            expect(result.profile.email).toBeUndefined()
            expect(result.profile.phone).toBeUndefined()
        })
    })

    describe('getCustomerBillingDetails', () => {
        it('should format billing contact correctly', () => {
            const billingContact = {
                locality: 'Test City',
                countryCode: 'US',
                addressLines: ['123 Test St', 'Apt 123'],
                postalCode: '12345',
                administrativeArea: 'CA'
            }

            const result = getCustomerBillingDetails(billingContact)

            expect(result).toEqual({
                billingAddress: {
                    city: 'Test City',
                    country: 'US',
                    houseNumberOrName: 'Apt 123',
                    postalCode: '12345',
                    stateOrProvince: 'CA',
                    street: '123 Test St'
                }
            })
        })

        it('should handle missing address lines gracefully', () => {
            const billingContact = {
                locality: 'Test City',
                countryCode: 'US',
                addressLines: ['123 Test St'],
                postalCode: '12345',
                administrativeArea: 'CA'
            }

            const result = getCustomerBillingDetails(billingContact)

            expect(result.billingAddress.houseNumberOrName).toBe('')
        })
    })

    describe('getAppleButtonConfig', () => {
        it('should return button configuration with correct structure', () => {
            const applePayConfig = {type: 'applepay', merchantName: 'Test Store'}
            const fetchShippingMethods = jest.fn()

            const result = getAppleButtonConfig(
                mockAuthToken,
                mockSite,
                mockBasket,
                mockShippingMethods,
                applePayConfig,
                fetchShippingMethods,
                'test-sku',
                jest.fn(),
                null,
                true,
                1
            )

            expect(result).toHaveProperty('showPayButton', true)
            expect(result).toHaveProperty('isExpress', true)
            expect(result).toHaveProperty('configuration', applePayConfig)
            expect(result).toHaveProperty('amount')
            expect(result).toHaveProperty('onClick')
            expect(result).toHaveProperty('onAuthorized')
            expect(result).toHaveProperty('requiredShippingContactFields')
            expect(result).toHaveProperty('requiredBillingContactFields')
            expect(result).toHaveProperty('shippingMethods')
        })

        it('should handle PDP mode with temporary basket creation', async () => {
            const setTempBasket = jest.fn()
            const tempBasket = null
            const applePayConfig = {type: 'applepay', merchantName: 'Test Store'}
            const fetchShippingMethods = jest.fn()

            createTemporaryBasket.mockResolvedValue({
                basketId: 'temp-basket-id',
                orderTotal: 50.0,
                currency: 'USD'
            })

            const result = getAppleButtonConfig(
                mockAuthToken,
                mockSite,
                mockBasket,
                mockShippingMethods,
                applePayConfig,
                fetchShippingMethods,
                'test-sku',
                setTempBasket,
                tempBasket,
                true,
                1
            )

            // Test the onClick function for PDP mode
            const resolve = jest.fn()
            const reject = jest.fn()
            await result.onClick(resolve, reject)

            expect(createTemporaryBasket).toHaveBeenCalledWith(
                'test-sku',
                mockAuthToken,
                mockSite,
                1
            )
            expect(resolve).toHaveBeenCalled()
        })

        it('should handle payment authorization successfully', async () => {
            const applePayConfig = {type: 'applepay', merchantName: 'Test Store'}
            const fetchShippingMethods = jest.fn()

            mockPaymentsService.submitPayment.mockResolvedValue({
                isFinal: true,
                isSuccessful: true,
                merchantReference: 'order-123'
            })

            const result = getAppleButtonConfig(
                mockAuthToken,
                mockSite,
                mockBasket,
                mockShippingMethods,
                applePayConfig,
                fetchShippingMethods,
                'test-sku',
                jest.fn(),
                null,
                true,
                1
            )

            const resolve = jest.fn()
            const reject = jest.fn()
            const event = {
                payment: {
                    shippingContact: {
                        locality: 'Test City',
                        countryCode: 'US',
                        addressLines: ['123 Test St'],
                        postalCode: '12345',
                        administrativeArea: 'CA',
                        givenName: 'John',
                        familyName: 'Doe',
                        emailAddress: 'john.doe@example.com',
                        phoneNumber: '+1234567890'
                    },
                    billingContact: {
                        locality: 'Test City',
                        countryCode: 'US',
                        addressLines: ['123 Test St'],
                        postalCode: '12345',
                        administrativeArea: 'CA'
                    },
                    token: {
                        paymentData: 'test-token'
                    }
                }
            }

            await result.onAuthorized(resolve, reject, event)

            expect(mockPaymentsService.submitPayment).toHaveBeenCalled()
            expect(sendExpressMessage).toHaveBeenCalledWith('express.payment.success', {
                orderId: 'order-123',
                PAYMENT_METHOD: 'applepay'
            })
            expect(resolve).toHaveBeenCalled()
        })

        it('should handle payment authorization failure', async () => {
            const applePayConfig = {type: 'applepay', merchantName: 'Test Store'}
            const fetchShippingMethods = jest.fn()

            mockPaymentsService.submitPayment.mockResolvedValue({
                isFinal: true,
                isSuccessful: false
            })

            const result = getAppleButtonConfig(
                mockAuthToken,
                mockSite,
                mockBasket,
                mockShippingMethods,
                applePayConfig,
                fetchShippingMethods,
                'test-sku',
                jest.fn(),
                null,
                true,
                1
            )

            const resolve = jest.fn()
            const reject = jest.fn()
            const event = {
                payment: {
                    shippingContact: {
                        locality: 'Test City',
                        countryCode: 'US',
                        addressLines: ['123 Test St'],
                        postalCode: '12345',
                        administrativeArea: 'CA',
                        givenName: 'John',
                        familyName: 'Doe',
                        emailAddress: 'john.doe@example.com',
                        phoneNumber: '+1234567890'
                    },
                    billingContact: {
                        locality: 'Test City',
                        countryCode: 'US',
                        addressLines: ['123 Test St'],
                        postalCode: '12345',
                        administrativeArea: 'CA'
                    },
                    token: {
                        paymentData: 'test-token'
                    }
                }
            }

            await result.onAuthorized(resolve, reject, event)

            expect(cleanupTemporaryBasket).toHaveBeenCalled()
            expect(sendExpressMessage).toHaveBeenCalledWith('express.payment.failure', {
                PAYMENT_METHOD: 'applepay'
            })
            expect(reject).toHaveBeenCalled()
        })

        it('should handle payment authorization errors gracefully', async () => {
            const applePayConfig = {type: 'applepay', merchantName: 'Test Store'}
            const fetchShippingMethods = jest.fn()

            mockPaymentsService.submitPayment.mockRejectedValue(new Error('Payment failed'))

            const result = getAppleButtonConfig(
                mockAuthToken,
                mockSite,
                mockBasket,
                mockShippingMethods,
                applePayConfig,
                fetchShippingMethods,
                'test-sku',
                jest.fn(),
                null,
                true,
                1
            )

            const resolve = jest.fn()
            const reject = jest.fn()
            const event = {
                payment: {
                    shippingContact: {
                        locality: 'Test City',
                        countryCode: 'US',
                        addressLines: ['123 Test St'],
                        postalCode: '12345',
                        administrativeArea: 'CA',
                        givenName: 'John',
                        familyName: 'Doe',
                        emailAddress: 'john.doe@example.com',
                        phoneNumber: '+1234567890'
                    },
                    billingContact: {
                        locality: 'Test City',
                        countryCode: 'US',
                        addressLines: ['123 Test St'],
                        postalCode: '12345',
                        administrativeArea: 'CA'
                    },
                    token: {
                        paymentData: 'test-token'
                    }
                }
            }

            await result.onAuthorized(resolve, reject, event)

            expect(cleanupTemporaryBasket).toHaveBeenCalled()
            expect(sendExpressMessage).toHaveBeenCalledWith('express.payment.failure', {
                PAYMENT_METHOD: 'applepay'
            })
            expect(reject).toHaveBeenCalled()
        })

        it('should format shipping methods correctly', () => {
            const applePayConfig = {type: 'applepay', merchantName: 'Test Store'}
            const fetchShippingMethods = jest.fn()

            const result = getAppleButtonConfig(
                mockAuthToken,
                mockSite,
                mockBasket,
                mockShippingMethods,
                applePayConfig,
                fetchShippingMethods,
                'test-sku',
                jest.fn(),
                null,
                true,
                1
            )

            expect(result.shippingMethods).toHaveLength(2)
            expect(result.shippingMethods[0]).toEqual({
                label: 'Standard Shipping',
                detail: 'Standard shipping',
                identifier: 'method-1',
                amount: '5.99'
            })
            expect(result.shippingMethods[1]).toEqual({
                label: 'Express Shipping',
                detail: 'Express shipping',
                identifier: 'method-2',
                amount: '12.99'
            })
        })

        it('should handle regular checkout flow in onClick', async () => {
            const applePayConfig = {type: 'applepay', merchantName: 'Test Store'}
            const fetchShippingMethods = jest.fn()

            const result = getAppleButtonConfig(
                mockAuthToken,
                mockSite,
                mockBasket,
                mockShippingMethods,
                applePayConfig,
                fetchShippingMethods,
                null,
                null,
                null,
                false,
                1
            )

            const resolve = jest.fn()
            const reject = jest.fn()
            await result.onClick(resolve, reject)

            expect(resolve).toHaveBeenCalled()
            expect(reject).not.toHaveBeenCalled()
        })
    })
})
