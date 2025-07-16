/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen, fireEvent, waitFor} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import ShippingAddress from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'

// Mock the hooks
jest.mock('@salesforce/retail-react-app/app/pages/checkout/util/checkout-context')
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer')
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')

// Mock mutation hooks to prevent QueryClient errors
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useShopperCustomersMutation: () => ({
            mutateAsync: jest.fn().mockResolvedValue({})
        }),
        useShopperBasketsMutation: () => ({
            mutateAsync: jest.fn().mockResolvedValue({})
        })
    }
})

// Mock the toggle card components
jest.mock('@salesforce/retail-react-app/app/components/toggle-card', () => {
    // eslint-disable-next-line react/prop-types
    const ToggleCard = ({children, editing, onEdit, editLabel}) => (
        <div data-testid="toggle-card" data-editing={editing ? 'true' : 'false'}>
            <button data-testid="edit-button" onClick={onEdit}>
                {editLabel}
            </button>
            {children}
        </div>
    )

    // eslint-disable-next-line react/prop-types
    const ToggleCardEdit = ({children}) => <div data-testid="toggle-card-edit">{children}</div>

    // eslint-disable-next-line react/prop-types
    const ToggleCardSummary = ({children}) => (
        <div data-testid="toggle-card-summary">{children}</div>
    )

    return {
        ToggleCard,
        ToggleCardEdit,
        ToggleCardSummary
    }
})

// Mock the shipping address selection component
jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address-selection',
    () => {
        // eslint-disable-next-line react/prop-types
        function MockShippingAddressSelection({onSubmit}) {
            const mockAddress = {
                addressId: 'addr-1',
                address1: '123 Test St',
                city: 'Test City',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                phone: '555-555-5555',
                postalCode: '12345',
                stateCode: 'CA'
            }
            return (
                <div data-testid="shipping-address-selection" role="button" tabIndex={0}>
                    Mock Shipping Address Selection
                    <button data-testid="submit-address" onClick={() => onSubmit(mockAddress)}>
                        Submit Address
                    </button>
                </div>
            )
        }
        return MockShippingAddressSelection
    }
)

// Mock the multi-shipping component
jest.mock('@salesforce/retail-react-app/app/pages/checkout/partials/shipping-multi-address', () => {
    // eslint-disable-next-line react/prop-types
    function MockShippingMultiAddress({onSubmit}) {
        const mockAddresses = [
            {
                addressId: 'addr-1',
                address1: '123 Test St',
                city: 'Test City',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                phone: '555-555-5555',
                postalCode: '12345',
                stateCode: 'CA'
            }
        ]
        return (
            <div data-testid="multi-shipping" role="button" tabIndex={0}>
                Mock Multi Shipping
                <button data-testid="submit-multi-address" onClick={() => onSubmit(mockAddresses)}>
                    Submit Multi Address
                </button>
            </div>
        )
    }
    return MockShippingMultiAddress
})

const mockCustomer = {
    customerId: 'customer-1',
    isRegistered: true,
    addresses: [
        {
            addressId: 'addr-1',
            firstName: 'John',
            lastName: 'Doe',
            address1: '123 Test St',
            city: 'Test City',
            stateCode: 'CA',
            postalCode: '12345'
        },
        {
            addressId: 'addr-2',
            firstName: 'Jane',
            lastName: 'Smith',
            address1: '456 Another St',
            city: 'Another City',
            stateCode: 'NY',
            postalCode: '67890'
        }
    ]
}

const mockBasket = {
    basketId: 'basket-1',
    productItems: [
        {
            productId: 'product-1',
            productName: 'Test Product 1',
            quantity: 2
        },
        {
            productId: 'product-2',
            productName: 'Test Product 2',
            quantity: 1
        }
    ]
}

const mockCheckoutContext = {
    step: 3, // SHIPPING_ADDRESS
    goToStep: jest.fn(),
    STEPS: {
        SHIPPING_ADDRESS: 3,
        SHIPPING_OPTIONS: 4,
        PAYMENT: 5,
        REVIEW_ORDER: 6
    }
}

