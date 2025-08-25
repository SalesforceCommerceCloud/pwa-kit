/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    createAdyenCheckout,
    validateExpressPaymentSetup,
    isMissingOrderTotalError,
    isMissingShippingMethodsError,
    getExpressPaymentDependencies,
    sendExpressMessage,
    getPaymentMethodConfig
} from '@salesforce/retail-react-app/app/components/express/utils/express-payment-utils'

// Mock AdyenCheckout
jest.mock('@adyen/adyen-web', () => ({
    __esModule: true,
    default: jest.fn()
}))

// Mock window.parent.postMessage
const mockPostMessage = jest.fn()

// Setup global window mock
Object.defineProperty(global, 'window', {
    value: {
        parent: {
            postMessage: mockPostMessage
        }
    },
    writable: true
})

describe('express-payment-utils', () => {
    let mockAdyenCheckout

    beforeEach(() => {
        jest.clearAllMocks()
        mockPostMessage.mockClear()
        
        // Get the mocked AdyenCheckout function
        mockAdyenCheckout = require('@adyen/adyen-web').default
    })

    describe('createAdyenCheckout', () => {
        const mockAdyenEnvironment = {
            ADYEN_ENVIRONMENT: 'test',
            ADYEN_CLIENT_KEY: 'test-key'
        }
        const mockLocale = {id: 'en-US'}
        const mockApplicationInfo = {version: '1.0.0'}

        beforeEach(() => {
            // Reset the mock for each test
            mockAdyenCheckout.mockClear()
        })

        it('should create Adyen checkout instance with correct configuration', async () => {
            mockAdyenCheckout.mockResolvedValue({id: 'checkout-123'})

            const result = await createAdyenCheckout(
                mockAdyenEnvironment,
                mockLocale,
                mockApplicationInfo
            )

            expect(mockAdyenCheckout).toHaveBeenCalledWith({
                environment: 'test',
                clientKey: 'test-key',
                locale: 'en-US',
                analytics: {
                    analyticsData: {
                        applicationInfo: mockApplicationInfo
                    }
                }
            })
            expect(result).toEqual({id: 'checkout-123'})
        })

        it('should handle missing environment properties gracefully', async () => {
            const incompleteEnvironment = {ADYEN_ENVIRONMENT: 'test'}
            mockAdyenCheckout.mockResolvedValue({id: 'checkout-123'})

            const result = await createAdyenCheckout(
                incompleteEnvironment,
                mockLocale,
                mockApplicationInfo
            )

            expect(mockAdyenCheckout).toHaveBeenCalledWith({
                environment: 'test',
                clientKey: undefined,
                locale: 'en-US',
                analytics: {
                    analyticsData: {
                        applicationInfo: mockApplicationInfo
                    }
                }
            })
            expect(result).toEqual({id: 'checkout-123'})
        })

        it('should throw error when AdyenCheckout fails', async () => {
            const error = new Error('Adyen initialization failed')
            mockAdyenCheckout.mockRejectedValue(error)

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

            await expect(
                createAdyenCheckout(mockAdyenEnvironment, mockLocale, mockApplicationInfo)
            ).rejects.toThrow('Adyen initialization failed')

            expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize AdyenCheckout:', error)
            consoleSpy.mockRestore()
        })
    })

    describe('validateExpressPaymentSetup', () => {
        const mockAdyenPaymentMethods = {
            environment: 'test',
            clientKey: 'test-key'
        }

        it('should return false when adyenPaymentMethods environment is missing', () => {
            const result = validateExpressPaymentSetup({
                isPdpMode: false,
                adyenPaymentMethods: {clientKey: 'test-key'},
                hasRequiredBasketData: true,
                sku: 'test-sku',
                basket: {basketId: 'basket-123'},
                authToken: 'token'
            })

            expect(result).toBe(false)
        })

        it('should return false when adyenPaymentMethods is undefined', () => {
            const result = validateExpressPaymentSetup({
                isPdpMode: false,
                adyenPaymentMethods: undefined,
                hasRequiredBasketData: true,
                sku: 'test-sku',
                basket: {basketId: 'basket-123'},
                authToken: 'token'
            })

            expect(result).toBe(false)
        })

        it('should return true for PDP mode with valid SKU', () => {
            const result = validateExpressPaymentSetup({
                isPdpMode: true,
                adyenPaymentMethods: mockAdyenPaymentMethods,
                hasRequiredBasketData: false,
                sku: 'test-sku',
                basket: {},
                authToken: 'token'
            })

            expect(result).toBe(true)
        })

        it('should return false for PDP mode without SKU', () => {
            const result = validateExpressPaymentSetup({
                isPdpMode: true,
                adyenPaymentMethods: mockAdyenPaymentMethods,
                hasRequiredBasketData: false,
                sku: '',
                basket: {},
                authToken: 'token'
            })

            expect(result).toBe(false)
        })

        it('should return truthy value for cart mode with all required basket data', () => {
            const result = validateExpressPaymentSetup({
                isPdpMode: false,
                adyenPaymentMethods: mockAdyenPaymentMethods,
                hasRequiredBasketData: true,
                sku: 'test-sku',
                basket: {
                    basketId: 'basket-123',
                    orderTotal: 100,
                    currency: 'USD'
                },
                authToken: 'token'
            })

            expect(result).toBeTruthy()
            expect(result).toBe('USD') // The function returns the last truthy value in the chain
        })

        it('should return false for cart mode without required basket data', () => {
            const result = validateExpressPaymentSetup({
                isPdpMode: false,
                adyenPaymentMethods: mockAdyenPaymentMethods,
                hasRequiredBasketData: false,
                sku: 'test-sku',
                basket: {
                    basketId: 'basket-123',
                    orderTotal: 100,
                    currency: 'USD'
                },
                authToken: 'token'
            })

            expect(result).toBe(false)
        })

        it('should return false for cart mode with missing basket properties', () => {
            const result = validateExpressPaymentSetup({
                isPdpMode: false,
                adyenPaymentMethods: mockAdyenPaymentMethods,
                hasRequiredBasketData: true,
                sku: 'test-sku',
                basket: {
                    basketId: 'basket-123'
                    // Missing orderTotal and currency
                },
                authToken: 'token'
            })

            expect(result).toBeFalsy()
            expect(result).toBeUndefined() // The function returns undefined when orderTotal is missing
        })
    })

    describe('isMissingOrderTotalError', () => {
        it('should return true for Safari TypeError with orderTotal', () => {
            const error = new TypeError("undefined is not an object (evaluating 'b.orderTotal')")
            const result = isMissingOrderTotalError(error)
            expect(result).toBe(true)
        })

        it('should return true for Chrome TypeError with orderTotal', () => {
            const error = new TypeError(
                "Cannot read properties of undefined (reading 'orderTotal')"
            )
            const result = isMissingOrderTotalError(error)
            expect(result).toBe(true)
        })

        it('should return false for non-TypeError', () => {
            const error = new Error('Some other error')
            const result = isMissingOrderTotalError(error)
            expect(result).toBe(false)
        })

        it('should return false for TypeError without orderTotal', () => {
            const error = new TypeError(
                "Cannot read properties of undefined (reading 'otherProperty')"
            )
            const result = isMissingOrderTotalError(error)
            expect(result).toBe(false)
        })
    })

    describe('isMissingShippingMethodsError', () => {
        it('should return true for Safari TypeError with defaultShippingMethodId', () => {
            const error = new TypeError(
                "undefined is not an object (evaluating 'b.defaultShippingMethodId')"
            )
            const result = isMissingShippingMethodsError(error)
            expect(result).toBe(true)
        })

        it('should return true for Chrome TypeError with defaultShippingMethodId', () => {
            const error = new TypeError(
                "Cannot read properties of undefined (reading 'defaultShippingMethodId')"
            )
            const result = isMissingShippingMethodsError(error)
            expect(result).toBe(true)
        })

        it('should return false for non-TypeError', () => {
            const error = new Error('Some other error')
            const result = isMissingShippingMethodsError(error)
            expect(result).toBe(false)
        })

        it('should return false for TypeError without defaultShippingMethodId', () => {
            const error = new TypeError(
                "Cannot read properties of undefined (reading 'otherProperty')"
            )
            const result = isMissingShippingMethodsError(error)
            expect(result).toBe(false)
        })
    })

    describe('getExpressPaymentDependencies', () => {
        it('should return array with all dependencies', () => {
            const dependencies = {
                adyenPaymentMethods: {environment: 'test'},
                basket: {basketId: 'basket-123'},
                sku: 'test-sku',
                quantity: 1,
                isPdpMode: false,
                tempBasket: {tempId: 'temp-123'},
                currentSku: 'current-sku'
            }

            const result = getExpressPaymentDependencies(dependencies)

            expect(result).toEqual([
                dependencies.adyenPaymentMethods,
                dependencies.basket,
                dependencies.sku,
                dependencies.quantity,
                dependencies.isPdpMode,
                dependencies.tempBasket,
                dependencies.currentSku
            ])
        })

        it('should handle undefined dependencies gracefully', () => {
            const dependencies = {
                adyenPaymentMethods: undefined,
                basket: undefined,
                sku: undefined,
                quantity: undefined,
                isPdpMode: undefined,
                tempBasket: undefined,
                currentSku: undefined
            }

            const result = getExpressPaymentDependencies(dependencies)

            expect(result).toEqual([
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            ])
        })
    })

    describe('sendExpressMessage', () => {
        it('should send message to parent window with type and payload', () => {
            const messageType = 'PAYMENT_COMPLETED'
            const payload = {orderId: 'order-123', amount: 100}

            sendExpressMessage(messageType, payload)

            expect(mockPostMessage).toHaveBeenCalledWith(
                {
                    type: messageType,
                    payload
                },
                '*'
            )
        })

        it('should send message with empty payload when no payload provided', () => {
            const messageType = 'PAYMENT_INITIATED'

            sendExpressMessage(messageType)

            expect(mockPostMessage).toHaveBeenCalledWith(
                {
                    type: messageType,
                    payload: {}
                },
                '*'
            )
        })

        it('should use wildcard origin for postMessage', () => {
            sendExpressMessage('TEST_MESSAGE')

            expect(mockPostMessage).toHaveBeenCalledWith(
                {
                    type: 'TEST_MESSAGE',
                    payload: {}
                },
                '*'
            )
        })
    })

    describe('getPaymentMethodConfig', () => {
        const mockPaymentMethodsResponse = {
            paymentMethods: [
                {
                    type: 'applepay',
                    configuration: {merchantId: 'merchant-123'}
                },
                {
                    type: 'googlepay',
                    configuration: {merchantId: 'merchant-456'}
                }
            ]
        }

        it('should return configuration for existing payment method type', () => {
            const result = getPaymentMethodConfig(mockPaymentMethodsResponse, 'applepay')

            expect(result).toEqual({merchantId: 'merchant-123'})
        })

        it('should return null for non-existing payment method type', () => {
            const result = getPaymentMethodConfig(mockPaymentMethodsResponse, 'paypal')

            expect(result).toBeNull()
        })

        it('should handle undefined paymentMethodsResponse', () => {
            const result = getPaymentMethodConfig(undefined, 'applepay')

            expect(result).toBeNull()
        })

        it('should handle undefined paymentMethods array', () => {
            const result = getPaymentMethodConfig({}, 'applepay')

            expect(result).toBeNull()
        })

        it('should handle payment method without configuration', () => {
            const responseWithoutConfig = {
                paymentMethods: [
                    {
                        type: 'applepay'
                        // No configuration property
                    }
                ]
            }

            const result = getPaymentMethodConfig(responseWithoutConfig, 'applepay')

            expect(result).toBeNull()
        })
    })
})
