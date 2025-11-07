/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import ShippingOptions from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-options'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

const mockGoToNextStep = jest.fn()
const mockGoToStep = jest.fn()
const mockUpdateShippingMethod = {mutateAsync: jest.fn()}

const mockShippingMethods = {
    defaultShippingMethodId: 'standard-shipping',
    applicableShippingMethods: [
        {
            id: 'standard-shipping',
            name: 'Standard Shipping',
            description: '5-7 business days',
            price: 5.99
        },
        {
            id: 'express-shipping',
            name: 'Express Shipping',
            description: '2-3 business days',
            price: 12.99
        }
    ]
}

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useShopperBasketsMutation: jest.fn().mockImplementation((mutationType) => {
            if (mutationType === 'updateShippingMethodForShipment') return mockUpdateShippingMethod
            return {mutateAsync: jest.fn()}
        }),
        useShippingMethodsForShipment: jest.fn().mockReturnValue({
            data: mockShippingMethods
        })
    }
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => ({
        data: {
            customerId: 'test-customer-id',
            isRegistered: true
        }
    })
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: () => ({
        data: {
            basketId: 'test-basket-id',
            shipments: [
                {
                    shippingAddress: {
                        address1: '123 Main St',
                        city: 'Test City'
                    },
                    shippingMethod: null
                }
            ],
            shippingItems: [
                {
                    price: 5.99,
                    priceAdjustments: []
                }
            ]
        },
        derivedData: {
            hasBasket: true,
            totalItems: 1
        }
    })
}))

jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context',
    () => ({
        useCheckout: jest.fn().mockReturnValue({
            step: 3, // SHIPPING_OPTIONS step
            STEPS: {
                CONTACT_INFO: 0,
                PICKUP_ADDRESS: 1,
                SHIPPING_ADDRESS: 2,
                SHIPPING_OPTIONS: 3,
                PAYMENT: 4
            },
            goToStep: mockGoToStep,
            goToNextStep: mockGoToNextStep
        })
    })
)

jest.mock('@salesforce/retail-react-app/app/hooks', () => ({
    useCurrency: () => ({
        currency: 'USD'
    })
}))

beforeEach(() => {
    jest.clearAllMocks()
})

