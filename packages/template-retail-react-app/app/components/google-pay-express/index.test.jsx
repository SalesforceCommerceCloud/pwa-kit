/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, waitFor} from '@testing-library/react'
import {GooglePayExpress} from '@salesforce/retail-react-app/app/components/google-pay-express/index'
import AdyenCheckout from '@adyen/adyen-web'
import {useAdyenExpressCheckout} from '@adyen/adyen-salesforce-pwa'
import {
    getGooglePaymentMethodConfig,
    getCustomerShippingDetails,
    getCustomerBillingDetails,
    getGoogleButtonConfig,
    updateShippingAddress,
    updateShippingOption
} from '@salesforce/retail-react-app/app/components/google-pay-express/index'
import {AdyenPaymentsService} from '@salesforce/retail-react-app/app/components/express/utils/payments'
import {AdyenShippingAddressService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-address'
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-methods'

// Mock all dependencies
jest.mock('@adyen/adyen-web', () => ({
    __esModule: true,
    default: jest.fn()
}))

jest.mock('@adyen/adyen-salesforce-pwa', () => ({
    useAdyenExpressCheckout: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/components/express/utils/payments', () => ({
    AdyenPaymentsService: jest.fn().mockImplementation(() => ({
        submitPayment: jest.fn()
    }))
}))

jest.mock('@salesforce/retail-react-app/app/components/express/utils/shipping-address', () => ({
    AdyenShippingAddressService: jest.fn().mockImplementation(() => ({
        updateShippingAddress: jest.fn()
    }))
}))

jest.mock('@salesforce/retail-react-app/app/components/express/utils/shipping-methods', () => ({
    AdyenShippingMethodsService: jest.fn().mockImplementation(() => ({
        updateShippingMethod: jest.fn(),
        getShippingMethods: jest.fn()
    }))
}))

jest.mock('@salesforce/retail-react-app/app/components/express/utils/parsers', () => ({
    getCurrencyValueForApi: jest.fn((amount) => amount * 100),
    getGPShippingOptionParameters: jest.fn(() => ({
        defaultSelectedOptionId: 'method-1',
        shippingOptions: [
            {id: 'method-1', label: 'Standard Shipping', description: '5-7 days'}
        ]
    }))
}))

// Mock window.parent.postMessage
const mockPostMessage = jest.fn()
Object.defineProperty(window, 'parent', {
    value: {
        postMessage: mockPostMessage
    },
    writable: true
})

// Suppress MSW warnings
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

// Shared test data
const mockData = {
    props: {
        shippingMethods: []
    },
    environment: {
        ADYEN_ENVIRONMENT: 'test',
        ADYEN_CLIENT_KEY: 'test_key'
    },
    paymentMethods: {
        paymentMethods: [
            {
                type: 'googlepay',
                configuration: {
                    gateway: 'adyen',
                    gatewayMerchantId: 'test'
                }
            }
        ],
        applicationInfo: {}
    },
    basket: {
        basketId: 'test-basket',
        orderTotal: 100,
        productTotal: 95,
        currency: 'USD',
        customerInfo: {
            customerId: 'test-customer'
        }
    },
    shippingMethods: {
        defaultShippingMethodId: 'method-1',
        applicableShippingMethods: [
            {
                id: 'method-1',
                name: 'Standard',
                description: 'desc',
                price: 10
            }
        ]
    },
    googlePayConfig: {
        gateway: 'adyen',
        gatewayMerchantId: 'test'
    },
    authToken: 'token',
    site: 'site'
}

// Test utilities
const setupMockHook = (overrides = {}) => {
    useAdyenExpressCheckout.mockReturnValue({
        adyenEnvironment: mockData.environment,
        adyenPaymentMethods: mockData.paymentMethods,
        basket: mockData.basket,
        locale: {id: 'en-US'},
        site: 'test-site',
        authToken: 'test-token',
        navigate: jest.fn(),
        shippingMethods: {applicableShippingMethods: []},
        fetchShippingMethods: jest.fn(),
        ...overrides
    })
}

const setupMockAdyenCheckout = (overrides = {}) => {
    const defaultMock = {
        create: jest.fn().mockResolvedValue({
            isAvailable: jest.fn().mockResolvedValue(true),
            mount: jest.fn()
        })
    }
    AdyenCheckout.mockResolvedValue({...defaultMock, ...overrides})
}

describe('GooglePayExpress', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockPostMessage.mockClear()
        setupMockHook()
        setupMockAdyenCheckout()
    })

    it('initializes AdyenCheckout with correct configuration', async () => {
        render(<GooglePayExpress {...mockData.props} />)
        await waitFor(() => {
            expect(AdyenCheckout).toHaveBeenCalledWith({
                environment: mockData.environment.ADYEN_ENVIRONMENT,
                clientKey: mockData.environment.ADYEN_CLIENT_KEY,
                locale: 'en-US',
                analytics: {
                    analyticsData: {
                        applicationInfo: mockData.paymentMethods.applicationInfo
                    }
                }
            })
        })
    })

    it('handles Google Pay unavailability', async () => {
        AdyenCheckout.mockRejectedValue(new Error('Google Pay not available'))
        render(<GooglePayExpress {...mockData.props} />)
        await waitFor(() => {
            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'express.payment.unavailable',
                    payload: {PAYMENT_METHOD: 'googlepay'}
                }),
                '*'
            )
        })
    })

    it('mounts Google Pay button when available', async () => {
        render(<GooglePayExpress {...mockData.props} />)
        await waitFor(() => {
            expect(AdyenCheckout).toHaveBeenCalled()
        })
    })
})

