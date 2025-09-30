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
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast')

// Mock the new multiship and pickup hooks
jest.mock('@salesforce/retail-react-app/app/hooks/use-multiship')
jest.mock('@salesforce/retail-react-app/app/hooks/use-pickup-shipment')
jest.mock('@salesforce/retail-react-app/app/hooks/use-item-shipment-management')

// Mock the constants and getConfig with dynamic values for testing
let mockMultishipEnabled = true
let mockStoreLocatorEnabled = true

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn(() => ({
        app: {
            multishipEnabled: mockMultishipEnabled,
            storeLocatorEnabled: mockStoreLocatorEnabled
        }
    }))
}))

jest.mock('@salesforce/retail-react-app/app/constants', () => ({
    get DEFAULT_SHIPMENT_ID() {
        return 'me'
    },
    get STORE_LOCATOR_IS_ENABLED() {
        return mockStoreLocatorEnabled
    }
}))

// Helper function to set multishipEnabled for tests
const setMultishipEnabled = (enabled) => {
    mockMultishipEnabled = enabled
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {getConfig} = require('@salesforce/pwa-kit-runtime/utils/ssr-config')
    getConfig.mockReturnValue({
        app: {
            multishipEnabled: enabled,
            storeLocatorEnabled: mockStoreLocatorEnabled
        }
    })
}

// Helper function to set storeLocatorEnabled for tests
const setStoreLocatorEnabled = (enabled) => {
    mockStoreLocatorEnabled = enabled
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {getConfig} = require('@salesforce/pwa-kit-runtime/utils/ssr-config')
    getConfig.mockReturnValue({
        app: {
            multishipEnabled: mockMultishipEnabled,
            storeLocatorEnabled: enabled
        }
    })
}

// Mock mutation hooks to prevent QueryClient errors
const mockMutateAsync = jest.fn().mockResolvedValue({})
const mockCustomerMutateAsync = jest.fn().mockResolvedValue({})

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useShopperCustomersMutation: () => ({
            mutateAsync: mockCustomerMutateAsync
        }),
        useShopperBasketsMutation: () => ({
            mutateAsync: mockMutateAsync
        })
    }
})

// Mock the toggle card components
jest.mock('@salesforce/retail-react-app/app/components/toggle-card', () => {
    // eslint-disable-next-line react/prop-types
    const ToggleCard = ({children, editing, onEdit, editLabel, editAction, onEditActionClick}) => (
        <div data-testid="toggle-card" data-editing={editing ? 'true' : 'false'}>
            {!editing && (
                <button data-testid="edit-button" onClick={onEdit}>
                    {editLabel}
                </button>
            )}
            {editing && editAction && onEditActionClick && (
                <button data-testid="edit-action-button" onClick={onEditActionClick}>
                    {editAction}
                </button>
            )}
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
jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-multi-address',
    () => ({
        __esModule: true,
        default: function MockMultiShipping({onUnsavedGuestAddressesToggleWarning}) {
            const {
                useCheckout
                // eslint-disable-next-line @typescript-eslint/no-var-requires
            } = require('@salesforce/retail-react-app/app/pages/checkout/util/checkout-context')

            const {goToStep, STEPS} = useCheckout()

            // simulate calling the callback with true to trigger warning modal
            if (onUnsavedGuestAddressesToggleWarning) {
                onUnsavedGuestAddressesToggleWarning(true)
            }

            return (
                <div data-testid="multi-shipping" role="button" tabIndex={0}>
                    Mock Multi Shipping
                    <button
                        data-testid="submit-multi-address"
                        onClick={() => {
                            goToStep(STEPS.SHIPPING_OPTIONS)
                        }}
                    >
                        Submit Multi Address
                    </button>
                </div>
            )
        }
    })
)

// mock the SingleAddressToggleModal component
jest.mock('@salesforce/retail-react-app/app/components/single-address-toggle-modal', () => ({
    __esModule: true,
    default: function MockSingleAddressToggleModal({isOpen, onConfirm, onCancel, onClose}) {
        if (!isOpen) return null

        return (
            <div data-testid="single-address-toggle-modal" role="alertdialog">
                <div>Switch to one address?</div>
                <div>
                    If you switch to one address, the shipping addresses you added for the items
                    will be removed
                </div>
                <button data-testid="confirm-switch" onClick={onConfirm}>
                    Switch
                </button>
                <button data-testid="cancel-switch" onClick={onCancel}>
                    Cancel
                </button>
                <button data-testid="close-modal" onClick={onClose}>
                    Close
                </button>
            </div>
        )
    }
}))

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
            quantity: 2,
            itemId: 'item-1',
            shipmentId: 'me'
        },
        {
            productId: 'product-2',
            productName: 'Test Product 2',
            quantity: 1,
            itemId: 'item-2',
            shipmentId: 'me'
        }
    ],
    shipments: [
        {
            shipmentId: 'me',
            shippingMethod: {
                id: 'standard-shipping',
                c_storePickupEnabled: false
            },
            shippingAddress: {
                address1: '123 Test St',
                city: 'Test City',
                stateCode: 'CA',
                postalCode: '12345',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe'
            }
        }
    ]
}

