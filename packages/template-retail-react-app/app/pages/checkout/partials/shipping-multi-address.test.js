/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen, fireEvent, waitFor} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import ShippingMultiAddress from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-multi-address'
import {useProducts} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {CurrencyProvider} from '@salesforce/retail-react-app/app/contexts'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import userEvent from '@testing-library/user-event'

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useProducts: jest.fn(),
    useShopperCustomersMutation: jest.fn(() => ({
        mutateAsync: jest.fn().mockResolvedValue({
            addressId: 'addr-new',
            firstName: 'Alice',
            lastName: 'Wonder',
            address1: '789 New St',
            city: 'New City',
            stateCode: 'TX',
            postalCode: '55555'
        })
    })),
    useShopperBasketsMutation: jest.fn(() => ({
        mutateAsync: jest.fn().mockResolvedValue({})
    })),
    useShippingMethodsForShipment: jest.fn(() => ({
        refetch: jest.fn()
    }))
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-multiship')
jest.mock('@salesforce/retail-react-app/app/pages/checkout/util/checkout-context')
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast')
jest.mock('@salesforce/retail-react-app/app/hooks/use-pickup-shipment', () => ({
    usePickupShipment: jest.fn(() => ({
        isCurrentShippingMethodPickup: jest.fn(() => false)
    }))
}))

jest.mock('@salesforce/retail-react-app/app/utils/image-groups-utils', () => ({
    findImageGroupBy: jest.fn((imageGroups) => {
        if (
            imageGroups &&
            imageGroups[0]?.images?.[0]?.disBaseLink === 'https://test-image-1.jpg'
        ) {
            return {images: [{disBaseLink: 'https://test-image-1.jpg'}]}
        }
        if (
            imageGroups &&
            imageGroups[0]?.images?.[0]?.disBaseLink === 'https://test-image-2.jpg'
        ) {
            return {images: [{disBaseLink: 'https://test-image-2.jpg'}]}
        }
        return {images: [{disBaseLink: 'https://test-image.jpg'}]}
    })
}))

const mockGoToStep = jest.fn()
const mockShowToast = jest.fn()

beforeEach(() => {
    jest.clearAllMocks()

    useCheckout.mockReturnValue({
        STEPS: {
            SHIPPING_OPTIONS: 'SHIPPING_OPTIONS'
        },
        goToStep: mockGoToStep
    })

    useToast.mockReturnValue(mockShowToast)

    useMultiship.mockReturnValue({
        findDeliveryShipmentWithSameAddress: jest.fn(),
        findUnusedDeliveryShipment: jest.fn(),
        createNewDeliveryShipmentWithAddress: jest.fn(),
        updateDeliveryAddressForShipment: jest.fn(),
        moveItemsToDeliveryShipment: jest.fn(),
        removeEmptyShipments: jest.fn()
    })
})

const mockBasket = {
    productItems: [
        {
            itemId: 'item-1',
            productId: 'product-1',
            productName: 'Test Product 1',
            quantity: 2,
            priceAfterItemDiscount: 29.99,
            variationValues: {color: 'red', size: 'M'}
        },
        {
            itemId: 'item-2',
            productId: 'product-2',
            productName: 'Test Product 2',
            quantity: 1,
            priceAfterItemDiscount: 19.99,
            variationValues: {color: 'blue', size: 'L'}
        }
    ],
    currency: 'USD'
}

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
            postalCode: '12345',
            preferred: false
        },
        {
            addressId: 'addr-2',
            firstName: 'Jane',
            lastName: 'Smith',
            address1: '456 Another St',
            city: 'Another City',
            stateCode: 'NY',
            postalCode: '67890',
            preferred: true
        }
    ]
}