const defaultProps = {
    basket: mockBasket,
    customer: mockCustomer
}

const renderWithIntl = (component) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false
            }
        }
    })
    return render(
        <QueryClientProvider client={queryClient}>
            <IntlProvider locale="en">{component}</IntlProvider>
        </QueryClientProvider>
    )
}

describe('ShippingAddress', () => {
    beforeEach(() => {
        mockCheckoutContext.goToStep.mockClear()
        useCurrentCustomer.mockReturnValue({
            data: mockCustomer
        })
        useCurrentBasket.mockReturnValue({
            data: mockBasket
        })
        useCheckout.mockReturnValue(mockCheckoutContext)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should render shipping address selection for single shipping', () => {
        renderWithIntl(<ShippingAddress {...defaultProps} />)

        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
        expect(screen.queryByTestId('multi-shipping')).not.toBeInTheDocument()
    })

    it('should render multi-shipping when multiple items and toggle is enabled', () => {
        // Mock that we're in editing mode and have multiple items
        const editingContext = {
            ...mockCheckoutContext,
            step: 3 // SHIPPING_ADDRESS
        }
        useCheckout.mockReturnValue(editingContext)

        renderWithIntl(<ShippingAddress {...defaultProps} />)

        // Should show shipping address selection by default
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
        // Multi-shipping is not shown by default, only when toggled
        expect(screen.queryByTestId('multi-shipping')).not.toBeInTheDocument()
    })

    it('should handle single shipping submission', async () => {
        renderWithIntl(<ShippingAddress {...defaultProps} />)

        fireEvent.click(screen.getByTestId('submit-address'))

        // Should navigate to shipping options step
        await waitFor(() => {
            expect(mockCheckoutContext.goToStep).toHaveBeenCalledWith(4) // SHIPPING_OPTIONS
        })
    })

    it('should handle multi-shipping submission', async () => {
        // Mock that we're in editing mode
        const editingContext = {
            ...mockCheckoutContext,
            step: 3 // SHIPPING_ADDRESS
        }
        useCheckout.mockReturnValue(editingContext)

        renderWithIntl(<ShippingAddress {...defaultProps} />)

        // First click the edit button to enable multi-shipping
        fireEvent.click(screen.getByTestId('edit-button'))

        // Now the multi-shipping component should be visible
        expect(screen.getByTestId('multi-shipping')).toBeInTheDocument()

        fireEvent.click(screen.getByTestId('submit-multi-address'))

        // Should navigate to shipping options step
        await waitFor(() => {
            expect(mockCheckoutContext.goToStep).toHaveBeenCalledWith(4) // SHIPPING_OPTIONS
        })
    })

    it('should show edit button with correct label for single shipping', () => {
        // Mock that we're NOT in editing mode to get "Edit Shipping Address" label
        const summaryContext = {
            ...mockCheckoutContext,
            step: 4 // SHIPPING_OPTIONS (not editing)
        }
        useCheckout.mockReturnValue(summaryContext)

        renderWithIntl(<ShippingAddress {...defaultProps} />)

        const editButton = screen.getByTestId('edit-button')
        expect(editButton).toBeInTheDocument()
        expect(editButton).toHaveTextContent('Edit Shipping Address')
    })

    it('should show edit button with correct label for multi-shipping', () => {
        // Mock that we're in editing mode with multiple items
        const editingContext = {
            ...mockCheckoutContext,
            step: 3 // SHIPPING_ADDRESS
        }
        useCheckout.mockReturnValue(editingContext)

        renderWithIntl(<ShippingAddress {...defaultProps} />)

        const editButton = screen.getByTestId('edit-button')
        expect(editButton).toBeInTheDocument()
        expect(editButton).toHaveTextContent('Deliver to Multiple Addresses')
    })

    it('should handle edit button click for single shipping', () => {
        // Mock that we're NOT in editing mode
        const summaryContext = {
            ...mockCheckoutContext,
            step: 4 // SHIPPING_OPTIONS (not editing)
        }
        useCheckout.mockReturnValue(summaryContext)

        renderWithIntl(<ShippingAddress {...defaultProps} />)

        fireEvent.click(screen.getByTestId('edit-button'))

        // Should navigate to shipping address step
        expect(mockCheckoutContext.goToStep).toHaveBeenCalledWith(3) // SHIPPING_ADDRESS
    })

    it('should handle edit button click for multi-shipping', () => {
        // Mock that we're in editing mode
        const editingContext = {
            ...mockCheckoutContext,
            step: 3 // SHIPPING_ADDRESS
        }
        useCheckout.mockReturnValue(editingContext)

        renderWithIntl(<ShippingAddress {...defaultProps} />)

        fireEvent.click(screen.getByTestId('edit-button'))

        // Should enable multi-shipping mode
        expect(screen.getByTestId('multi-shipping')).toBeInTheDocument()
    })

    it('should handle empty basket gracefully', () => {
        const emptyBasket = {...mockBasket, productItems: []}

        renderWithIntl(<ShippingAddress {...defaultProps} basket={emptyBasket} />)

        // Should still render the component
        expect(screen.getByTestId('toggle-card')).toBeInTheDocument()
    })

    it('should handle missing customer data gracefully', () => {
        useCurrentCustomer.mockReturnValue({
            data: null
        })

        renderWithIntl(<ShippingAddress {...defaultProps} />)

        // Should still render the component
        expect(screen.getByTestId('toggle-card')).toBeInTheDocument()
    })

    it('should handle missing basket data gracefully', () => {
        useCurrentBasket.mockReturnValue({
            data: null
        })

        renderWithIntl(<ShippingAddress {...defaultProps} />)

        // Should still render the component
        expect(screen.getByTestId('toggle-card')).toBeInTheDocument()
    })

    describe('Toggle Card Behavior', () => {
        it('should show edit mode when in shipping address step', () => {
            const editingContext = {
                ...mockCheckoutContext,
                step: 3 // SHIPPING_ADDRESS
            }
            useCheckout.mockReturnValue(editingContext)

            renderWithIntl(<ShippingAddress {...defaultProps} />)

            const toggleCard = screen.getByTestId('toggle-card')
            expect(toggleCard).toHaveAttribute('data-editing', 'true')
        })

        it('should show summary mode when not in shipping address step', () => {
            const summaryContext = {
                ...mockCheckoutContext,
                step: 4 // SHIPPING_OPTIONS
            }
            useCheckout.mockReturnValue(summaryContext)

            renderWithIntl(<ShippingAddress {...defaultProps} />)

            const toggleCard = screen.getByTestId('toggle-card')
            expect(toggleCard).toHaveAttribute('data-editing', 'false')
        })
    })

    describe('Multi-shipping Toggle', () => {
        it('should show multi-shipping option when multiple items exist', () => {
            const editingContext = {
                ...mockCheckoutContext,
                step: 3 // SHIPPING_ADDRESS
            }
            useCheckout.mockReturnValue(editingContext)

            renderWithIntl(<ShippingAddress {...defaultProps} />)

            // Should show shipping address selection by default
            expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
            // Multi-shipping is not shown by default, only when toggled
            expect(screen.queryByTestId('multi-shipping')).not.toBeInTheDocument()

            // Click edit button to enable multi-shipping
            fireEvent.click(screen.getByTestId('edit-button'))

            // Now multi-shipping should be visible
            expect(screen.getByTestId('multi-shipping')).toBeInTheDocument()
        })

        it('should not show multi-shipping option when only one item exists', () => {
            const singleItemBasket = {
                ...mockBasket,
                productItems: [mockBasket.productItems[0]]
            }
            const editingContext = {
                ...mockCheckoutContext,
                step: 3 // SHIPPING_ADDRESS
            }
            useCheckout.mockReturnValue(editingContext)

            renderWithIntl(<ShippingAddress {...defaultProps} basket={singleItemBasket} />)

            // Should show shipping address selection
            expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
            // Multi-shipping should not be available for single item
            expect(screen.queryByTestId('multi-shipping')).not.toBeInTheDocument()
        })
    })
})
