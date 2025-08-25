/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getGooglePaymentMethodConfig,
    getCustomerShippingDetails,
    getCustomerBillingDetails,
    updateShippingAddress,
    updateShippingOption,
    getGoogleButtonConfig
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
    '@salesforce/retail-react-app/app/components/express/utils/express-payment-utils',
    () => ({
        validateExpressPaymentSetup: jest.fn(),
        getExpressPaymentDependencies: jest.fn(),
        sendExpressMessage: jest.fn(),
        getPaymentMethodConfig: jest.fn(),
        isMissingOrderTotalError: jest.fn(),
        isMissingShippingMethodsError: jest.fn(),
        createAdyenCheckout: jest.fn()
    })
)

jest.mock('@salesforce/retail-react-app/app/components/express/utils/parsers', () => ({
    getCurrencyValueForApi: jest.fn(),
    getGPShippingOptionParameters: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/components/express/utils/constants', () => ({
    PAYMENT_METHODS: {
        GOOGLE_PAY: 'googlepay'
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
import {sendExpressMessage} from '@salesforce/retail-react-app/app/components/express/utils/express-payment-utils'
import {
    getCurrencyValueForApi,
    getGPShippingOptionParameters
} from '@salesforce/retail-react-app/app/components/express/utils/parsers'

describe('GooglePayExpress Utilities', () => {
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
        getGPShippingOptionParameters.mockReturnValue([])
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('getCustomerShippingDetails', () => {
        it('should format shipping address correctly', () => {
            const shippingAddress = {
                locality: 'Test City',
                countryCode: 'US',
                address2: 'Apt 123',
                postalCode: '12345',
                administrativeArea: 'CA',
                address1: '123 Test St',
                name: 'John Doe'
            }

            const result = getCustomerShippingDetails(shippingAddress)

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
                    lastName: 'Doe'
                }
            })
        })

        it('should handle missing name gracefully', () => {
            const shippingAddress = {
                locality: 'Test City',
                countryCode: 'US',
                address2: 'Apt 123',
                postalCode: '12345',
                administrativeArea: 'CA',
                address1: '123 Test St'
            }

            const result = getCustomerShippingDetails(shippingAddress)

            expect(result.profile.firstName).toBe('')
            expect(result.profile.lastName).toBe('')
        })
    })

    describe('getCustomerBillingDetails', () => {
        it('should format billing address correctly', () => {
            const billingAddress = {
                locality: 'Test City',
                countryCode: 'US',
                address2: 'Apt 123',
                postalCode: '12345',
                administrativeArea: 'CA',
                address1: '123 Test St'
            }

            const result = getCustomerBillingDetails(billingAddress)

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
    })

    describe('updateShippingAddress', () => {
        it('should update shipping address successfully', async () => {
            const mockShippingAddress = {
                locality: 'Test City',
                countryCode: 'US',
                address2: 'Apt 123',
                postalCode: '12345',
                administrativeArea: 'CA',
                address1: '123 Test St',
                name: 'John Doe'
            }

            mockShippingAddressService.updateShippingAddress.mockResolvedValue({})
            mockShippingMethodsService.getShippingMethods.mockResolvedValue({
                defaultShippingMethodId: 'method-1',
                applicableShippingMethods: [{id: 'method-1'}]
            })
            mockShippingMethodsService.updateShippingMethod.mockResolvedValue({
                currency: 'USD',
                orderTotal: 100.0
            })

            const result = await updateShippingAddress(
                mockAuthToken,
                mockSite,
                mockBasket,
                mockShippingAddress
            )

            expect(mockShippingAddressService.updateShippingAddress).toHaveBeenCalledWith(
                mockBasket.basketId,
                getCustomerShippingDetails(mockShippingAddress)
            )
            expect(result).toHaveProperty('paymentDataRequestUpdate')
            expect(result).toHaveProperty('newBasket')
        })

        it('should handle shipping address update error', async () => {
            const mockShippingAddress = {
                locality: 'Test City',
                countryCode: 'US',
                address2: 'Apt 123',
                postalCode: '12345',
                administrativeArea: 'CA',
                address1: '123 Test St',
                name: 'John Doe'
            }

            mockShippingAddressService.updateShippingAddress.mockResolvedValue({
                error: 'Address not available'
            })

            const result = await updateShippingAddress(
                mockAuthToken,
                mockSite,
                mockBasket,
                mockShippingAddress
            )

            expect(result.error.reason).toBe('SHIPPING_ADDRESS_UNAVAILABLE')
            expect(result.error.intent).toBe('SHIPPING_ADDRESS')
        })

        it('should handle exceptions gracefully', async () => {
            const mockShippingAddress = {
                locality: 'Test City',
                countryCode: 'US',
                address2: 'Apt 123',
                postalCode: '12345',
                administrativeArea: 'CA',
                address1: '123 Test St',
                name: 'John Doe'
            }

            mockShippingAddressService.updateShippingAddress.mockRejectedValue(
                new Error('Network error')
            )

            const result = await updateShippingAddress(
                mockAuthToken,
                mockSite,
                mockBasket,
                mockShippingAddress
            )

            expect(result.error.reason).toBe('SHIPPING_ADDRESS_UNAVAILABLE')
            expect(result.error.intent).toBe('SHIPPING_ADDRESS')
        })
    })

    describe('updateShippingOption', () => {
        it('should update shipping option successfully', async () => {
            mockShippingMethodsService.updateShippingMethod.mockResolvedValue({
                currency: 'USD',
                orderTotal: 100.0
            })

            const result = await updateShippingOption(
                mockAuthToken,
                mockSite,
                mockBasket,
                'method-1'
            )

            expect(mockShippingMethodsService.updateShippingMethod).toHaveBeenCalledWith(
                'method-1',
                mockBasket.basketId
            )
            expect(result).toHaveProperty('paymentDataRequestUpdate')
            expect(result).toHaveProperty('newBasket')
        })

        it('should handle shipping option update error', async () => {
            mockShippingMethodsService.updateShippingMethod.mockResolvedValue({
                error: 'Method not available'
            })

            const result = await updateShippingOption(
                mockAuthToken,
                mockSite,
                mockBasket,
                'method-1'
            )

            expect(result.error.reason).toBe('SHIPPING_OPTION_UNAVAILABLE')
            expect(result.error.intent).toBe('SHIPPING_OPTION')
        })

        it('should handle exceptions gracefully', async () => {
            mockShippingMethodsService.updateShippingMethod.mockRejectedValue(
                new Error('Network error')
            )

            const result = await updateShippingOption(
                mockAuthToken,
                mockSite,
                mockBasket,
                'method-1'
            )

            expect(result.error.reason).toBe('SHIPPING_OPTION_UNAVAILABLE')
            expect(result.error.intent).toBe('SHIPPING_OPTION')
        })
    })

    describe('getGoogleButtonConfig', () => {
        it('should return button configuration with correct structure', () => {
            const googlePayConfig = {type: 'googlepay'}
            const result = getGoogleButtonConfig(
                mockAuthToken,
                mockSite,
                mockBasket,
                googlePayConfig,
                'test-sku',
                jest.fn(),
                null,
                true,
                1
            )

            expect(result).toHaveProperty('showPayButton', true)
            expect(result).toHaveProperty('buttonType', 'plain')
            expect(result).toHaveProperty('isExpress', true)
            expect(result).toHaveProperty('shippingAddressRequired', true)
            expect(result).toHaveProperty('shippingOptionRequired', true)
            expect(result).toHaveProperty('billingAddressRequired', true)
            expect(result).toHaveProperty('emailRequired', true)
            expect(result).toHaveProperty('configuration', googlePayConfig)
            expect(result).toHaveProperty('amount')
            expect(result).toHaveProperty('onAuthorized')
            expect(result).toHaveProperty('onSubmit')
            expect(result).toHaveProperty('callbackIntents')
            expect(result).toHaveProperty('paymentDataCallbacks')
            expect(result).toHaveProperty('onError')
        })

        it('should handle PDP mode with temporary basket creation', async () => {
            const setTempBasket = jest.fn()
            const tempBasket = null
            const googlePayConfig = {type: 'googlepay'}

            createTemporaryBasket.mockResolvedValue({
                basketId: 'temp-basket-id',
                orderTotal: 50.0,
                currency: 'USD'
            })

            const result = getGoogleButtonConfig(
                mockAuthToken,
                mockSite,
                mockBasket,
                googlePayConfig,
                'test-sku',
                setTempBasket,
                tempBasket,
                true,
                1
            )

            // Test the getOrCreateBasket function within the config
            const basketToUse = await result.paymentDataCallbacks.onPaymentDataChanged({
                callbackTrigger: 'INITIALIZE',
                shippingAddress: {},
                shippingOptionData: {}
            })

            expect(createTemporaryBasket).toHaveBeenCalledWith(
                'test-sku',
                mockAuthToken,
                mockSite,
                1
            )
        })
    })
})