const mockProducts = {
    data: [
        {
            id: 'product-1',
            name: 'Test Product 1',
            imageGroups: [
                {
                    viewType: 'small',
                    images: [{disBaseLink: 'https://test-image-1.jpg'}]
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Color',
                    values: [{value: 'red', name: 'Red'}]
                },
                {
                    id: 'size',
                    name: 'Size',
                    values: [{value: 'M', name: 'Medium'}]
                }
            ]
        },
        {
            id: 'product-2',
            name: 'Test Product 2',
            imageGroups: [
                {
                    viewType: 'small',
                    images: [{disBaseLink: 'https://test-image-2.jpg'}]
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Color',
                    values: [{value: 'blue', name: 'Blue'}]
                },
                {
                    id: 'size',
                    name: 'Size',
                    values: [{value: 'L', name: 'Large'}]
                }
            ]
        }
    ]
}

const defaultProps = {
    basket: mockBasket,
    onSubmit: jest.fn(),
    submitButtonLabel: {
        defaultMessage: 'Continue',
        id: 'checkout.button.continue'
    },
    addNewAddressLabel: {
        defaultMessage: '+ Add New Address',
        id: 'shipping_address.button.add_new_address'
    },
    noItemsInBasketMessage: {
        defaultMessage: 'No items in basket.',
        id: 'shipping_address.message.no_items_in_basket'
    },
    deliveryAddressLabel: {
        defaultMessage: 'Delivery Address',
        id: 'shipping_address.label.delivery_address'
    }
}

const renderWithIntl = (component) => {
    return render(
        <CurrencyProvider currency="USD">
            <IntlProvider locale="en">{component}</IntlProvider>
        </CurrencyProvider>
    )
}

