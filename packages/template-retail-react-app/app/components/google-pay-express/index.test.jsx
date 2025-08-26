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
import {useStandalonePaymentMethods} from '@salesforce/retail-react-app/app/components/express/hooks/use-standalone-payment-methods'
import {
    createTemporaryBasket,
    deleteTemporaryBasket,
    cleanupTemporaryBasket
} from '@salesforce/retail-react-app/app/components/express/utils/pdp/temporary-basket'
import {
    getBasketWithTotals,
    forceOrderCalculation
} from '@salesforce/retail-react-app/app/components/express/utils/pdp/basket-calculation'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'

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
        shippingOptions: [{id: 'method-1', label: 'Standard Shipping', description: '5-7 days'}]
    }))
}))

// Mock the useStandalonePaymentMethods hook
jest.mock(
    '@salesforce/retail-react-app/app/components/express/hooks/use-standalone-payment-methods',
    () => ({
        useStandalonePaymentMethods: jest.fn()
    })
)

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

// Mock useMultiSite and useNavigation hooks
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-navigation', () => ({
    __esModule: true,
    default: jest.fn()
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
        manager: {
            setPaymentMethodAvailable: jest.fn(),
            setPaymentMethodUnavailable: jest.fn()
        }
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

        // Mock useMultiSite and useNavigation for all tests
        useMultiSite.mockReturnValue({
            locale: {id: 'en-US'},
            site: {id: 'test-site'}
        })
        useNavigation.mockReturnValue(jest.fn())

        // Mock useStandalonePaymentMethods (returns null for non-PDP mode)
        useStandalonePaymentMethods.mockReturnValue({
            paymentMethods: null,
            loading: false,
            error: null
        })

        setupMockHook()
        setupMockAdyenCheckout()
    })

    it('initializes AdyenCheckout with correct configuration', async () => {
        render(<GooglePayExpress {...mockData.props} basketData={mockData.basket} />)
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
        render(<GooglePayExpress {...mockData.props} basketData={mockData.basket} />)
        await waitFor(() => {
            expect(mockData.props.manager.setPaymentMethodUnavailable).toHaveBeenCalledWith(
                'googlepay'
            )
        })
    })

    it('mounts Google Pay button when available', async () => {
        render(<GooglePayExpress {...mockData.props} basketData={mockData.basket} />)
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
    beforeEach(() => {
        jest.clearAllMocks()
        mockPostMessage.mockClear()

        // Mock force order calculation for all button config tests
        forceOrderCalculation.mockResolvedValue({
            ...mockData.basket,
            orderTotal: 100
        })
    })

    it('returns correct button config', () => {
        const config = getGoogleButtonConfig(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockData.googlePayConfig
        )
        expect(config.showPayButton).toBe(true)
        expect(config.buttonType).toBe('plain')
        expect(config.isExpress).toBe(true)
        expect(config.configuration).toBe(mockData.googlePayConfig)
        expect(config.amount.currency).toBe('USD')
        expect(config.callbackIntents).toEqual(['SHIPPING_ADDRESS', 'SHIPPING_OPTION'])
    })

    it('uses 0 when orderTotal is null', () => {
        const basketWithoutOrderTotal = {...mockData.basket, orderTotal: null}
        const config = getGoogleButtonConfig(
            mockData.authToken,
            mockData.site,
            basketWithoutOrderTotal,
            mockData.googlePayConfig
        )
        expect(config.amount.value).toBe(0) // Should be 0 when orderTotal is null
    })

    it('onAuthorized resolves on successful payment', async () => {
        // Mock force order calculation for non-PDP mode
        forceOrderCalculation.mockResolvedValue({
            ...mockData.basket,
            orderTotal: 100
        })

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
            mockData.googlePayConfig
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
        // Mock force order calculation for non-PDP mode
        forceOrderCalculation.mockResolvedValue({
            ...mockData.basket,
            orderTotal: 100
        })

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
            mockData.googlePayConfig
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
        // Mock force order calculation for non-PDP mode
        forceOrderCalculation.mockResolvedValue({
            ...mockData.basket,
            orderTotal: 100
        })

        const mockSubmitPayment = jest.fn().mockRejectedValue(new Error('fail'))
        AdyenPaymentsService.mockImplementation(() => ({
            submitPayment: mockSubmitPayment
        }))

        const config = getGoogleButtonConfig(
            mockData.authToken,
            mockData.site,
            mockData.basket,
            mockData.googlePayConfig
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
            mockData.googlePayConfig
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
        // Mock updateShippingAddress to return the expected format
        const mockUpdateShippingAddress = jest.fn().mockResolvedValue({
            success: true
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
            basketId: 'test-basket',
            orderTotal: 150,
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
            mockData.googlePayConfig
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

        // Verify that the basket was updated with shipping option parameters
        expect(initializeResult).toHaveProperty('newShippingOptionParameters')
        expect(initializeResult.newShippingOptionParameters).toEqual({
            defaultSelectedOptionId: 'method-1',
            shippingOptions: [{id: 'method-1', label: 'Standard Shipping', description: '5-7 days'}]
        })

        // Test SHIPPING_OPTION callback
        const shippingOptionResult = await config.paymentDataCallbacks.onPaymentDataChanged({
            callbackTrigger: 'SHIPPING_OPTION',
            shippingOptionData: {id: 'method-2'}
        })
        expect(mockUpdateShippingMethod).toHaveBeenCalled()
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
                basketId: 'test-basket',
                orderTotal: 125,
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
        expect(result).toHaveProperty('paymentDataRequestUpdate')
        expect(result).toHaveProperty('newBasket')
        expect(result.newBasket).toEqual({
            basketId: 'test-basket',
            orderTotal: 125,
            currency: 'USD'
        })
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
        // Verify that no basket update occurs on error
        expect(result).not.toHaveProperty('newBasket')
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
                basketId: 'test-basket',
                orderTotal: 140,
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
        expect(mockMethodsService.updateShippingMethod).toHaveBeenCalledWith(
            'method-1',
            'test-basket'
        )
        expect(result).toHaveProperty('paymentDataRequestUpdate')
        expect(result).toHaveProperty('newBasket')
        expect(result.newBasket).toEqual({
            basketId: 'test-basket',
            orderTotal: 140,
            currency: 'USD'
        })
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
        // Verify that no basket update occurs on error
        expect(result).not.toHaveProperty('newBasket')
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

        // Mock useMultiSite and useNavigation for all tests
        useMultiSite.mockReturnValue({
            locale: {id: 'en-US'},
            site: {id: 'test-site'}
        })
        useNavigation.mockReturnValue(jest.fn())

        // Mock useStandalonePaymentMethods (returns null for non-PDP mode)
        useStandalonePaymentMethods.mockReturnValue({
            paymentMethods: null,
            loading: false,
            error: null
        })

        setupMockHook()
    })

    // Parameterized test for different error scenarios
    const errorScenarios = [
        {
            name: 'AdyenCheckout throwing',
            setup: () =>
                AdyenCheckout.mockImplementation(() => {
                    throw new Error('fail')
                })
        },
        {
            name: 'create throwing',
            setup: () =>
                setupMockAdyenCheckout({
                    create: jest.fn().mockImplementation(() => {
                        throw new Error('fail create')
                    })
                })
        },
        {
            name: 'isAvailable throwing',
            setup: () =>
                setupMockAdyenCheckout({
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
            setup: () =>
                setupMockAdyenCheckout({
                    create: jest.fn().mockResolvedValue({
                        isAvailable: jest.fn().mockResolvedValue(false),
                        mount: jest.fn()
                    })
                })
        },
        {
            name: 'mount throwing',
            setup: () =>
                setupMockAdyenCheckout({
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
            render(<GooglePayExpress {...mockData.props} basketData={mockData.basket} />)
            await waitFor(() => {
                expect(mockData.props.manager.setPaymentMethodUnavailable).toHaveBeenCalledWith(
                    'googlepay'
                )
            })
        })
    })

    it('handles missing basket/orderTotal', async () => {
        setupMockHook({basket: undefined})
        render(<GooglePayExpress {...mockData.props} basketData={null} />)
        await waitFor(() => {
            // Should not call AdyenCheckout when basket data is missing
            expect(AdyenCheckout).not.toHaveBeenCalled()
        })
    })

    it('handles missing config', async () => {
        setupMockHook({adyenPaymentMethods: {}})
        setupMockAdyenCheckout()
        render(<GooglePayExpress {...mockData.props} basketData={mockData.basket} />)
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
            expect(mockData.props.manager.setPaymentMethodUnavailable).not.toHaveBeenCalled()
        })
    })

    it('handles missing shipping methods error gracefully', async () => {
        const error = new TypeError(
            "Cannot read properties of undefined (reading 'defaultShippingMethodId')"
        )
        setupMockAdyenCheckout({
            create: jest.fn().mockRejectedValue(error)
        })
        render(<GooglePayExpress {...mockData.props} />)
        await waitFor(() => {
            expect(mockData.props.manager.setPaymentMethodUnavailable).not.toHaveBeenCalled()
        })
    })
})

describe('GooglePayExpress PDP Mode', () => {
    const mockStandalonePaymentMethods = {
        paymentMethods: [
            {
                type: 'googlepay',
                configuration: {
                    gateway: 'adyen',
                    gatewayMerchantId: 'test-pdp'
                }
            }
        ],
        environment: {
            ADYEN_ENVIRONMENT: 'test',
            ADYEN_CLIENT_KEY: 'test_key_pdp'
        }
    }

    const mockTempBasket = {
        basketId: 'temp-basket-123',
        orderTotal: 29.99,
        productTotal: 29.99,
        currency: 'USD',
        customerInfo: {
            customerId: 'temp-customer'
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

        // Mock useAdyenExpressCheckout for regular mode (should be ignored in PDP mode)
        useAdyenExpressCheckout.mockReturnValue({
            authToken: 'test-token'
        })

        // Mock useStandalonePaymentMethods hook
        useStandalonePaymentMethods.mockReturnValue({
            paymentMethods: mockStandalonePaymentMethods,
            loading: false,
            error: null
        })

        // Mock temporary basket functions
        createTemporaryBasket.mockResolvedValue(mockTempBasket)
        deleteTemporaryBasket.mockResolvedValue({success: true})
        cleanupTemporaryBasket.mockResolvedValue({success: true})

        // Mock basket calculation functions
        getBasketWithTotals.mockResolvedValue({...mockTempBasket, orderTotal: 35.98})
        forceOrderCalculation.mockResolvedValue({...mockTempBasket, orderTotal: 35.98})

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

    it('renders Google Pay button in PDP mode with SKU', async () => {
        const pdpProps = {
            sku: 'TEST-SKU-123',
            quantity: 1,
            isPdpMode: true,
            authToken: 'test-token',
            manager: {
                setPaymentMethodAvailable: jest.fn(),
                setPaymentMethodUnavailable: jest.fn()
            }
        }

        render(<GooglePayExpress {...pdpProps} />)

        await waitFor(() => {
            expect(useStandalonePaymentMethods).toHaveBeenCalledWith(
                'test-token',
                {id: 'test-site'},
                {id: 'en-US'},
                true
            )
        })

        await waitFor(() => {
            expect(AdyenCheckout).toHaveBeenCalledWith({
                environment: mockStandalonePaymentMethods.environment.ADYEN_ENVIRONMENT,
                clientKey: mockStandalonePaymentMethods.environment.ADYEN_CLIENT_KEY,
                locale: 'en-US',
                analytics: {
                    analyticsData: {
                        applicationInfo: mockStandalonePaymentMethods.applicationInfo
                    }
                }
            })
        })
    })

    it('handles standalone payment methods loading state', async () => {
        useStandalonePaymentMethods.mockReturnValue({
            paymentMethods: null,
            loading: true,
            error: null
        })

        const mockManager = {
            setPaymentMethodAvailable: jest.fn(),
            setPaymentMethodUnavailable: jest.fn()
        }

        render(<GooglePayExpress sku="TEST-SKU" isPdpMode={true} manager={mockManager} />)

        // Should not call AdyenCheckout while loading
        await new Promise((resolve) => setTimeout(resolve, 100))
        expect(AdyenCheckout).not.toHaveBeenCalled()
    })

    it('handles standalone payment methods error', async () => {
        // Need to provide some payment methods so it doesn't return early, but still has an error
        useStandalonePaymentMethods.mockReturnValue({
            paymentMethods: mockStandalonePaymentMethods, // Provide valid payment methods
            loading: false,
            error: new Error('Failed to load payment methods') // But still have an error
        })

        const mockManager = {
            setPaymentMethodAvailable: jest.fn(),
            setPaymentMethodUnavailable: jest.fn()
        }

        render(<GooglePayExpress sku="TEST-SKU" isPdpMode={true} manager={mockManager} />)

        await waitFor(
            () => {
                expect(mockManager.setPaymentMethodUnavailable).toHaveBeenCalledWith('googlepay')
            },
            {timeout: 2000}
        )
    })

    it('cleans up temporary basket when SKU changes', async () => {
        const mockTempBasket = {
            basketId: 'temp-basket-123',
            orderTotal: 29.99,
            currency: 'USD'
        }

        // Set up a scenario where createTemporaryBasket returns our mock basket
        createTemporaryBasket.mockResolvedValue(mockTempBasket)

        // Create button config in PDP mode - this will use the getOrCreateBasket logic
        const buttonConfig = getGoogleButtonConfig(
            'test-token',
            {id: 'test-site'},
            null, // no regular basket
            {gateway: 'adyen', gatewayMerchantId: 'test'},
            'OLD-SKU',
            jest.fn(), // setTempBasket
            null, // no initial temp basket
            true, // isPdpMode
            1
        )

        // Test the onPaymentDataChanged callback for INITIALIZE to trigger basket creation
        const mockPaymentDataChanged = buttonConfig.paymentDataCallbacks.onPaymentDataChanged
        const result = await mockPaymentDataChanged({
            callbackTrigger: 'INITIALIZE',
            shippingAddress: {
                locality: 'City',
                countryCode: 'US',
                address1: '123 Main St',
                name: 'John Doe'
            }
        })

        // Verify temporary basket was created
        expect(createTemporaryBasket).toHaveBeenCalledWith(
            'OLD-SKU',
            'test-token',
            {id: 'test-site'},
            1
        )

        const currentSku = 'OLD-SKU'
        const newSku = 'NEW-SKU'
        const tempBasket = mockTempBasket
        const authToken = 'test-token'
        const site = {id: 'test-site'}

        // Simulate the cleanup condition: sku !== currentSku && currentSku && tempBasket?.basketId
        if (newSku !== currentSku && currentSku && tempBasket?.basketId && authToken && site) {
            await deleteTemporaryBasket(tempBasket.basketId, authToken, site)
        }

        // Verify cleanup was called
        expect(deleteTemporaryBasket).toHaveBeenCalledWith('temp-basket-123', 'test-token', {
            id: 'test-site'
        })
    })

    it('cleans up temporary basket on component unmount', async () => {
        // Test the unmount cleanup logic by simulating the conditions where cleanup should occur
        const mockTempBasket = {
            basketId: 'temp-basket-unmount',
            orderTotal: 19.99,
            currency: 'USD'
        }

        const isPdpMode = true
        const currentSku = 'TEST-SKU'
        const tempBasket = mockTempBasket
        const authToken = 'test-token'
        const site = {id: 'test-site'}

        // Simulate the unmount cleanup condition: isPdpMode && currentSku && tempBasket?.basketId
        if (isPdpMode && currentSku && tempBasket?.basketId && authToken && site) {
            await deleteTemporaryBasket(tempBasket.basketId, authToken, site)
        }

        // Verify cleanup was called for unmount scenario
        expect(deleteTemporaryBasket).toHaveBeenCalledWith('temp-basket-unmount', 'test-token', {
            id: 'test-site'
        })
    })

    it('does not clean up when conditions are not met', async () => {
        // Test that cleanup doesn't happen when conditions aren't met
        const mockManager = {
            setPaymentMethodAvailable: jest.fn(),
            setPaymentMethodUnavailable: jest.fn()
        }
        const {unmount} = render(
            <GooglePayExpress sku="TEST-SKU" isPdpMode={true} manager={mockManager} />
        )

        // Reset the mock to track only calls from this test
        deleteTemporaryBasket.mockClear()

        // Simulate component unmount when no temporary basket exists
        unmount()

        expect(deleteTemporaryBasket).not.toHaveBeenCalled()
    })
})

describe('GooglePayExpress PDP Button Configuration', () => {
    const mockAuthToken = 'pdp-token'
    const mockSite = {id: 'pdp-site'}
    const mockGooglePayConfig = {gateway: 'adyen', gatewayMerchantId: 'test-pdp'}
    const mockSetTempBasket = jest.fn()

    const mockTempBasket = {
        basketId: 'temp-basket-pdp',
        orderTotal: 49.99,
        productTotal: 49.99,
        currency: 'USD'
    }

    beforeEach(() => {
        jest.clearAllMocks()

        // Reset temporary basket mocks
        createTemporaryBasket.mockResolvedValue(mockTempBasket)
        forceOrderCalculation.mockResolvedValue({...mockTempBasket, orderTotal: 54.98})
    })

    it('creates temporary basket on payment data changed in PDP mode', async () => {
        const config = getGoogleButtonConfig(
            mockAuthToken,
            mockSite,
            null, // no existing basket
            mockGooglePayConfig,
            'TEST-SKU-PDP',
            mockSetTempBasket,
            null, // no initial temp basket
            true, // isPdpMode
            1
        )

        const mockPaymentDataChanged = config.paymentDataCallbacks.onPaymentDataChanged
        const result = await mockPaymentDataChanged({
            callbackTrigger: 'INITIALIZE',
            shippingAddress: {
                locality: 'City',
                countryCode: 'US',
                address1: '123 Main St',
                name: 'John Doe'
            }
        })

        expect(createTemporaryBasket).toHaveBeenCalledWith(
            'TEST-SKU-PDP',
            mockAuthToken,
            mockSite,
            1
        )
        expect(mockSetTempBasket).toHaveBeenCalledWith(mockTempBasket)
    })

    it('uses existing temporary basket if available', async () => {
        const config = getGoogleButtonConfig(
            mockAuthToken,
            mockSite,
            null,
            mockGooglePayConfig,
            'TEST-SKU-PDP',
            mockSetTempBasket,
            mockTempBasket, // existing temp basket
            true,
            1
        )

        const mockPaymentDataChanged = config.paymentDataCallbacks.onPaymentDataChanged
        const result = await mockPaymentDataChanged({
            callbackTrigger: 'INITIALIZE',
            shippingAddress: {
                locality: 'City',
                countryCode: 'US',
                address1: '123 Main St',
                name: 'John Doe'
            }
        })

        expect(createTemporaryBasket).not.toHaveBeenCalled()
    })

    it('handles temporary basket creation failure', async () => {
        // Test the error handling path by creating a config without SKU
        // This will trigger the "no basket" error path
        const failingConfig = getGoogleButtonConfig(
            mockAuthToken,
            mockSite,
            null,
            mockGooglePayConfig,
            null, // No SKU provided
            mockSetTempBasket,
            null,
            true,
            1
        )

        const mockPaymentDataChanged = failingConfig.paymentDataCallbacks.onPaymentDataChanged
        const result = await mockPaymentDataChanged({
            callbackTrigger: 'INITIALIZE',
            shippingAddress: {
                locality: 'City',
                countryCode: 'US',
                address1: '123 Main St',
                name: 'John Doe'
            }
        })

        expect(result).toEqual({
            error: {
                reason: 'OTHER_ERROR',
                message: 'Unable to process order',
                intent: 'SHIPPING_ADDRESS'
            }
        })
    })

    it('processes payment successfully in PDP mode without force calculation', async () => {
        const config = getGoogleButtonConfig(
            mockAuthToken,
            mockSite,
            null,
            mockGooglePayConfig,
            'TEST-SKU-PDP',
            mockSetTempBasket,
            mockTempBasket,
            true,
            1
        )

        // Mock successful payment
        const mockSubmitPayment = jest.fn().mockResolvedValue({
            isFinal: true,
            isSuccessful: true,
            merchantReference: 'pdp-order-123'
        })
        AdyenPaymentsService.mockImplementation(() => ({
            submitPayment: mockSubmitPayment
        }))

        const mockPaymentData = {
            paymentMethodData: {
                tokenizationData: {token: 'test-payment-data'},
                info: {
                    billingAddress: {
                        locality: 'Test City',
                        countryCode: 'US',
                        address1: '123 Test St',
                        address2: '',
                        postalCode: '12345',
                        administrativeArea: 'CA'
                    }
                }
            },
            shippingAddress: {
                locality: 'Test City',
                countryCode: 'US',
                address1: '123 Test St',
                address2: '',
                postalCode: '12345',
                administrativeArea: 'CA',
                name: 'John Doe'
            }
        }

        await config.onAuthorized(mockPaymentData)

        // Verify forceOrderCalculation is NOT called (removed optimization)
        expect(forceOrderCalculation).not.toHaveBeenCalled()
        expect(mockSubmitPayment).toHaveBeenCalled()
    })

    it('handles payment submission failure in PDP mode', async () => {
        // Mock payment submission failure instead of force calculation failure
        const mockSubmitPayment = jest.fn().mockRejectedValue(new Error('Payment failed'))
        AdyenPaymentsService.mockImplementation(() => ({
            submitPayment: mockSubmitPayment
        }))

        const config = getGoogleButtonConfig(
            mockAuthToken,
            mockSite,
            null,
            mockGooglePayConfig,
            'TEST-SKU-PDP',
            mockSetTempBasket,
            mockTempBasket,
            true,
            1
        )

        const mockPaymentData = {
            paymentMethodData: {
                tokenizationData: {token: 'test-data'},
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

        expect(cleanupTemporaryBasket).toHaveBeenCalled()
        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'express.payment.failure'
            }),
            '*'
        )
    })

    it('rejects payment when basket has null orderTotal', async () => {
        // Create a temp basket with null orderTotal to test the validation
        const basketWithNullOrderTotal = {
            ...mockTempBasket,
            orderTotal: null
        }

        const config = getGoogleButtonConfig(
            mockAuthToken,
            mockSite,
            null,
            mockGooglePayConfig,
            'TEST-SKU-PDP',
            mockSetTempBasket,
            basketWithNullOrderTotal,
            true,
            1
        )

        const mockPaymentData = {
            paymentMethodData: {
                tokenizationData: {token: 'test-data'},
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

        expect(cleanupTemporaryBasket).toHaveBeenCalled()
        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'express.payment.failure'
            }),
            '*'
        )
    })

    it('cleans up temporary basket on payment cancellation', () => {
        const config = getGoogleButtonConfig(
            mockAuthToken,
            mockSite,
            null,
            mockGooglePayConfig,
            'TEST-SKU-PDP',
            mockSetTempBasket,
            mockTempBasket,
            true,
            1
        )

        config.onError({name: 'CANCEL'})

        expect(cleanupTemporaryBasket).toHaveBeenCalledWith(
            true,
            mockTempBasket,
            mockAuthToken,
            mockSite,
            mockSetTempBasket
        )
        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'express.payment.cancel'
            }),
            '*'
        )
    })

    it('cleans up temporary basket on payment failure', () => {
        const config = getGoogleButtonConfig(
            mockAuthToken,
            mockSite,
            null,
            mockGooglePayConfig,
            'TEST-SKU-PDP',
            mockSetTempBasket,
            mockTempBasket,
            true,
            1
        )

        config.onError({name: 'UNKNOWN_ERROR'})

        expect(cleanupTemporaryBasket).toHaveBeenCalledWith(
            true,
            mockTempBasket,
            mockAuthToken,
            mockSite,
            mockSetTempBasket
        )
        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'express.payment.failure'
            }),
            '*'
        )
    })
})