describe('Utility functions', () => {
    it('getGooglePaymentMethodConfig returns config for googlepay', () => {
        const result = getGooglePaymentMethodConfig(mockData.paymentMethods)
        expect(result).toEqual({
            gateway: 'adyen',
            gatewayMerchantId: 'test'
        })
    })

    it('getGooglePaymentMethodConfig returns null if not found', () => {
        expect(getGooglePaymentMethodConfig({paymentMethods: [{type: 'card'}]})).toBeNull()
        expect(getGooglePaymentMethodConfig(undefined)).toBeNull()
    })

    it('getCustomerShippingDetails returns correct structure', () => {
        const shippingAddress = {
            locality: 'City',
            countryCode: 'US',
            address2: 'Apt 4',
            postalCode: '12345',
            administrativeArea: 'CA',
            address1: '123 Main St',
            name: 'John Doe'
        }
        expect(getCustomerShippingDetails(shippingAddress)).toEqual({
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
                lastName: 'Doe'
            }
        })
    })

    it('getCustomerBillingDetails returns correct structure', () => {
        const billingAddress = {
            locality: 'City',
            countryCode: 'US',
            address2: 'Apt 4',
            postalCode: '12345',
            administrativeArea: 'CA',
            address1: '123 Main St'
        }
        expect(getCustomerBillingDetails(billingAddress)).toEqual({
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

describe('getGoogleButtonConfig', () => {
    const mockNavigate = jest.fn()
    const mockFetchShippingMethods = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        mockPostMessage.mockClear()
    })

    it('returns correct button config', () => {
        const config = getGoogleButtonConfig(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockData.shippingMethods,
            mockData.googlePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )
        expect(config.showPayButton).toBe(true)
        expect(config.buttonType).toBe('buy')
        expect(config.isExpress).toBe(true)
        expect(config.configuration).toBe(mockData.googlePayConfig)
        expect(config.amount.currency).toBe('USD')
        expect(config.callbackIntents).toEqual(['SHIPPING_ADDRESS', 'SHIPPING_OPTION'])
    })

    it('uses productTotal when orderTotal is null', () => {
        const basketWithoutOrderTotal = {...mockData.basket, orderTotal: null}
        const config = getGoogleButtonConfig(
            mockData.authToken,
            mockData.site,
            basketWithoutOrderTotal,
            mockData.shippingMethods,
            mockData.googlePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )
        expect(config.amount.value).toBe(9500) // 95 * 100
    })

    it('onAuthorized resolves on successful payment', async () => {
        const mockSubmitPayment = jest.fn().mockResolvedValue({
            isFinal: true,
            isSuccessful: true,
            merchantReference: 'order123'
        })
        AdyenPaymentsService.mockImplementation(() => ({
            submitPayment: mockSubmitPayment
        }))

        const config = getGoogleButtonConfig(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockData.shippingMethods,
            mockData.googlePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )

        const mockPaymentData = {
            paymentMethodData: {
                tokenizationData: {token: 'test-token'},
                info: {
                    billingAddress: {
                        locality: 'City',
                        countryCode: 'US',
                        address1: '123 Main St'
                    }
                }
            },
            shippingAddress: {
                locality: 'City',
                countryCode: 'US',
                address1: '123 Main St',
                name: 'John Doe'
            }
        }

        await config.onAuthorized(mockPaymentData)
        expect(mockSubmitPayment).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentType: 'express',
                paymentMethod: {
                    type: 'googlepay',
                    googlePayToken: 'test-token'
                }
            }),
            'test-basket',
            'test-customer'
        )
    })

    it('onAuthorized rejects on failed payment', async () => {
        const mockSubmitPayment = jest.fn().mockResolvedValue({
            isFinal: false,
            isSuccessful: false
        })
        AdyenPaymentsService.mockImplementation(() => ({
            submitPayment: mockSubmitPayment
        }))

        const config = getGoogleButtonConfig(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockData.shippingMethods,
            mockData.googlePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )

        const mockPaymentData = {
            paymentMethodData: {
                tokenizationData: {token: 'test-token'},
                info: {
                    billingAddress: {}
                }
            },
            shippingAddress: {
                locality: 'City',
                countryCode: 'US',
                address1: '123 Main St',
                name: 'John Doe'
            }
        }

        await config.onAuthorized(mockPaymentData)
        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'express.payment.failure',
                payload: {PAYMENT_METHOD: 'googlepay'}
            }),
            '*'
        )
    })

    it('onAuthorized rejects on error', async () => {
        const mockSubmitPayment = jest.fn().mockRejectedValue(new Error('fail'))
        AdyenPaymentsService.mockImplementation(() => ({
            submitPayment: mockSubmitPayment
        }))

        const config = getGoogleButtonConfig(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockData.shippingMethods,
            mockData.googlePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )

        const mockPaymentData = {
            paymentMethodData: {
                tokenizationData: {token: 'test-token'},
                info: {
                    billingAddress: {}
                }
            },
            shippingAddress: {
                locality: 'City',
                countryCode: 'US',
                address1: '123 Main St',
                name: 'John Doe'
            }
        }

        await config.onAuthorized(mockPaymentData)
        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'express.payment.failure',
                payload: {PAYMENT_METHOD: 'googlepay'}
            }),
            '*'
        )
    })

    it('onError sends appropriate messages', () => {
        const config = getGoogleButtonConfig(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockData.shippingMethods,
            mockData.googlePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )

        config.onError({name: 'CANCEL'})
        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({type: 'express.payment.cancel'}),
            '*'
        )

        mockPostMessage.mockClear()
        config.onError({name: 'OTHER'})
        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({type: 'express.payment.failure'}),
            '*'
        )
    })

    it('onPaymentDataChanged handles different callbacks', async () => {
        const mockUpdateShippingAddress = jest.fn().mockResolvedValue({
            newTransactionInfo: {
                countryCode: 'USD',
                currencyCode: 'USD',
                totalPriceStatus: 'FINAL',
                totalPriceLabel: 'Total',
                totalPrice: '110.00'
            }
        })
        const mockGetShippingMethods = jest.fn().mockResolvedValue({
            defaultShippingMethodId: 'method-1',
            applicableShippingMethods: [
                {
                    id: 'method-1',
                    name: 'Standard',
                    price: 10
                }
            ]
        })
        const mockUpdateShippingMethod = jest.fn().mockResolvedValue({
            orderTotal: 110,
            currency: 'USD'
        })

        AdyenShippingAddressService.mockImplementation(() => ({
            updateShippingAddress: mockUpdateShippingAddress
        }))
        AdyenShippingMethodsService.mockImplementation(() => ({
            getShippingMethods: mockGetShippingMethods,
            updateShippingMethod: mockUpdateShippingMethod
        }))

        const config = getGoogleButtonConfig(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockData.shippingMethods,
            mockData.googlePayConfig,
            mockNavigate,
            mockFetchShippingMethods
        )

        // Test INITIALIZE callback
        const initializeResult = await config.paymentDataCallbacks.onPaymentDataChanged({
            callbackTrigger: 'INITIALIZE',
            shippingAddress: {
                locality: 'City',
                countryCode: 'US',
                address1: '123 Main St',
                name: 'John Doe'
            }
        })
        expect(mockUpdateShippingAddress).toHaveBeenCalled()
        expect(initializeResult).toHaveProperty('newTransactionInfo')

        // Test SHIPPING_OPTION callback
        const shippingOptionResult = await config.paymentDataCallbacks.onPaymentDataChanged({
            callbackTrigger: 'SHIPPING_OPTION',
            shippingOptionData: {id: 'method-2'}
        })
        expect(mockUpdateShippingMethod).toHaveBeenCalledWith('method-2', 'test-basket')
        expect(shippingOptionResult).toHaveProperty('newTransactionInfo')
    })
})