describe('ShippingMultiAddress', () => {
    beforeEach(() => {
        useProducts.mockReturnValue({
            data: {
                'product-1': mockProducts.data[0],
                'product-2': mockProducts.data[1]
            },
            isLoading: false,
            error: null
        })
        useCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            isLoading: false
        })
        useCurrentBasket.mockReturnValue({
            data: mockBasket
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('should render empty state when no items in basket', () => {
        const emptyBasket = {...mockBasket, productItems: []}
        renderWithIntl(<ShippingMultiAddress {...defaultProps} basket={emptyBasket} />)

        expect(screen.getByText('No items in basket.')).toBeInTheDocument()
    })

    test('should render properly with all essential elements', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        // assert all of the element that is supposed to be rendered on first render
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
        expect(screen.getByText('Quantity: 2')).toBeInTheDocument()
        expect(screen.getByText('Quantity: 1')).toBeInTheDocument()

        // Check delivery address sections
        const deliveryAddressLabels = screen.getAllByText('Delivery Address')
        expect(deliveryAddressLabels).toHaveLength(2)

        // Check product images
        const images = screen.getAllByAltText('Product image for Test Product 1')
        expect(images).toHaveLength(1)
        expect(images[0]).toHaveAttribute('src', 'https://test-image-1.jpg')

        // Check variation attributes
        expect(screen.getByText('Color: Red')).toBeInTheDocument()
        expect(screen.getByText('Size: Medium')).toBeInTheDocument()
        expect(screen.getByText('Color: Blue')).toBeInTheDocument()
        expect(screen.getByText('Size: Large')).toBeInTheDocument()

        // Check product prices
        const priceElements = screen.getAllByLabelText(/current price/)
        expect(priceElements).toHaveLength(2)
        priceElements.forEach((element) => {
            expect(element.textContent).toMatch(/\$\d+\.\d{2}/)
        })

        // Check continue button
        expect(screen.getByText('Continue')).toBeInTheDocument()

        // Check address dropdowns
        const dropdowns = screen.getAllByRole('combobox', {hidden: true})
        expect(dropdowns.length).toBeGreaterThan(0)
    })

    test('should call onSubmit when continue button is clicked', async () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        fireEvent.click(screen.getByText('Continue'))
        await waitFor(() => {
            expect(screen.queryByText('Setting up shipments...')).toBeInTheDocument()
        })
    })

    test('should handle empty product data gracefully', () => {
        useProducts.mockReturnValue({
            data: null
        })

        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
    })

    test('should render with custom submit button label', () => {
        const customProps = {
            ...defaultProps,
            submitButtonLabel: {
                defaultMessage: 'Proceed to Shipping',
                id: 'checkout.button.proceed_to_shipping'
            }
        }

        renderWithIntl(<ShippingMultiAddress {...customProps} />)

        expect(screen.getByText('Proceed to Shipping')).toBeInTheDocument()
    })

    describe('Add New Address Functionality', () => {
        test('should show "Add New Address" button', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Check that "Add New Address" buttons are present (should be 2, one for each item)
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            expect(addNewAddressButtons).toHaveLength(2)
        })

        test('should show address form when "Add New Address" button is clicked', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Get all "Add New Address" buttons and click the first one
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            expect(addNewAddressButtons).toHaveLength(2) // Should have 2 buttons (one for each item)

            fireEvent.click(addNewAddressButtons[0])

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByTestId('address-form')).toBeInTheDocument()
            })
        })

        test('should show Save and Cancel buttons in address form', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Get all "Add New Address" buttons and click the first one
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            // Wait for the form to appear and check for buttons
            await waitFor(() => {
                expect(screen.getByTestId('address-form')).toBeInTheDocument()
                expect(screen.getByText('Save')).toBeInTheDocument()
                expect(screen.getByText('Cancel')).toBeInTheDocument()
            })
        })

        test('should hide address form when Cancel button is clicked', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Get all "Add New Address" buttons and click the first one
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByTestId('address-form')).toBeInTheDocument()
            })

            // Click Cancel button
            fireEvent.click(screen.getByText('Cancel'))

            // Wait for the form to disappear
            await waitFor(() => {
                expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()
            })
        })

        test('should hide form when an existing address is selected', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Get all "Add New Address" buttons and click the first one
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByTestId('address-form')).toBeInTheDocument()
            })

            // Select an existing address from dropdown
            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]
            fireEvent.change(firstSelect, {target: {value: 'addr-2'}})

            // Wait for the form to disappear
            await waitFor(() => {
                expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()
            })

            // Check that the dropdown shows the selected address
            expect(firstSelect).toHaveValue('addr-2')
        })

        test('should automatically select preferred address when available', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Check that the dropdowns are automatically populated with the preferred address
            const selectElements = screen.getAllByRole('combobox')
            expect(selectElements).toHaveLength(2) // Should have 2 dropdowns (one for each item)

            // Check that both dropdowns show the preferred address as selected (addr-2 has preferred: true)
            const firstSelect = selectElements[0]
            expect(firstSelect).toHaveValue('addr-2') // Preferred address should be selected by default

            // Check that the second dropdown also shows the preferred address as selected
            const secondSelect = selectElements[1]
            expect(secondSelect).toHaveValue('addr-2') // Preferred address should be selected by default
        })

        test('should automatically select first address when no preferred address exists', () => {
            // Mock customer with no preferred addresses
            useCurrentCustomer.mockReturnValue({
                data: {
                    customerId: 'customer-1',
                    addresses: [
                        {
                            addressId: 'addr-1',
                            firstName: 'John',
                            lastName: 'Doe',
                            address1: '123 Test St',
                            city: 'Test City',
                            stateCode: 'CA',
                            postalCode: '12345',
                            preferred: false
                        },
                        {
                            addressId: 'addr-2',
                            firstName: 'Jane',
                            lastName: 'Smith',
                            address1: '456 Another St',
                            city: 'Another City',
                            stateCode: 'NY',
                            postalCode: '67890',
                            preferred: false
                        }
                    ]
                },
                isLoading: false
            })

            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Check that the dropdowns are automatically populated with the first address
            const selectElements = screen.getAllByRole('combobox')
            expect(selectElements).toHaveLength(2) // Should have 2 dropdowns (one for each item)

            // Check that both dropdowns show the first address as selected
            const firstSelect = selectElements[0]
            expect(firstSelect).toHaveValue('addr-1') // First address should be selected by default

            // Check that the second dropdown also shows the first address as selected
            const secondSelect = selectElements[1]
            expect(secondSelect).toHaveValue('addr-1') // First address should be selected by default

            // Check that dropdowns are enabled when addresses are available
            expect(firstSelect).toBeEnabled()
            expect(secondSelect).toBeEnabled()
        })

        test('should show "No Address Available" when no addresses exist', () => {
            // Mock customer with no addresses
            useCurrentCustomer.mockReturnValue({
                data: {
                    customerId: 'customer-1',
                    addresses: []
                },
                isLoading: false
            })

            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Check that "No Address Available" is shown in the dropdown
            const selectElements = screen.getAllByRole('combobox')
            expect(selectElements).toHaveLength(2) // Should have 2 dropdowns (one for each item)

            // Check that the first dropdown shows "No Address Available"
            const firstSelect = selectElements[0]
            expect(firstSelect).toHaveTextContent('No Address Available')

            // Check that the second dropdown also shows "No Address Available"
            const secondSelect = selectElements[1]
            expect(secondSelect).toHaveTextContent('No Address Available')

            // Check that dropdowns are disabled when no addresses are available
            expect(firstSelect).toBeDisabled()
            expect(secondSelect).toBeDisabled()

            // Verify that "Add New Address" buttons are still available
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            expect(addNewAddressButtons).toHaveLength(2)
        })

        test('should show loading state when customer data is loading', () => {
            // Mock customer loading state
            useCurrentCustomer.mockReturnValue({
                data: null,
                isLoading: true
            })

            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Check that main content is not displayed during loading
            expect(screen.queryByText('Test Product 1')).not.toBeInTheDocument()
            expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument()
            expect(screen.queryByText('+ Add New Address')).not.toBeInTheDocument()
        })

        test('should show guest user message when customer is a guest', () => {
            // Mock guest customer
            useCurrentCustomer.mockReturnValue({
                data: {
                    customerId: 'guest-1',
                    isGuest: true,
                    addresses: []
                },
                isLoading: false
            })

            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Check that guest user message is displayed
            expect(
                screen.getByText(
                    'Guest users cannot use multi-address shipping. Please sign in to continue.'
                )
            ).toBeInTheDocument()
        })

        test('should handle customer data loading and then rendering', async () => {
            // Test loading state
            useCurrentCustomer.mockReturnValue({
                data: null,
                isLoading: true
            })

            const {unmount} = renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Check that main content is not displayed during loading
            expect(screen.queryByText('Test Product 1')).not.toBeInTheDocument()
            expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument()

            // Clean up
            unmount()

            // Test loaded state
            useCurrentCustomer.mockReturnValue({
                data: mockCustomer,
                isLoading: false
            })

            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Check that normal UI is displayed after loading
            expect(screen.getByText('Test Product 1')).toBeInTheDocument()
            expect(screen.getByText('Test Product 2')).toBeInTheDocument()
            expect(screen.getAllByText('+ Add New Address')).toHaveLength(2)
        })
    })

    describe('Continue to Shipping Method Button', () => {
        test('should be enabled when no address forms are open', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const continueButton = screen.getByText('Continue')
            expect(continueButton).toBeInTheDocument()

            // Click the button to verify it's functional
            fireEvent.click(continueButton)
            await waitFor(() => {
                expect(screen.queryByText('Setting up shipments...')).toBeInTheDocument()
            })
        })

        test('should be disabled when "Add New Address" is selected', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Click "Add New Address" button
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByTestId('address-form')).toBeInTheDocument()
            })

            // Try to click the button (should not call onSubmit)
            const continueButton = screen.getByText('Continue')
            fireEvent.click(continueButton)
            await waitFor(() => {
                expect(screen.queryByText('Setting up shipments...')).not.toBeInTheDocument()
            })
        })

        test('should be re-enabled when address form is cancelled', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Click "Add New Address" button
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByTestId('address-form')).toBeInTheDocument()
            })

            // Try to click the button (should not call onSubmit)
            const continueButton = screen.getByText('Continue')
            fireEvent.click(continueButton)
            await waitFor(() => {
                expect(screen.queryByText('Setting up shipments...')).not.toBeInTheDocument()
            })

            // Click Cancel button
            fireEvent.click(screen.getByText('Cancel'))

            // Wait for the form to disappear
            await waitFor(() => {
                expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()
            })

            // Button should now be enabled
            fireEvent.click(continueButton)
            await waitFor(() => {
                expect(screen.queryByText('Setting up shipments...')).toBeInTheDocument()
            })
        })

        test('should be re-enabled when address form is saved', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Click "Add New Address" button
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByTestId('address-form')).toBeInTheDocument()
            })

            // Try to click the button (should not call onSubmit)
            const continueButton = screen.getByText('Continue')
            fireEvent.click(continueButton)
            await waitFor(() => {
                expect(screen.queryByText('Setting up shipments...')).not.toBeInTheDocument()
            })

            // Fill out the form
            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'John'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Doe'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1234567890'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '123 Test St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'Test City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'TX'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '12345'}})

            // Click Save button
            fireEvent.click(screen.getByText('Save'))

            // Wait for the form to disappear
            await waitFor(() => {
                expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()
            })

            // Button should now be enabled
            fireEvent.click(continueButton)
            await waitFor(() => {
                expect(screen.queryByText('Setting up shipments...')).toBeInTheDocument()
            })
        })

        test('should handle mixed state - some forms open, some closed', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Click "Add New Address" button for first product
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            // Wait for first form to appear
            await waitFor(() => {
                expect(screen.getByTestId('address-form')).toBeInTheDocument()
            })

            // Select existing address for second product
            const selectElements = screen.getAllByRole('combobox')
            fireEvent.change(selectElements[1], {target: {value: 'addr-2'}})

            // Try to click the button (should not call onSubmit)
            const continueButton = screen.getByText('Continue')
            fireEvent.click(continueButton)
            await waitFor(() => {
                expect(screen.queryByText('Setting up shipments...')).not.toBeInTheDocument()
            })

            // Cancel the first form
            fireEvent.click(screen.getByText('Cancel'))

            // Wait for form to disappear
            await waitFor(() => {
                expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()
            })

            // Button should now be enabled
            fireEvent.click(continueButton)
            await waitFor(() => {
                expect(screen.queryByText('Setting up shipments...')).toBeInTheDocument()
            })
        })
        test('should be disabled when no addresses are selected for any product', () => {
            // Mock customer with no addresses
            useCurrentCustomer.mockReturnValue({
                data: {...mockCustomer, addresses: []},
                isLoading: false
            })

            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const continueButton = screen.getByTestId('continue-to-shipping-button')
            expect(continueButton).toBeDisabled()

            // Clicking should not trigger the loading state
            fireEvent.click(continueButton)
            expect(screen.queryByText('Setting up shipments...')).not.toBeInTheDocument()
        })

        test('should be disabled when add new address form is open', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            await waitFor(() => {
                expect(screen.getByTestId('address-form')).toBeInTheDocument()
            })

            const continueButton = screen.getByTestId('continue-to-shipping-button')
            expect(continueButton).toBeDisabled()

            // Clicking should not trigger the loading state
            fireEvent.click(continueButton)
            expect(screen.queryByText('Setting up shipments...')).not.toBeInTheDocument()
        })

        test('should be enabled when all products have an address asscoiated with them in multiship view', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)
            const continueButton = screen.getByTestId('continue-to-shipping-button')
            expect(continueButton).toBeEnabled()
        })
    })
})