const mockShowToast = jest.fn()

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
        // Reset multishipEnabled to default value for test isolation
        setMultishipEnabled(true)
        setStoreLocatorEnabled(true)

        mockCheckoutContext.goToStep.mockClear()
        mockShowToast.mockClear()
        mockMutateAsync.mockClear()
        mockCustomerMutateAsync.mockClear()
        useCurrentCustomer.mockReturnValue({
            data: mockCustomer
        })
        useCurrentBasket.mockReturnValue({
            data: mockBasket
        })
        useCheckout.mockReturnValue(mockCheckoutContext)

        // Mock useMultiship hook
        const useMultiship =
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require('@salesforce/retail-react-app/app/hooks/use-multiship').useMultiship
        useMultiship.mockReturnValue({
            findExistingDeliveryShipment: jest.fn().mockReturnValue(mockBasket.shipments[0]),
            removeEmptyShipments: jest.fn().mockResolvedValue()
        })

        // Mock useItemShipmentManagement hook
        const useItemShipmentManagement =
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require('@salesforce/retail-react-app/app/hooks/use-item-shipment-management').useItemShipmentManagement
        useItemShipmentManagement.mockReturnValue({
            updateItemsToDeliveryShipment: jest.fn().mockResolvedValue(mockBasket)
        })

        // Mock useToast hook
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const useToast = require('@salesforce/retail-react-app/app/hooks/use-toast').useToast
        useToast.mockReturnValue(mockShowToast)
    })

    afterEach(() => {
        jest.clearAllMocks()
        // Reset to default values
        mockMultishipEnabled = true
        mockStoreLocatorEnabled = true
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {getConfig} = require('@salesforce/pwa-kit-runtime/utils/ssr-config')
        getConfig.mockReturnValue({
            app: {
                multishipEnabled: mockMultishipEnabled,
                storeLocatorEnabled: mockStoreLocatorEnabled
            }
        })
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

        // First click the edit action button to enable multi-shipping
        fireEvent.click(screen.getByTestId('edit-action-button'))

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

    it('should show edit action button with correct label for multi-shipping when enabled', () => {
        // Mock that we're in editing mode with multiple items
        const editingContext = {
            ...mockCheckoutContext,
            step: 3 // SHIPPING_ADDRESS
        }
        useCheckout.mockReturnValue(editingContext)

        renderWithIntl(<ShippingAddress {...defaultProps} />)

        const editActionButton = screen.getByTestId('edit-action-button')
        expect(editActionButton).toBeInTheDocument()
        expect(editActionButton).toHaveTextContent('Ship to Multiple Addresses')
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

    it('should handle edit action button click for multi-shipping', () => {
        // Mock that we're in editing mode
        const editingContext = {
            ...mockCheckoutContext,
            step: 3 // SHIPPING_ADDRESS
        }
        useCheckout.mockReturnValue(editingContext)

        renderWithIntl(<ShippingAddress {...defaultProps} />)

        fireEvent.click(screen.getByTestId('edit-action-button'))

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

    it('should show toast error when address submission fails', async () => {
        // Mock the mutation to throw an error
        mockMutateAsync.mockRejectedValueOnce(new Error('Network error'))

        renderWithIntl(<ShippingAddress {...defaultProps} />)

        // Submit the address form
        fireEvent.click(screen.getByTestId('submit-address'))

        // Wait for the error to be handled
        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith({
                title: 'Something went wrong while updating the shipping address. Try again.',
                status: 'error'
            })
        })

        // Verify that goToStep was not called due to the error
        expect(mockCheckoutContext.goToStep).not.toHaveBeenCalled()
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

            // Click edit action button to enable multi-shipping
            fireEvent.click(screen.getByTestId('edit-action-button'))

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

            // Mock useCurrentBasket to return the single item basket
            useCurrentBasket.mockReturnValue({
                data: singleItemBasket
            })

            renderWithIntl(<ShippingAddress {...defaultProps} />)

            // Should show shipping address selection
            expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
            // Edit action button (Ship to Multiple Addresses) should not be rendered for single item
            expect(screen.queryByTestId('edit-action-button')).not.toBeInTheDocument()
        })
    })

    describe('multishipEnabled behavior', () => {
        describe('when multishipEnabled is true', () => {
            beforeEach(() => {
                setMultishipEnabled(true)
            })

            it('should show "Ship to Multiple Addresses" button when multishipEnabled is true', () => {
                // Mock that we're in editing mode with multiple items
                const editingContext = {
                    ...mockCheckoutContext,
                    step: 3 // SHIPPING_ADDRESS
                }
                useCheckout.mockReturnValue(editingContext)

                renderWithIntl(<ShippingAddress {...defaultProps} />)

                const editActionButton = screen.getByTestId('edit-action-button')
                expect(editActionButton).toBeInTheDocument()
                expect(editActionButton).toHaveTextContent('Ship to Multiple Addresses')
            })

            it('should handle "Ship to Multiple Addresses" button click to toggle multi-shipping', () => {
                // Mock that we're in editing mode
                const editingContext = {
                    ...mockCheckoutContext,
                    step: 3 // SHIPPING_ADDRESS
                }
                useCheckout.mockReturnValue(editingContext)

                renderWithIntl(<ShippingAddress {...defaultProps} />)

                const editActionButton = screen.getByTestId('edit-action-button')
                fireEvent.click(editActionButton)
                expect(screen.getByTestId('multi-shipping')).toBeInTheDocument()
            })
        })

        describe('when multishipEnabled is false', () => {
            beforeEach(() => {
                setMultishipEnabled(false)
            })

            it('should not show "Ship to Multiple Addresses" button when multishipEnabled is false', () => {
                const editingContext = {
                    ...mockCheckoutContext,
                    step: 3 // SHIPPING_ADDRESS
                }
                useCheckout.mockReturnValue(editingContext)

                renderWithIntl(<ShippingAddress {...defaultProps} />)

                expect(screen.queryByTestId('edit-action-button')).not.toBeInTheDocument()
            })

            it('should still show shipping address selection when multishipEnabled is false', () => {
                // Mock that we're in editing mode
                const editingContext = {
                    ...mockCheckoutContext,
                    step: 3 // SHIPPING_ADDRESS
                }
                useCheckout.mockReturnValue(editingContext)

                renderWithIntl(<ShippingAddress {...defaultProps} />)

                // Should still show shipping address selection
                expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
                // But no "Ship to Multiple Addresses" button
                expect(screen.queryByTestId('edit-action-button')).not.toBeInTheDocument()
            })
        })

        describe('common behavior regardless of multishipEnabled setting', () => {
            it('should show edit mode when in shipping address step', () => {
                setMultishipEnabled(true) // Test with enabled
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
                setMultishipEnabled(false) // Test with disabled
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
    })

    describe('Warning Modal for unsaved guest address after ship to single address toggle action', () => {
        const mockGuestCustomer = {
            customerId: 'guest-1',
            isGuest: true,
            addresses: []
        }

        beforeEach(() => {
            useCurrentCustomer.mockReturnValue({
                data: mockGuestCustomer
            })
        })

        it('should show warning modal when guest toggles from multi-ship to single address', () => {
            const editingContext = {
                ...mockCheckoutContext,
                step: 3
            }
            useCheckout.mockReturnValue(editingContext)

            renderWithIntl(<ShippingAddress {...defaultProps} customer={mockGuestCustomer} />)

            // Enable multi-shipping mode
            fireEvent.click(screen.getByTestId('edit-action-button'))
            expect(screen.getByTestId('multi-shipping')).toBeInTheDocument()

            // Toggle back to single address mode - show warning modal
            fireEvent.click(screen.getByTestId('edit-action-button'))

            // Modal should be shown
            expect(screen.getByTestId('single-address-toggle-modal')).toBeInTheDocument()
            expect(screen.getByText('Switch to one address?')).toBeInTheDocument()
            expect(
                screen.getByText(
                    'If you switch to one address, the shipping addresses you added for the items will be removed'
                )
            ).toBeInTheDocument()
        })

        it('should handle confirm action in warning modal', () => {
            const editingContext = {
                ...mockCheckoutContext,
                step: 3
            }
            useCheckout.mockReturnValue(editingContext)

            renderWithIntl(<ShippingAddress {...defaultProps} customer={mockGuestCustomer} />)

            // Enable multi-shipping mode
            fireEvent.click(screen.getByTestId('edit-action-button'))
            expect(screen.getByTestId('multi-shipping')).toBeInTheDocument()

            // Toggle back to single address mode - show warning modal
            fireEvent.click(screen.getByTestId('edit-action-button'))

            // Modal should be shown
            expect(screen.getByTestId('single-address-toggle-modal')).toBeInTheDocument()
            fireEvent.click(screen.getByTestId('confirm-switch'))

            // Modal should be closed and should be back to single address
            expect(screen.queryByTestId('single-address-toggle-modal')).not.toBeInTheDocument()
            expect(screen.queryByTestId('multi-shipping')).not.toBeInTheDocument()
        })

        it('should handle cancel action in warning modal', () => {
            const editingContext = {
                ...mockCheckoutContext,
                step: 3
            }
            useCheckout.mockReturnValue(editingContext)

            renderWithIntl(<ShippingAddress {...defaultProps} customer={mockGuestCustomer} />)

            fireEvent.click(screen.getByTestId('edit-action-button'))
            expect(screen.getByTestId('multi-shipping')).toBeInTheDocument()

            // toggle back to single address mode - show warning modal
            fireEvent.click(screen.getByTestId('edit-action-button'))

            // Modal should be shown
            expect(screen.getByTestId('single-address-toggle-modal')).toBeInTheDocument()
            fireEvent.click(screen.getByTestId('cancel-switch'))

            // Modal should be closed and should stay in multi-shipping
            expect(screen.queryByTestId('single-address-toggle-modal')).not.toBeInTheDocument()
            expect(screen.getByTestId('multi-shipping')).toBeInTheDocument()
        })

        it('should handle close action in warning modal', () => {
            const editingContext = {
                ...mockCheckoutContext,
                step: 3
            }
            useCheckout.mockReturnValue(editingContext)

            renderWithIntl(<ShippingAddress {...defaultProps} customer={mockGuestCustomer} />)

            // Enable multi-shipping mode
            fireEvent.click(screen.getByTestId('edit-action-button'))
            expect(screen.getByTestId('multi-shipping')).toBeInTheDocument()

            // Toggle back to single address mode - show warning modal
            fireEvent.click(screen.getByTestId('edit-action-button'))

            expect(screen.getByTestId('single-address-toggle-modal')).toBeInTheDocument()
            fireEvent.click(screen.getByTestId('close-modal'))

            // Modal should be closed and user stay in multi-shipping
            expect(screen.queryByTestId('single-address-toggle-modal')).not.toBeInTheDocument()
            expect(screen.getByTestId('multi-shipping')).toBeInTheDocument()
        })

        it('should not show warning modal for registered users', () => {
            const editingContext = {
                ...mockCheckoutContext,
                step: 3
            }
            useCheckout.mockReturnValue(editingContext)

            // registered customer
            useCurrentCustomer.mockReturnValue({
                data: mockCustomer
            })

            renderWithIntl(<ShippingAddress {...defaultProps} />)

            // multi-shipping mode
            fireEvent.click(screen.getByTestId('edit-action-button'))
            expect(screen.getByTestId('multi-shipping')).toBeInTheDocument()
            // toggle back to single address mode
            fireEvent.click(screen.getByTestId('edit-action-button'))
            // Modal not shown for registered users
            expect(screen.queryByTestId('single-address-toggle-modal')).not.toBeInTheDocument()
        })
    })
})
