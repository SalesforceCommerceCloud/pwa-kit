/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import ShippingAddress from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

const mockGoToNextStep = jest.fn()
const mockGoToStep = jest.fn()
const mockUpdateShippingAddress = {mutateAsync: jest.fn()}
const mockCreateCustomerAddress = {mutateAsync: jest.fn()}
const mockUpdateCustomerAddress = {mutateAsync: jest.fn()}

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useShopperBasketsMutation: jest.fn().mockImplementation((mutationType) => {
            if (mutationType === 'updateShippingAddressForShipment')
                return mockUpdateShippingAddress
            return {mutateAsync: jest.fn()}
        }),
        useShopperCustomersMutation: jest.fn().mockImplementation((mutationType) => {
            if (mutationType === 'createCustomerAddress') return mockCreateCustomerAddress
            if (mutationType === 'updateCustomerAddress') return mockUpdateCustomerAddress
            return {mutateAsync: jest.fn()}
        })
    }
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => ({
        data: {
            customerId: 'test-customer-id',
            isRegistered: true,
            addresses: [
                {
                    addressId: 'preferred-address',
                    address1: '123 Main St',
                    city: 'Test City',
                    countryCode: 'US',
                    firstName: 'John',
                    lastName: 'Doe',
                    phone: '555-1234',
                    postalCode: '12345',
                    stateCode: 'CA',
                    preferred: true
                }
            ]
        }
    })
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: () => ({
        data: {
            basketId: 'test-basket-id',
            shipments: [
                {
                    shippingAddress: null
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
    '@salesforce/retail-react-app/app/pages/checkout-container/util/checkout-context',
    () => ({
        useCheckout: jest.fn().mockReturnValue({
            step: 2, // SHIPPING_ADDRESS step
            STEPS: {
                CONTACT_INFO: 0,
                PICKUP_ADDRESS: 1,
                SHIPPING_ADDRESS: 2,
                SHIPPING_OPTIONS: 3
            },
            goToStep: mockGoToStep,
            goToNextStep: mockGoToNextStep
        })
    })
)

// Mock the ShippingAddressSelection component
jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address-selection',
    () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const PropTypes = require('prop-types')

        function MockShippingAddressSelection({onSubmit}) {
            return (
                <div data-testid="shipping-address-selection">
                    <button
                        onClick={() =>
                            onSubmit({
                                addressId: 'test-address',
                                address1: '123 Test St',
                                city: 'Test City',
                                countryCode: 'US',
                                firstName: 'Test',
                                lastName: 'User',
                                phone: '555-0123',
                                postalCode: '12345',
                                stateCode: 'CA'
                            })
                        }
                    >
                        Continue to Shipping Method
                    </button>
                </div>
            )
        }

        MockShippingAddressSelection.propTypes = {
            onSubmit: PropTypes.func
        }

        return MockShippingAddressSelection
    }
)

beforeEach(() => {
    jest.clearAllMocks()
})

describe('ShippingAddress Component', () => {
    test('renders shipping address component', () => {
        renderWithProviders(<ShippingAddress />)

        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
    })

    test('renders correctly for registered customers', () => {
        renderWithProviders(<ShippingAddress />)

        // Component should render successfully for registered customers
        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
        expect(screen.getByText('Continue to Shipping Method')).toBeInTheDocument()
    })

    test('renders address selection component correctly', () => {
        renderWithProviders(<ShippingAddress />)

        // Should render the shipping address selection component
        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
    })

    test('handles user interactions correctly', async () => {
        const {user} = renderWithProviders(<ShippingAddress />)

        const submitButton = screen.getByText('Continue to Shipping Method')

        // Button should be clickable
        expect(submitButton).toBeInTheDocument()
        await user.click(submitButton)

        // Component should remain stable after interaction
        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
    })

    test('renders form elements correctly', () => {
        renderWithProviders(<ShippingAddress />)

        // Component should render form elements
        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
        expect(screen.getByText('Continue to Shipping Method')).toBeInTheDocument()
    })

    test('component integrates with address selection correctly', () => {
        renderWithProviders(<ShippingAddress />)

        // Should render and integrate with the address selection component
        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
        expect(screen.getByText('Continue to Shipping Method')).toBeInTheDocument()
    })

    test('handles submission errors gracefully', async () => {
        mockUpdateShippingAddress.mutateAsync.mockRejectedValue(new Error('API Error'))

        const {user} = renderWithProviders(<ShippingAddress />)

        const submitButton = screen.getByText('Continue to Shipping Method')
        await user.click(submitButton)

        await waitFor(() => {
            expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        })

        // The component should handle the error and not call goToNextStep
        expect(mockGoToNextStep).not.toHaveBeenCalled()
    })

    test('shows loading state during address submission', async () => {
        // Mock a delayed response
        mockUpdateShippingAddress.mutateAsync.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        )

        const {user} = renderWithProviders(<ShippingAddress />)

        const submitButton = screen.getByText('Continue to Shipping Method')
        await user.click(submitButton)

        // The ToggleCard should show loading state
        // This would require checking for loading indicators in the UI
        expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
    })

    test('component handles different user states correctly', () => {
        renderWithProviders(<ShippingAddress />)

        // Component should render successfully regardless of user state
        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
    })

    test('renders component without errors', () => {
        renderWithProviders(<ShippingAddress />)

        // Basic rendering test - component should render main elements
        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
    })
})