describe('ShippingMultiAddress - handleSubmit', () => {
    let mockFindDeliveryShipmentWithSameAddress
    let mockFindUnusedDeliveryShipment
    let mockCreateNewDeliveryShipmentWithAddress
    let mockUpdateDeliveryAddressForShipment
    let mockMoveItemsToDeliveryShipment
    let mockRemoveEmptyShipments

    const mockBasket = {
        basketId: 'test-basket-123',
        productItems: [
            {
                itemId: 'item-1',
                productId: 'prod-1',
                productName: 'Test Product 1',
                quantity: 1,
                shipmentId: 'me'
            },
            {
                itemId: 'item-2',
                productId: 'prod-2',
                productName: 'Test Product 2',
                quantity: 2,
                shipmentId: 'me'
            }
        ],
        shipments: [
            {
                shipmentId: 'me',
                shippingAddress: {}
            }
        ]
    }

    const mockAddresses = [
        {
            addressId: 'addr-1',
            firstName: 'John',
            lastName: 'Doe',
            address1: '123 Main St',
            city: 'Boston',
            stateCode: 'MA',
            postalCode: '02101'
        },
        {
            addressId: 'addr-2',
            firstName: 'Jane',
            lastName: 'Smith',
            address1: '456 Oak Ave',
            city: 'Cambridge',
            stateCode: 'MA',
            postalCode: '02139'
        }
    ]

    beforeEach(() => {
        mockFindDeliveryShipmentWithSameAddress = jest.fn().mockReturnValue(null)
        mockFindUnusedDeliveryShipment = jest.fn().mockReturnValue(null)
        mockCreateNewDeliveryShipmentWithAddress = jest.fn().mockResolvedValue('new-shipment-1')
        mockUpdateDeliveryAddressForShipment = jest.fn().mockResolvedValue()
        mockMoveItemsToDeliveryShipment = jest.fn().mockResolvedValue({
            basketId: 'test-basket-123',
            // Return updated basket
            productItems: mockBasket.productItems,
            shipments: mockBasket.shipments
        })
        mockRemoveEmptyShipments = jest.fn().mockResolvedValue()

        useMultiship.mockReturnValue({
            findDeliveryShipmentWithSameAddress: mockFindDeliveryShipmentWithSameAddress,
            findUnusedDeliveryShipment: mockFindUnusedDeliveryShipment,
            createNewDeliveryShipmentWithAddress: mockCreateNewDeliveryShipmentWithAddress,
            updateDeliveryAddressForShipment: mockUpdateDeliveryAddressForShipment,
            moveItemsToDeliveryShipment: mockMoveItemsToDeliveryShipment,
            removeEmptyShipments: mockRemoveEmptyShipments
        })

        useCurrentCustomer.mockReturnValue({
            data: {
                customerId: 'test-customer',
                addresses: mockAddresses
            },
            refetch: jest.fn(),
            isLoading: false
        })
    })

    test('should handle successful submission with items going to different addresses', async () => {
        const user = userEvent.setup()

        renderWithIntl(<ShippingMultiAddress {...defaultProps} basket={mockBasket} />)

        // Select different addresses for each item
        const selects = screen.getAllByRole('combobox')
        await user.selectOptions(selects[0], 'addr-1') // First item to address 1
        await user.selectOptions(selects[1], 'addr-2') // Second item to address 2

        // Click continue button
        const continueButton = screen.getByTestId('continue-to-shipping-button')
        await user.click(continueButton)

        await waitFor(() => {
            // Should create two new shipments (one for each address)
            expect(mockCreateNewDeliveryShipmentWithAddress).toHaveBeenCalledTimes(2)
            expect(mockCreateNewDeliveryShipmentWithAddress).toHaveBeenCalledWith(
                mockBasket,
                mockAddresses[0]
            )
            expect(mockCreateNewDeliveryShipmentWithAddress).toHaveBeenCalledWith(
                mockBasket,
                mockAddresses[1]
            )

            // Should move items to their respective shipments
            expect(mockMoveItemsToDeliveryShipment).toHaveBeenCalledTimes(2)

            // Should remove empty shipments
            expect(mockRemoveEmptyShipments).toHaveBeenCalled()

            // Should navigate to next step
            expect(mockGoToStep).toHaveBeenCalledWith('SHIPPING_OPTIONS')
        })
    })

    test('should reuse existing shipment with same address', async () => {
        // Mock that a shipment already exists for address 1
        mockFindDeliveryShipmentWithSameAddress.mockImplementation((basket, address) => {
            if (address.addressId === 'addr-1') {
                return 'existing-shipment-1'
            }
            return null
        })

        const user = userEvent.setup()

        renderWithIntl(<ShippingMultiAddress {...defaultProps} basket={mockBasket} />)

        // Select same address for both items
        const selects = screen.getAllByRole('combobox')
        await user.selectOptions(selects[0], 'addr-1')
        await user.selectOptions(selects[1], 'addr-1')

        const continueButton = screen.getByTestId('continue-to-shipping-button')
        await user.click(continueButton)

        await waitFor(() => {
            // Should NOT create new shipment since one exists
            expect(mockCreateNewDeliveryShipmentWithAddress).not.toHaveBeenCalled()

            // Should move items to existing shipment
            expect(mockMoveItemsToDeliveryShipment).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({itemId: 'item-1'}),
                    expect.objectContaining({itemId: 'item-2'})
                ]),
                'existing-shipment-1'
            )
        })
    })

    test('should handle errors gracefully', async () => {
        // Mock an error during shipment creation
        mockCreateNewDeliveryShipmentWithAddress.mockRejectedValue(
            new Error('Failed to create shipment')
        )

        const user = userEvent.setup()

        renderWithIntl(<ShippingMultiAddress {...defaultProps} basket={mockBasket} />)

        const selects = screen.getAllByRole('combobox')
        await user.selectOptions(selects[0], 'addr-1')

        const continueButton = screen.getByTestId('continue-to-shipping-button')
        await user.click(continueButton)

        await waitFor(() => {
            // Should show error toast
            expect(mockShowToast).toHaveBeenCalledWith({
                title: expect.stringContaining('Error setting up shipments'),
                status: 'error'
            })

            // Should NOT navigate to next step
            expect(mockGoToStep).not.toHaveBeenCalled()
        })
    })

    test('should not move items that are already in correct shipment', async () => {
        // Mock items already in correct shipments
        const basketWithExistingShipments = {
            ...mockBasket,
            productItems: [
                {
                    ...mockBasket.productItems[0],
                    shipmentId: 'existing-shipment-1'
                },
                {
                    ...mockBasket.productItems[1],
                    shipmentId: 'me'
                }
            ]
        }

        mockFindDeliveryShipmentWithSameAddress.mockImplementation((basket, address) => {
            if (address.addressId === 'addr-1') {
                return 'existing-shipment-1'
            }
            return null
        })

        const user = userEvent.setup()

        renderWithIntl(
            <ShippingMultiAddress {...defaultProps} basket={basketWithExistingShipments} />
        )

        const selects = screen.getAllByRole('combobox')
        await user.selectOptions(selects[0], 'addr-1') // Item already in this shipment
        await user.selectOptions(selects[1], 'addr-2') // Item needs to move

        const continueButton = screen.getByTestId('continue-to-shipping-button')
        await user.click(continueButton)

        await waitFor(() => {
            // Should only move the second item
            expect(mockMoveItemsToDeliveryShipment).toHaveBeenCalledTimes(1)
            expect(mockMoveItemsToDeliveryShipment).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({itemId: 'item-2'})]),
                expect.any(String)
            )
        })
    })

    test('should use first address as default if no address selected', async () => {
        const user = userEvent.setup()

        renderWithIntl(<ShippingMultiAddress {...defaultProps} basket={mockBasket} />)

        // Don't select any addresses, just click continue
        const continueButton = screen.getByTestId('continue-to-shipping-button')
        await user.click(continueButton)

        await waitFor(() => {
            // Should use first address for all items
            expect(mockCreateNewDeliveryShipmentWithAddress).toHaveBeenCalledWith(
                mockBasket,
                mockAddresses[0] // First address as default
            )
        })
    })

    test('should reuse unused delivery shipment when available', async () => {
        // Mock that there's an unused shipment available only for the first call
        mockFindUnusedDeliveryShipment
            .mockReturnValueOnce('unused-shipment-1')
            .mockReturnValueOnce(null) // No more unused shipments

        const user = userEvent.setup()

        renderWithIntl(<ShippingMultiAddress {...defaultProps} basket={mockBasket} />)

        // Select different addresses for each item
        const selects = screen.getAllByRole('combobox')
        await user.selectOptions(selects[0], 'addr-1')
        await user.selectOptions(selects[1], 'addr-2')

        const continueButton = screen.getByTestId('continue-to-shipping-button')
        await user.click(continueButton)

        await waitFor(() => {
            // Should find unused shipment
            expect(mockFindUnusedDeliveryShipment).toHaveBeenCalled()

            // Should update the unused shipment's address instead of creating new
            expect(mockUpdateDeliveryAddressForShipment).toHaveBeenCalledWith(
                'unused-shipment-1',
                mockAddresses[0]
            )

            // Should only create one new shipment (for the second address)
            expect(mockCreateNewDeliveryShipmentWithAddress).toHaveBeenCalledTimes(1)
            expect(mockCreateNewDeliveryShipmentWithAddress).toHaveBeenCalledWith(
                mockBasket,
                mockAddresses[1]
            )
        })
    })

    test('should exclude already assigned delivery shipments when finding unused ones', async () => {
        // Mock scenario where multiple items go to different addresses
        mockFindUnusedDeliveryShipment.mockImplementation((basket, excludedShipmentIds) => {
            // First call should have empty or null values
            if (!excludedShipmentIds || excludedShipmentIds.filter((id) => id).length === 0) {
                return 'unused-shipment-1'
            }
            // Second call should exclude the first unused shipment
            if (excludedShipmentIds.includes('unused-shipment-1')) {
                return 'unused-shipment-2'
            }
            return null
        })

        // Need to return different shipment IDs for createNewDeliveryShipmentWithAddress
        mockCreateNewDeliveryShipmentWithAddress
            .mockResolvedValueOnce('new-shipment-1')
            .mockResolvedValueOnce('new-shipment-2')

        const user = userEvent.setup()

        renderWithIntl(<ShippingMultiAddress {...defaultProps} basket={mockBasket} />)

        const selects = screen.getAllByRole('combobox')
        await user.selectOptions(selects[0], 'addr-1')
        await user.selectOptions(selects[1], 'addr-2')

        const continueButton = screen.getByTestId('continue-to-shipping-button')
        await user.click(continueButton)

        await waitFor(() => {
            // Should be called twice
            expect(mockFindUnusedDeliveryShipment).toHaveBeenCalledTimes(2)

            // First call should have null values in the array (no shipments assigned yet)
            expect(mockFindUnusedDeliveryShipment).toHaveBeenNthCalledWith(
                1,
                mockBasket,
                expect.arrayContaining([null]) // Initial state has null values
            )

            // Second call should exclude the first assigned shipment
            expect(mockFindUnusedDeliveryShipment).toHaveBeenNthCalledWith(
                2,
                mockBasket,
                expect.arrayContaining(['unused-shipment-1'])
            )

            // Should update both unused shipments
            expect(mockUpdateDeliveryAddressForShipment).toHaveBeenCalledTimes(2)
        })
    })
})