describe('updateShippingAddress', () => {
    const mockShippingAddress = {
        locality: 'City',
        countryCode: 'US',
        address1: '123 Main St',
        name: 'John Doe'
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('updates shipping address successfully', async () => {
        const mockAddressService = {
            updateShippingAddress: jest.fn().mockResolvedValue({success: true})
        }
        const mockMethodsService = {
            getShippingMethods: jest.fn().mockResolvedValue({
                defaultShippingMethodId: 'method-1',
                applicableShippingMethods: [
                    {
                        id: 'method-1',
                        name: 'Standard',
                        price: 10
                    }
                ]
            }),
            updateShippingMethod: jest.fn().mockResolvedValue({
                orderTotal: 110,
                currency: 'USD'
            })
        }
        AdyenShippingAddressService.mockImplementation(() => mockAddressService)
        AdyenShippingMethodsService.mockImplementation(() => mockMethodsService)

        const result = await updateShippingAddress(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockShippingAddress
        )
        expect(mockAddressService.updateShippingAddress).toHaveBeenCalled()
        expect(result).toHaveProperty('newTransactionInfo')
    })

    it('handles shipping address update error', async () => {
        const mockAddressService = {
            updateShippingAddress: jest.fn().mockResolvedValue({error: 'Address not serviceable'})
        }
        AdyenShippingAddressService.mockImplementation(() => mockAddressService)

        const result = await updateShippingAddress(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockShippingAddress
        )
        expect(result).toEqual({
            error: {
                reason: 'SHIPPING_ADDRESS_UNAVAILABLE',
                message: 'Cannot ship to the selected address',
                intent: 'SHIPPING_ADDRESS'
            }
        })
    })

    it('handles API exception', async () => {
        const mockAddressService = {
            updateShippingAddress: jest.fn().mockRejectedValue(new Error('Network error'))
        }
        AdyenShippingAddressService.mockImplementation(() => mockAddressService)

        const result = await updateShippingAddress(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockShippingAddress
        )
        expect(result).toEqual({
            error: {
                reason: 'SHIPPING_ADDRESS_UNAVAILABLE',
                message: 'Cannot ship to the selected address',
                intent: 'SHIPPING_ADDRESS'
            }
        })
    })
})

describe('updateShippingOption', () => {
    const mockShippingOptionId = 'method-1'

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('updates shipping option successfully', async () => {
        const mockMethodsService = {
            updateShippingMethod: jest.fn().mockResolvedValue({
                orderTotal: 110,
                currency: 'USD'
            })
        }
        AdyenShippingMethodsService.mockImplementation(() => mockMethodsService)

        const result = await updateShippingOption(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockShippingOptionId
        )
        expect(mockMethodsService.updateShippingMethod).toHaveBeenCalledWith('method-1', 'test-basket')
        expect(result).toHaveProperty('newTransactionInfo')
    })

    it('handles shipping option update error', async () => {
        const mockMethodsService = {
            updateShippingMethod: jest.fn().mockResolvedValue({error: 'Method not available'})
        }
        AdyenShippingMethodsService.mockImplementation(() => mockMethodsService)

        const result = await updateShippingOption(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockShippingOptionId
        )
        expect(result).toEqual({
            error: {
                reason: 'SHIPPING_OPTION_UNAVAILABLE',
                message: 'Cannot ship to the selected address',
                intent: 'SHIPPING_OPTION'
            }
        })
    })

    it('handles API exception', async () => {
        const mockMethodsService = {
            updateShippingMethod: jest.fn().mockRejectedValue(new Error('Network error'))
        }
        AdyenShippingMethodsService.mockImplementation(() => mockMethodsService)

        const result = await updateShippingOption(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockShippingOptionId
        )
        expect(result).toEqual({
            error: {
                reason: 'SHIPPING_OPTION_UNAVAILABLE',
                message: 'Error updating shipping option',
                intent: 'SHIPPING_OPTION'
            }
        })
    })
})

describe('GooglePayExpress error and edge cases', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockPostMessage.mockClear()
        setupMockHook()
    })

    // Parameterized test for different error scenarios
    const errorScenarios = [
        {
            name: 'AdyenCheckout throwing',
            setup: () => AdyenCheckout.mockImplementation(() => {
                throw new Error('fail')
            })
        },
        {
            name: 'create throwing',
            setup: () => setupMockAdyenCheckout({
                create: jest.fn().mockImplementation(() => {
                    throw new Error('fail create')
                })
            })
        },
        {
            name: 'isAvailable throwing',
            setup: () => setupMockAdyenCheckout({
                create: jest.fn().mockResolvedValue({
                    isAvailable: jest.fn().mockImplementation(() => {
                        throw new Error('fail available')
                    }),
                    mount: jest.fn()
                })
            })
        },
        {
            name: 'isAvailable returning false',
            setup: () => setupMockAdyenCheckout({
                create: jest.fn().mockResolvedValue({
                    isAvailable: jest.fn().mockResolvedValue(false),
                    mount: jest.fn()
                })
            })
        },
        {
            name: 'mount throwing',
            setup: () => setupMockAdyenCheckout({
                create: jest.fn().mockResolvedValue({
                    isAvailable: jest.fn().mockResolvedValue(true),
                    mount: jest.fn().mockImplementation(() => {
                        throw new Error('fail mount')
                    })
                })
            })
        }
    ]

    errorScenarios.forEach(({name, setup}) => {
        it(`handles ${name}`, async () => {
            setup()
            render(<GooglePayExpress {...mockData.props} />)
            await waitFor(() => {
                expect(mockPostMessage).toHaveBeenCalledWith(
                    expect.objectContaining({type: 'express.payment.unavailable'}),
                    '*'
                )
            })
        })
    })

    it('handles missing basket/orderTotal', async () => {
        setupMockHook({basket: undefined})
        render(<GooglePayExpress {...mockData.props} />)
        await waitFor(() => {
            expect(AdyenCheckout).toHaveBeenCalledTimes(1)
        })
    })

    it('handles missing config', async () => {
        setupMockHook({adyenPaymentMethods: {}})
        setupMockAdyenCheckout()
        render(<GooglePayExpress {...mockData.props} />)
        await waitFor(() => {
            expect(AdyenCheckout).toHaveBeenCalled()
        })
    })

    it('handles missing orderTotal error gracefully', async () => {
        const error = new TypeError("Cannot read properties of undefined (reading 'orderTotal')")
        setupMockAdyenCheckout({
            create: jest.fn().mockRejectedValue(error)
        })
        render(<GooglePayExpress {...mockData.props} />)
        await waitFor(() => {
            expect(mockPostMessage).not.toHaveBeenCalledWith(
                expect.objectContaining({type: 'express.payment.unavailable'}),
                '*'
            )
        })
    })

    it('handles missing shipping methods error gracefully', async () => {
        const error = new TypeError("Cannot read properties of undefined (reading 'defaultShippingMethodId')")
        setupMockAdyenCheckout({
            create: jest.fn().mockRejectedValue(error)
        })
        render(<GooglePayExpress {...mockData.props} />)
        await waitFor(() => {
            expect(mockPostMessage).not.toHaveBeenCalledWith(
                expect.objectContaining({type: 'express.payment.unavailable'}),
                '*'
            )
        })
    })
}) 
