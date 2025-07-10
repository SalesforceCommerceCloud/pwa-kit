/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import ShippingAddress from './shipping-address'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

// Mock the hooks
jest.mock('@salesforce/retail-react-app/app/pages/checkout/util/checkout-context')
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer')
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')

// Mock the toggle card components
jest.mock('@salesforce/retail-react-app/app/components/toggle-card', () => ({
    ToggleCard: ({children, editing, onEdit, editLabel}) => (
        <div data-testid="toggle-card" data-editing={editing}>
            <button onClick={onEdit} data-testid="edit-button">
                {editLabel}
            </button>
            {children}
        </div>
    ),
    ToggleCardEdit: ({children}) => (
        <div data-testid="toggle-card-edit">{children}</div>
    ),
    ToggleCardSummary: ({children}) => (
        <div data-testid="toggle-card-summary">{children}</div>
    )
}))

// Mock the shipping address selection component
jest.mock('@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address-selection', () => {
    return function MockShippingAddressSelection({onSubmit}) {
        return (
            <div data-testid="shipping-address-selection">
                <button onClick={onSubmit} data-testid="submit-address">
                    Submit Address
                </button>
            </div>
        )
    }
})

// Mock the multi-shipping component
jest.mock('./shipping-multi-address', () => {
    return function MockMultiShipping({onSubmit}) {
        return (
            <div data-testid="multi-shipping">
                <button onClick={onSubmit} data-testid="submit-multi-shipping">
                    Submit Multi Shipping
                </button>
            </div>
        )
    }
})

const mockCustomer = {
    customerId: 'customer-1',
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
    return render(
        <IntlProvider locale="en">
            {component}
        </IntlProvider>
    )
}

describe('ShippingAddress', () => {
    beforeEach(() => {
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
        
        // Should show both single and multi-shipping options
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
        expect(screen.getByTestId('multi-shipping')).toBeInTheDocument()
    })

    it('should handle single shipping submission', () => {
        renderWithIntl(<ShippingAddress {...defaultProps} />)
        
        fireEvent.click(screen.getByTestId('submit-address'))
        
        // Should navigate to shipping options step
        expect(mockCheckoutContext.goToStep).toHaveBeenCalledWith(4) // SHIPPING_OPTIONS
    })

    it('should handle multi-shipping submission', () => {
        // Mock that we're in editing mode
        const editingContext = {
            ...mockCheckoutContext,
            step: 3 // SHIPPING_ADDRESS
        }
        useCheckout.mockReturnValue(editingContext)
        
        renderWithIntl(<ShippingAddress {...defaultProps} />)
        
        fireEvent.click(screen.getByTestId('submit-multi-shipping'))
        
        // Should navigate to shipping options step
        expect(mockCheckoutContext.goToStep).toHaveBeenCalledWith(4) // SHIPPING_OPTIONS
    })

    it('should show edit button with correct label for single shipping', () => {
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
        
        // Should navigate to shipping address step
        expect(mockCheckoutContext.goToStep).toHaveBeenCalledWith(3) // SHIPPING_ADDRESS
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
            
            // Should show both single and multi-shipping options
            expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
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
            
            // Should only show single shipping option
            expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
            expect(screen.queryByTestId('multi-shipping')).not.toBeInTheDocument()
        })
    })
}) 