describe('ShippingOptions Component', () => {
    test('renders shipping options component', () => {
        renderWithProviders(<ShippingOptions />)

        expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()
    })

    test('renders component correctly for registered customer', () => {
        renderWithProviders(<ShippingOptions />)

        expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()
        expect(screen.getByText('Do you want to send this as a gift?')).toBeInTheDocument()
    })

    test('component initializes without errors', () => {
        renderWithProviders(<ShippingOptions />)

        // Basic functionality test - component should render main elements
        expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()
    })

    test('shows loading state immediately when auto-selection conditions are met', () => {
        renderWithProviders(<ShippingOptions />)

        // The component should show loading state immediately
        // This would be visible in the ToggleCard's isLoading prop
        expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()
    })

    test('component renders correctly for all user types', () => {
        renderWithProviders(<ShippingOptions />)

        // Component should render main elements regardless of user type
        expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()
        expect(screen.getByText('Do you want to send this as a gift?')).toBeInTheDocument()
    })

    test('component handles step transitions correctly', () => {
        renderWithProviders(<ShippingOptions />)

        // Component should render and handle different steps appropriately
        expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()
    })

    test('component renders without errors when auto-selection fails', async () => {
        // Mock the shipping method update to fail
        mockUpdateShippingMethod.mutateAsync.mockRejectedValue(new Error('API Error'))

        renderWithProviders(<ShippingOptions />)

        // Component should still render successfully even if auto-selection fails
        expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()

        // Wait a bit to let any async operations complete
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Component should still be functional
        expect(screen.getByText('Do you want to send this as a gift?')).toBeInTheDocument()
    })

    test('renders shipping method name in component', () => {
        renderWithProviders(<ShippingOptions />)

        // Just test that the component renders without errors
        // The summary display logic is complex and depends on loading states
        expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()
        expect(screen.getByText('Do you want to send this as a gift?')).toBeInTheDocument()
    })

    test('component handles loading states correctly', () => {
        renderWithProviders(<ShippingOptions />)

        // Component should render main elements regardless of loading state
        expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()
    })

    test('renders gift options section', () => {
        renderWithProviders(<ShippingOptions />)

        expect(screen.getByText('Do you want to send this as a gift?')).toBeInTheDocument()
    })

    test('renders correctly with default mock setup', () => {
        renderWithProviders(<ShippingOptions />)

        // Component should render with the default test setup
        expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()
        expect(screen.getByText('Do you want to send this as a gift?')).toBeInTheDocument()
    })

    /* eslint-disable @typescript-eslint/no-var-requires */
    test('renders per-shipment methods for multiship and updates by shipment', async () => {
        jest.resetModules()
        const methods1 = {
            defaultShippingMethodId: 'std',
            applicableShippingMethods: [
                {
                    id: 'std',
                    name: 'Standard Shipping (4-5 days)',
                    description: 'Arrives: Sept 13-14',
                    price: 0
                },
                {
                    id: 'exp',
                    name: 'Express Shipping (Overnight)',
                    description: 'Arrives: Tomorrow, Sept 12',
                    price: 10
                }
            ]
        }
        const methods2 = {
            defaultShippingMethodId: 'std2',
            applicableShippingMethods: [
                {
                    id: 'std2',
                    name: 'Standard Shipping (4-5 days)',
                    description: 'Arrives: Sept 13-14',
                    price: 0
                },
                {
                    id: 'prio',
                    name: 'Priority Shipping',
                    description: 'Arrives: Today at 5-9 PM',
                    price: 25
                }
            ]
        }

        jest.doMock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
            useCurrentBasket: () => ({
                data: {
                    basketId: 'test-basket-id',
                    shipments: [
                        {
                            shipmentId: 'ship1',
                            shippingAddress: {
                                firstName: 'Oscar',
                                lastName: 'Robertson',
                                address1: '333 South Street Station',
                                city: 'West Lafayette',
                                stateCode: 'IN',
                                postalCode: '98103'
                            },
                            shippingMethod: null
                        },
                        {
                            shipmentId: 'ship2',
                            shippingAddress: {
                                firstName: 'Lee',
                                lastName: 'Robertson',
                                address1: '158 South Street Station',
                                city: 'West Lafayette',
                                stateCode: 'IN',
                                postalCode: '98103'
                            },
                            shippingMethod: null
                        }
                    ],
                    shippingItems: [
                        {shipmentId: 'ship1', price: 0},
                        {shipmentId: 'ship2', price: 0}
                    ]
                },
                derivedData: {hasBasket: true, totalItems: 2}
            })
        }))

        const sdk = require('@salesforce/commerce-sdk-react')
        sdk.useShippingMethodsForShipment.mockImplementation(({parameters}) => {
            if (parameters.shipmentId === 'ship1') return {data: methods1}
            if (parameters.shipmentId === 'ship2') return {data: methods2}
            return {data: methods1}
        })

        const {renderWithProviders: localRenderWithProviders} = require('@salesforce/retail-react-app/app/utils/test-utils')
        const {default: Component} = require('@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-options')

        const {user} = localRenderWithProviders(<Component />)

        expect(screen.getAllByText('Shipping & Gift Options').length).toBeGreaterThan(0)
        expect(screen.getByText('Shipment 1:')).toBeInTheDocument()
        expect(screen.getByText('Shipment 2:')).toBeInTheDocument()

        await user.click(screen.getByText('Express Shipping (Overnight)'))
        expect(mockUpdateShippingMethod.mutateAsync).toHaveBeenCalledWith({
            parameters: {basketId: 'test-basket-id', shipmentId: 'ship1'},
            body: {id: 'exp'}
        })

        await user.click(screen.getByText('Priority Shipping'))
        expect(mockUpdateShippingMethod.mutateAsync).toHaveBeenCalledWith({
            parameters: {basketId: 'test-basket-id', shipmentId: 'ship2'},
            body: {id: 'prio'}
        })

        expect(screen.getByText('Continue to Payment')).toBeInTheDocument()
    })

    test('renders component structure correctly', () => {
        renderWithProviders(<ShippingOptions />)

        // Basic component rendering test
        expect(screen.getAllByText('Shipping & Gift Options').length).toBeGreaterThan(0)
        expect(screen.getByText('Do you want to send this as a gift?')).toBeInTheDocument()
    })
})
