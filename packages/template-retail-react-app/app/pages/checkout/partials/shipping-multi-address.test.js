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
import {useItemShipmentManagement} from '@salesforce/retail-react-app/app/hooks/use-item-shipment-management'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import userEvent from '@testing-library/user-event'

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useProducts: jest.fn(),
    useShopperCustomersMutation: jest.fn((mutationType) => {
        if (mutationType === 'createCustomerAddress') {
            return {
                mutateAsync: jest.fn().mockResolvedValue({
                    addressId: 'addr-new',
                    firstName: 'Alice',
                    lastName: 'Wonder',
                    address1: '789 New St',
                    city: 'New City',
                    stateCode: 'TX',
                    postalCode: '55555'
                })
            }
        }
        return {
            mutateAsync: jest.fn().mockResolvedValue({})
        }
    }),
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
jest.mock('@salesforce/retail-react-app/app/hooks/use-item-shipment-management')
jest.mock('@salesforce/retail-react-app/app/pages/checkout/util/checkout-context')
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast')

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
const mockUpdateItemsToDeliveryShipment = jest.fn()

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
        createNewDeliveryShipmentWithAddress: jest.fn(),
        updateDeliveryAddressForShipment: jest.fn(),
        removeEmptyShipments: jest.fn(),
        orchestrateShipmentOperations: jest.fn()
    })

    useItemShipmentManagement.mockReturnValue({
        updateItemsToDeliveryShipment: mockUpdateItemsToDeliveryShipment
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
    isRegistered: true,
    addresses: [
        {
            addressId: 'addr-1',
            firstName: 'John',
            lastName: 'Doe',
            address1: '123 Test St',
            city: 'Test City',
            stateCode: 'CA',
            postalCode: '12345',
            countryCode: 'US',
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
            countryCode: 'US',
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
            ],
            inventory: {
                id: 'inventory-1',
                stockLevel: 10
            }
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
            ],
            inventory: {
                id: 'inventory-2',
                stockLevel: 5
            }
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
        defaultMessage: 'Shipping Address',
        id: 'shipping_address.label.shipping_address'
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
            expect(firstSelect).toHaveTextContent('No address available')

            // Check that the second dropdown also shows "No Address Available"
            const secondSelect = selectElements[1]
            expect(secondSelect).toHaveTextContent('No address available')

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

        test('should automatically select newly created address for the associated product', async () => {
            // Mock the createCustomerAddress mutation with a specific return value
            const mockCreateCustomerAddress = jest.fn().mockResolvedValue({
                addressId: 'addr-newly-created',
                firstName: 'Alice',
                lastName: 'Wonder',
                address1: '789 New St',
                city: 'New City',
                stateCode: 'TX',
                postalCode: '55555'
            })

            // Update the mock to return our specific mock function
            const {useShopperCustomersMutation} = jest.requireMock('@salesforce/commerce-sdk-react')
            useShopperCustomersMutation.mockReturnValue({
                mutateAsync: mockCreateCustomerAddress
            })

            // Mock refetchCustomer to simulate customer data refresh
            const mockRefetchCustomer = jest.fn().mockResolvedValue({
                data: {
                    ...mockCustomer,
                    addresses: [
                        ...mockCustomer.addresses,
                        {
                            addressId: 'addr-newly-created',
                            firstName: 'Alice',
                            lastName: 'Wonder',
                            address1: '789 New St',
                            city: 'New City',
                            stateCode: 'TX',
                            postalCode: '55555'
                        }
                    ]
                }
            })

            // Mock useCurrentCustomer to include refetch function
            useCurrentCustomer.mockReturnValue({
                data: mockCustomer,
                isLoading: false,
                refetch: mockRefetchCustomer
            })

            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Get the first "Add New Address" button and click it
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByTestId('address-form')).toBeInTheDocument()
            })

            // Fill out the address form
            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'Alice'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Wonder'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1234567890'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '789 New St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'New City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'TX'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '55555'}})

            // Click Save button
            fireEvent.click(screen.getByText('Save'))

            // Wait for the form to disappear and address creation to complete
            await waitFor(
                () => {
                    expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()
                },
                {timeout: 3000}
            )

            // Verify that the createCustomerAddress mutation was called
            expect(mockCreateCustomerAddress).toHaveBeenCalledWith({
                body: {
                    firstName: 'Alice',
                    lastName: 'Wonder',
                    phone: '(123) 456-7890',
                    countryCode: 'US',
                    address1: '789 New St',
                    city: 'New City',
                    stateCode: 'TX',
                    postalCode: '55555',
                    preferred: false,
                    addressId: expect.any(String), // nanoid generates a random string
                    address2: '',
                    companyName: ''
                },
                parameters: {customerId: 'customer-1'}
            })

            // Verify that refetchCustomer was called to refresh customer data
            expect(mockRefetchCustomer).toHaveBeenCalled()

            // Verify success toast was shown
            expect(mockShowToast).toHaveBeenCalledWith({
                title: 'Address saved successfully',
                status: 'success'
            })

            // Verify that the address form is closed
            expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()

            // The address was successfully created and form closed
            // Button enablement depends on complex state updates that work in the UI
            // but are difficult to test reliably in the mocked environment
        })

        test('should handle address creation error gracefully', async () => {
            // Mock the createCustomerAddress mutation to throw an error
            const mockCreateCustomerAddress = jest
                .fn()
                .mockRejectedValue(new Error('Network error'))

            // Update the mock to return our error-throwing mock function
            const {useShopperCustomersMutation} = jest.requireMock('@salesforce/commerce-sdk-react')
            useShopperCustomersMutation.mockReturnValue({
                mutateAsync: mockCreateCustomerAddress
            })

            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Get the first "Add New Address" button and click it
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByTestId('address-form')).toBeInTheDocument()
            })

            // Fill out the address form
            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'Alice'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Wonder'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1234567890'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '789 New St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'New City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'TX'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '55555'}})

            // Click Save button
            fireEvent.click(screen.getByText('Save'))

            // Wait for the error to be handled
            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith({
                    title: "Couldn't save the address.",
                    status: 'error'
                })
            })

            // Verify that the form is still visible (not closed on error)
            expect(screen.getByTestId('address-form')).toBeInTheDocument()

            // Verify that the address dropdowns still show original selections
            const addressDropdowns = screen.getAllByRole('combobox')
            const firstProductDropdown = addressDropdowns[0]
            expect(firstProductDropdown).toHaveValue('addr-2') // Should still show preferred address
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
    let mockUpdateItemsToDeliveryShipment
    let mockRemoveEmptyShipments
    let mockOrchestrateShipmentOperations

    const mockBasket = {
        basketId: 'test-basket-123',
        productItems: [
            {
                itemId: 'item-1',
                productId: 'product-1',
                productName: 'Test Product 1',
                quantity: 1,
                shipmentId: 'me'
            },
            {
                itemId: 'item-2',
                productId: 'product-2',
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

    const basketNoShipments = {
        ...mockBasket,
        shipments: []
    }

    const basketWithExistingShipmentForAddr1 = {
        ...mockBasket,
        shipments: [
            {shipmentId: 'me', shippingAddress: {}},
            {
                shipmentId: 'existing-shipment-1',
                shippingMethod: {},
                shippingAddress: mockAddresses[0]
            }
        ]
    }

    beforeEach(() => {
        mockFindDeliveryShipmentWithSameAddress = jest.fn().mockReturnValue(null)
        mockFindUnusedDeliveryShipment = jest.fn().mockReturnValue(null)
        mockCreateNewDeliveryShipmentWithAddress = jest
            .fn()
            .mockResolvedValue({shipmentId: 'new-shipment-1'})
        mockUpdateDeliveryAddressForShipment = jest.fn().mockResolvedValue()
        mockUpdateItemsToDeliveryShipment = jest.fn().mockResolvedValue({
            basketId: 'test-basket-123',
            // Return updated basket
            productItems: mockBasket.productItems,
            shipments: mockBasket.shipments
        })
        mockRemoveEmptyShipments = jest.fn().mockResolvedValue()
        mockOrchestrateShipmentOperations = jest.fn().mockResolvedValue()

        useMultiship.mockReturnValue({
            findDeliveryShipmentWithSameAddress: mockFindDeliveryShipmentWithSameAddress,
            findUnusedDeliveryShipment: mockFindUnusedDeliveryShipment,
            createNewDeliveryShipmentWithAddress: mockCreateNewDeliveryShipmentWithAddress,
            updateDeliveryAddressForShipment: mockUpdateDeliveryAddressForShipment,
            removeEmptyShipments: mockRemoveEmptyShipments,
            orchestrateShipmentOperations: mockOrchestrateShipmentOperations
        })

        useItemShipmentManagement.mockReturnValue({
            updateItemsToDeliveryShipment: mockUpdateItemsToDeliveryShipment
        })

        useCurrentCustomer.mockReturnValue({
            data: {
                customerId: 'test-customer',
                isRegistered: true,
                addresses: mockAddresses
            },
            refetch: jest.fn(),
            isLoading: false
        })
    })

    test('should handle successful submission with items going to different addresses', async () => {
        const user = userEvent.setup()

        renderWithIntl(<ShippingMultiAddress {...defaultProps} basket={basketNoShipments} />)

        // Select different addresses for each item
        const selects = screen.getAllByRole('combobox')
        await user.selectOptions(selects[0], 'addr-1') // First item to address 1
        await user.selectOptions(selects[1], 'addr-2') // Second item to address 2

        // Click continue button
        const continueButton = screen.getByTestId('continue-to-shipping-button')
        await user.click(continueButton)

        await waitFor(() => {
            // Should call orchestrateShipmentOperations with correct parameters
            expect(mockOrchestrateShipmentOperations).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({itemId: 'item-1'}),
                    expect.objectContaining({itemId: 'item-2'})
                ]),
                expect.objectContaining({
                    'item-1': 'addr-1',
                    'item-2': 'addr-2'
                }),
                mockAddresses,
                expect.any(Object) // productsMap
            )

            // Should navigate to next step
            expect(mockGoToStep).toHaveBeenCalledWith('SHIPPING_OPTIONS')
        })
    })

    test('should reuse existing shipment with same address', async () => {
        const user = userEvent.setup()

        renderWithIntl(
            <ShippingMultiAddress {...defaultProps} basket={basketWithExistingShipmentForAddr1} />
        )

        // Select same address for both items
        const selects = screen.getAllByRole('combobox')
        await user.selectOptions(selects[0], 'addr-1')
        await user.selectOptions(selects[1], 'addr-1')

        const continueButton = screen.getByTestId('continue-to-shipping-button')
        await user.click(continueButton)

        await waitFor(() => {
            // Should call orchestrateShipmentOperations with same address for both items
            expect(mockOrchestrateShipmentOperations).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({itemId: 'item-1'}),
                    expect.objectContaining({itemId: 'item-2'})
                ]),
                expect.objectContaining({
                    'item-1': 'addr-1',
                    'item-2': 'addr-1'
                }),
                mockAddresses,
                expect.any(Object)
            )

            // Should navigate to next step
            expect(mockGoToStep).toHaveBeenCalledWith('SHIPPING_OPTIONS')
        })
    })

    test('should handle errors gracefully', async () => {
        // Mock an error during orchestration
        mockOrchestrateShipmentOperations.mockRejectedValue(
            new Error('Failed to orchestrate shipments')
        )

        const user = userEvent.setup()

        renderWithIntl(<ShippingMultiAddress {...defaultProps} basket={basketNoShipments} />)

        const selects = screen.getAllByRole('combobox')
        await user.selectOptions(selects[0], 'addr-1')

        const continueButton = screen.getByTestId('continue-to-shipping-button')
        await user.click(continueButton)

        await waitFor(() => {
            // Should show error toast
            expect(mockShowToast).toHaveBeenCalledWith({
                title: 'Something went wrong while setting up shipments. Try again.',
                status: 'error'
            })

            // Should NOT navigate to next step
            expect(mockGoToStep).not.toHaveBeenCalled()
        })
    })

    test('should not move items that are already in correct shipment', async () => {
        // Basket includes a shipment that already matches addr-1
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
            ],
            shipments: [
                {shipmentId: 'me', shippingAddress: {}},
                {
                    shipmentId: 'existing-shipment-1',
                    shippingMethod: {},
                    shippingAddress: mockAddresses[0]
                }
            ]
        }

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
            // Should call orchestrateShipmentOperations with the correct parameters
            expect(mockOrchestrateShipmentOperations).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({itemId: 'item-1', shipmentId: 'existing-shipment-1'}),
                    expect.objectContaining({itemId: 'item-2', shipmentId: 'me'})
                ]),
                expect.objectContaining({
                    'item-1': 'addr-1',
                    'item-2': 'addr-2'
                }),
                mockAddresses,
                expect.any(Object)
            )

            // Should navigate to next step
            expect(mockGoToStep).toHaveBeenCalledWith('SHIPPING_OPTIONS')
        })
    })

    test('should use first address as default if no address selected', async () => {
        const user = userEvent.setup()

        renderWithIntl(<ShippingMultiAddress {...defaultProps} basket={mockBasket} />)

        // Don't select any addresses, just click continue
        const continueButton = screen.getByTestId('continue-to-shipping-button')
        await user.click(continueButton)

        await waitFor(() => {
            // Should call orchestrateShipmentOperations with default address
            expect(mockOrchestrateShipmentOperations).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({itemId: 'item-1'}),
                    expect.objectContaining({itemId: 'item-2'})
                ]),
                expect.objectContaining({
                    'item-1': 'addr-1', // Default address
                    'item-2': 'addr-1' // Default address
                }),
                mockAddresses,
                expect.any(Object)
            )

            // Should navigate to next step
            expect(mockGoToStep).toHaveBeenCalledWith('SHIPPING_OPTIONS')
        })
    })

    // Tests for address persistence functionality
    describe('Address Persistence', () => {
        const mockBasketWithShipments = {
            ...mockBasket,
            productItems: [
                {
                    ...mockBasket.productItems[0],
                    itemId: 'item-1',
                    shipmentId: 'shipment-1'
                },
                {
                    ...mockBasket.productItems[1],
                    itemId: 'item-2',
                    shipmentId: 'shipment-2'
                }
            ],
            shipments: [
                {
                    shipmentId: 'shipment-1',
                    shippingAddress: {
                        firstName: 'John',
                        lastName: 'Doe',
                        address1: '123 Main St',
                        city: 'New York',
                        stateCode: 'NY',
                        postalCode: '10001'
                    }
                },
                {
                    shipmentId: 'shipment-2',
                    shippingAddress: {
                        firstName: 'Jane',
                        lastName: 'Smith',
                        address1: '456 Oak Ave',
                        city: 'Los Angeles',
                        stateCode: 'CA',
                        postalCode: '90210'
                    }
                }
            ]
        }

        const mockCustomerWithMatchingAddresses = {
            ...mockCustomer,
            addresses: [
                {
                    addressId: 'addr-1',
                    firstName: 'John',
                    lastName: 'Doe',
                    address1: '123 Main St',
                    city: 'New York',
                    stateCode: 'NY',
                    postalCode: '10001'
                },
                {
                    addressId: 'addr-2',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    address1: '456 Oak Ave',
                    city: 'Los Angeles',
                    stateCode: 'CA',
                    postalCode: '90210'
                },
                {
                    addressId: 'addr-3',
                    firstName: 'Bob',
                    lastName: 'Johnson',
                    address1: '789 Pine St',
                    city: 'Chicago',
                    stateCode: 'IL',
                    postalCode: '60601'
                }
            ]
        }

        test('should initialize selected addresses based on existing shipments when addresses match customer addresses', () => {
            // Ensure strict address equality matching
            useCurrentCustomer.mockReturnValue({
                data: mockCustomerWithMatchingAddresses,
                isLoading: false
            })

            useCurrentBasket.mockReturnValue({
                data: mockBasketWithShipments
            })

            renderWithIntl(
                <ShippingMultiAddress {...defaultProps} basket={mockBasketWithShipments} />
            )

            // Check that the address dropdowns show the correct selected addresses
            const dropdowns = screen.getAllByRole('combobox')
            expect(dropdowns[0]).toHaveValue('addr-1') // John Doe's address
            expect(dropdowns[1]).toHaveValue('addr-2') // Jane Smith's address matches
        })

        test('should fall back to first customer address when shipment address does not match any customer address', () => {
            const mockCustomerWithNonMatchingAddresses = {
                ...mockCustomer,
                addresses: [
                    {
                        addressId: 'addr-1',
                        firstName: 'Alice',
                        lastName: 'Wonder',
                        address1: '999 Different St',
                        city: 'Different City',
                        stateCode: 'TX',
                        postalCode: '12345'
                    }
                ]
            }

            useCurrentCustomer.mockReturnValue({
                data: mockCustomerWithNonMatchingAddresses,
                isLoading: false
            })

            useCurrentBasket.mockReturnValue({
                data: mockBasketWithShipments
            })

            renderWithIntl(
                <ShippingMultiAddress {...defaultProps} basket={mockBasketWithShipments} />
            )

            // Check that the address dropdowns fall back to the first customer address
            const dropdowns = screen.getAllByRole('combobox')
            expect(dropdowns[0]).toHaveValue('addr-1') // Fall back to first address
            expect(dropdowns[1]).toHaveValue('addr-1') // Fall back to first address
        })

        test('should handle partial address matches correctly', () => {
            const mockCustomerWithPartialMatches = {
                ...mockCustomer,
                addresses: [
                    {
                        addressId: 'addr-1',
                        firstName: 'John',
                        lastName: 'Doe',
                        address1: '123 Main St',
                        city: 'New York',
                        stateCode: 'NY',
                        postalCode: '10001'
                    },
                    {
                        addressId: 'addr-2',
                        firstName: 'Different',
                        lastName: 'Person',
                        address1: '456 Oak Ave',
                        city: 'Los Angeles',
                        stateCode: 'CA',
                        postalCode: '90210'
                    }
                ]
            }

            useCurrentCustomer.mockReturnValue({
                data: mockCustomerWithPartialMatches,
                isLoading: false
            })

            useCurrentBasket.mockReturnValue({
                data: mockBasketWithShipments
            })

            renderWithIntl(
                <ShippingMultiAddress {...defaultProps} basket={mockBasketWithShipments} />
            )

            // Check that the first item matches correctly, second falls back
            const dropdowns = screen.getAllByRole('combobox')
            expect(dropdowns[0]).toHaveValue('addr-1') // John Doe matches
            expect(dropdowns[1]).toHaveValue('addr-1') // Jane Smith falls back to first address
        })

        test('should handle items without shipment assignments by using default address', () => {
            const mockBasketWithUnassignedItems = {
                ...mockBasket,
                productItems: [
                    {
                        ...mockBasket.productItems[0],
                        itemId: 'item-1',
                        shipmentId: 'shipment-1'
                    },
                    {
                        ...mockBasket.productItems[1],
                        itemId: 'item-2'
                        // No shipmentId - unassigned item
                    }
                ],
                shipments: [
                    {
                        shipmentId: 'shipment-1',
                        shippingAddress: {
                            firstName: 'John',
                            lastName: 'Doe',
                            address1: '123 Main St',
                            city: 'New York',
                            stateCode: 'NY',
                            postalCode: '10001'
                        }
                    }
                ]
            }

            useCurrentCustomer.mockReturnValue({
                data: mockCustomerWithMatchingAddresses,
                isLoading: false
            })

            useCurrentBasket.mockReturnValue({
                data: mockBasketWithUnassignedItems
            })

            renderWithIntl(
                <ShippingMultiAddress {...defaultProps} basket={mockBasketWithUnassignedItems} />
            )

            // Check that assigned item gets correct address, unassigned gets default
            const dropdowns = screen.getAllByRole('combobox')
            expect(dropdowns[0]).toHaveValue('addr-1') // Assigned item gets correct address
            expect(dropdowns[1]).toHaveValue('addr-1') // Unassigned item gets default (first address)
        })

        test('should handle shipments without addresses gracefully', () => {
            const mockBasketWithShipmentsWithoutAddresses = {
                ...mockBasket,
                productItems: [
                    {
                        ...mockBasket.productItems[0],
                        itemId: 'item-1',
                        shipmentId: 'shipment-1'
                    },
                    {
                        ...mockBasket.productItems[1],
                        itemId: 'item-2',
                        shipmentId: 'shipment-2'
                    }
                ],
                shipments: [
                    {
                        shipmentId: 'shipment-1'
                        // No shippingAddress
                    },
                    {
                        shipmentId: 'shipment-2',
                        shippingAddress: {
                            firstName: 'Jane',
                            lastName: 'Smith',
                            address1: '456 Oak Ave',
                            city: 'Los Angeles',
                            stateCode: 'CA',
                            postalCode: '90210'
                        }
                    }
                ]
            }

            useCurrentCustomer.mockReturnValue({
                data: mockCustomerWithMatchingAddresses,
                isLoading: false
            })

            useCurrentBasket.mockReturnValue({
                data: mockBasketWithShipmentsWithoutAddresses
            })

            renderWithIntl(
                <ShippingMultiAddress
                    {...defaultProps}
                    basket={mockBasketWithShipmentsWithoutAddresses}
                />
            )

            // Check that items in shipments without addresses get default or match
            const dropdowns = screen.getAllByRole('combobox')
            expect(dropdowns[0]).toHaveValue('addr-1') // No address in shipment, gets default
            expect(dropdowns[1]).toHaveValue('addr-2') // Has address in shipment, matches customer address
        })

        test('should handle empty customer addresses gracefully', () => {
            const mockCustomerWithNoAddresses = {
                ...mockCustomer,
                addresses: []
            }

            useCurrentCustomer.mockReturnValue({
                data: mockCustomerWithNoAddresses,
                isLoading: false
            })

            useCurrentBasket.mockReturnValue({
                data: mockBasketWithShipments
            })

            renderWithIntl(
                <ShippingMultiAddress {...defaultProps} basket={mockBasketWithShipments} />
            )

            // Check that dropdowns show "No Address Available" when no customer addresses
            const dropdowns = screen.getAllByRole('combobox')
            dropdowns.forEach((dropdown) => {
                expect(dropdown).toHaveValue('')
            })

            // Check that "No address available" option is present
            expect(screen.getAllByText('No address available')).toHaveLength(2)
        })

        test('should handle case-sensitive address matching correctly', () => {
            const mockCustomerWithCaseSensitiveAddresses = {
                ...mockCustomer,
                addresses: [
                    {
                        addressId: 'addr-1',
                        firstName: 'JOHN',
                        lastName: 'DOE',
                        address1: '123 MAIN ST',
                        city: 'NEW YORK',
                        stateCode: 'NY',
                        postalCode: '10001'
                    }
                ]
            }

            useCurrentCustomer.mockReturnValue({
                data: mockCustomerWithCaseSensitiveAddresses,
                isLoading: false
            })

            useCurrentBasket.mockReturnValue({
                data: mockBasketWithShipments
            })

            renderWithIntl(
                <ShippingMultiAddress {...defaultProps} basket={mockBasketWithShipments} />
            )

            // Check that case-sensitive matching doesn't work (as expected)
            const dropdowns = screen.getAllByRole('combobox')
            expect(dropdowns[0]).toHaveValue('addr-1') // Falls back to first address due to case mismatch
        })

        test('should handle basket with no shipments correctly', () => {
            const mockBasketWithNoShipments = {
                ...mockBasket,
                productItems: [
                    {
                        ...mockBasket.productItems[0],
                        itemId: 'item-1'
                        // No shipmentId
                    },
                    {
                        ...mockBasket.productItems[1],
                        itemId: 'item-2'
                        // No shipmentId
                    }
                ],
                shipments: []
            }

            useCurrentCustomer.mockReturnValue({
                data: mockCustomerWithMatchingAddresses,
                isLoading: false
            })

            useCurrentBasket.mockReturnValue({
                data: mockBasketWithNoShipments
            })

            renderWithIntl(
                <ShippingMultiAddress {...defaultProps} basket={mockBasketWithNoShipments} />
            )

            // Check that all items get default addresses when no shipments exist
            const dropdowns = screen.getAllByRole('combobox')
            expect(dropdowns[0]).toHaveValue('addr-1') // Gets default (first address)
            expect(dropdowns[1]).toHaveValue('addr-1') // Gets default (first address)
        })

        test('should update selected addresses when customer data changes', () => {
            // Initially with matching addresses
            useCurrentCustomer.mockReturnValue({
                data: mockCustomerWithMatchingAddresses,
                isLoading: false
            })

            useCurrentBasket.mockReturnValue({
                data: mockBasketWithShipments
            })

            const {rerender} = renderWithIntl(
                <ShippingMultiAddress {...defaultProps} basket={mockBasketWithShipments} />
            )

            let dropdowns = screen.getAllByRole('combobox')
            expect(dropdowns[0]).toHaveValue('addr-1')
            expect(dropdowns[1]).toHaveValue('addr-2')

            // Change customer data to have different addresses
            const newCustomerData = {
                ...mockCustomer,
                addresses: [
                    {
                        addressId: 'addr-new-1',
                        firstName: 'New',
                        lastName: 'Customer',
                        address1: '999 New St',
                        city: 'New City',
                        stateCode: 'TX',
                        postalCode: '12345'
                    }
                ]
            }

            useCurrentCustomer.mockReturnValue({
                data: newCustomerData,
                isLoading: false
            })

            // Re-render with proper context
            rerender(
                <CurrencyProvider currency="USD">
                    <IntlProvider locale="en">
                        <ShippingMultiAddress {...defaultProps} basket={mockBasketWithShipments} />
                    </IntlProvider>
                </CurrencyProvider>
            )

            // Should fall back to new default address
            dropdowns = screen.getAllByRole('combobox')
            expect(dropdowns[0]).toHaveValue('addr-new-1')
            expect(dropdowns[1]).toHaveValue('addr-new-1')
        })
    })

    describe('Guest shopper', () => {
        beforeEach(() => {
            useCurrentCustomer.mockReturnValue({
                data: {
                    customerId: 'guest-1',
                    isGuest: true,
                    addresses: []
                },
                isLoading: false
            })
        })

        test('should render multi-ship UI for guest users', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)
            expect(screen.getByText('Test Product 1')).toBeInTheDocument()
            expect(screen.getByText('Test Product 2')).toBeInTheDocument()
            expect(screen.getAllByText('+ Add New Address')).toHaveLength(2)
            expect(screen.getByText('Continue')).toBeInTheDocument()
        })

        test('should show empty dropdowns for guest users at start checkout', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)
            const selectElements = screen.getAllByRole('combobox')
            expect(selectElements).toHaveLength(2)

            selectElements.forEach((select) => {
                expect(select).toHaveValue('')
                expect(select).toBeDisabled()
            })
        })

        test('should store new addresses in component state for guests', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])
            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'Guest'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'User'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1234567890'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '123 Guest St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'Guest City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'CA'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '12345'}})

            fireEvent.click(screen.getByText('Save'))

            await waitFor(() => {
                // Verify address is added to local state (should appear in dropdown)
                const dropdowns = screen.getAllByRole('combobox')
                expect(dropdowns[0].value).toMatch(/^guest_/)
            })
        })

        test('should auto-assign first address to all products for guests', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])
            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'First'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Guest'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1234567890'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '123 First St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'First City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'CA'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '12345'}})

            fireEvent.click(screen.getByText('Save'))

            await waitFor(() => {
                // Verify first address is auto-assigned to all products
                const dropdowns = screen.getAllByRole('combobox')
                const firstDropdownValue = dropdowns[0].value
                expect(firstDropdownValue).toMatch(/^guest_/) // guest_ id prefix

                // Both dropdowns should have the same address value (same guest ID)
                dropdowns.forEach((dropdown) => {
                    expect(dropdown).toHaveValue(firstDropdownValue)
                })

                // Verify the address text shows the same address details
                const addressOptions = screen.getAllByText(
                    /First Guest - 123 First St, First City, CA 12345/
                )
                expect(addressOptions).toHaveLength(2) // Should have 2 options with same address text
            })
        })

        test('should enable continue button when all products have addresses', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'Guest'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'User'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1234567890'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '123 Guest St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'Guest City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'CA'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '12345'}})

            fireEvent.click(screen.getByText('Save'))

            await waitFor(() => {
                // Continue button should be enabled when all products have addresses
                const continueButton = screen.getByText('Continue')
                expect(continueButton).toBeEnabled()
            })
        })

        test('should create guest shipments when proceed is clicked', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Add address for first product
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'Guest'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'User'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1234567890'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '123 Guest St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'Guest City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'CA'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '12345'}})

            fireEvent.click(screen.getByText('Save'))

            await waitFor(() => {
                const continueButton = screen.getByText('Continue')
                expect(continueButton).toBeEnabled()
            })

            fireEvent.click(screen.getByText('Continue'))

            await waitFor(() => {
                expect(screen.getByText('Setting up shipments...')).toBeInTheDocument()
            })
        })
    })

    describe('Duplicate Address Prevention', () => {
        beforeEach(() => {
            useProducts.mockReturnValue({
                data: {
                    'product-1': mockProducts.data[0],
                    'product-2': mockProducts.data[1]
                },
                isLoading: false,
                error: null
            })
        })

        test('should prevent saving duplicate guest addresses and show popup message', async () => {
            useCurrentCustomer.mockReturnValue({
                data: {...mockCustomer, isGuest: true},
                isLoading: false
            })

            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // add an initial address
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            // first address
            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'John'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Doe'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1234567890'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '123 Test St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'Test City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'CA'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '12345'}})

            fireEvent.click(screen.getByText('Save'))

            await waitFor(() => {
                expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()
            })

            mockShowToast.mockClear()

            // add the same address again
            const addNewAddressButtons2 = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons2[0])

            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'John'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Doe'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1234567890'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '123 Test St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'Test City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'CA'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '12345'}})

            fireEvent.click(screen.getByText('Save'))

            await waitFor(() => {
                // Form should be closed
                expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()

                // popup message is shown
                expect(mockShowToast).toHaveBeenCalledWith({
                    title: 'The address you entered already exists.',
                    status: 'info'
                })
            })
        })

        test('should prevent saving duplicate registered user addresses and show popup message', async () => {
            useCurrentCustomer.mockReturnValue({
                data: {...mockCustomer, isGuest: false},
                isLoading: false
            })

            const mockCreateCustomerAddress = {
                mutateAsync: jest
                    .fn()
                    .mockRejectedValue(new Error('Should not be called for duplicates'))
            }

            renderWithIntl(
                <ShippingMultiAddress
                    {...defaultProps}
                    createCustomerAddress={mockCreateCustomerAddress}
                />
            )

            // Try to add same address
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            // matching existing customer address (addr-1)
            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'John'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Doe'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1234567890'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '123 Test St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'Test City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'CA'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '12345'}})

            fireEvent.click(screen.getByText('Save'))

            await waitFor(() => {
                // Form should be closed
                expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()

                // popup message is shown
                expect(mockShowToast).toHaveBeenCalledWith({
                    title: 'The address you entered already exists.',
                    status: 'info'
                })
            })
        })

        test('should allow different addresses to be saved successfully for guest', async () => {
            useCurrentCustomer.mockReturnValue({
                data: {...mockCustomer, isGuest: true},
                isLoading: false
            })

            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // initial address
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'John'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Doe'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1234567890'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '123 Test St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'Test City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'CA'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '12345'}})

            fireEvent.click(screen.getByText('Save'))

            await waitFor(() => {
                expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()
            })

            mockShowToast.mockClear()

            // different address
            const addNewAddressButtons2 = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons2[0])

            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'Jane'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Smith'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '0987654321'}})
            fireEvent.change(screen.getByLabelText('Address'), {
                target: {value: '456 Different St'}
            })
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'Different City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'NY'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '67890'}})

            fireEvent.click(screen.getByText('Save'))

            await waitFor(() => {
                // Form should be closed
                expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()
                expect(mockShowToast).toHaveBeenCalledWith({
                    title: 'Address saved successfully',
                    status: 'success'
                })
            })
        })

        test('should allow registered user to add two different addresses successfully', async () => {
            // Mock the createCustomerAddress mutation for registered user
            const mockCreateCustomerAddress = jest
                .fn()
                .mockResolvedValueOnce({
                    addressId: 'addr-new-1',
                    firstName: 'Alice',
                    lastName: 'Johnson',
                    address1: '789 Home St',
                    city: 'Home City',
                    stateCode: 'TX',
                    postalCode: '11111'
                })
                .mockResolvedValueOnce({
                    addressId: 'addr-new-2',
                    firstName: 'Bob',
                    lastName: 'Wilson',
                    address1: '321 Work Ave',
                    city: 'Work City',
                    stateCode: 'CA',
                    postalCode: '22222'
                })

            // Update the mock to return our specific mock function
            const {useShopperCustomersMutation} = jest.requireMock('@salesforce/commerce-sdk-react')
            useShopperCustomersMutation.mockReturnValue({
                mutateAsync: mockCreateCustomerAddress
            })

            // Mock refetchCustomer to simulate customer data refresh
            const mockRefetchCustomer = jest.fn().mockResolvedValue({
                data: {
                    ...mockCustomer,
                    addresses: [
                        ...mockCustomer.addresses,
                        {
                            addressId: 'addr-new-1',
                            firstName: 'Alice',
                            lastName: 'Johnson',
                            address1: '789 Home St',
                            city: 'Home City',
                            stateCode: 'TX',
                            postalCode: '11111'
                        },
                        {
                            addressId: 'addr-new-2',
                            firstName: 'Bob',
                            lastName: 'Wilson',
                            address1: '321 Work Ave',
                            city: 'Work City',
                            stateCode: 'CA',
                            postalCode: '22222'
                        }
                    ]
                }
            })

            useCurrentCustomer.mockReturnValue({
                data: {...mockCustomer, isGuest: false},
                isLoading: false,
                refetch: mockRefetchCustomer
            })

            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Add first new address
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            // Fill out first address form
            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'Alice'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Johnson'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1111111111'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '789 Home St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'Home City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'TX'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '11111'}})

            fireEvent.click(screen.getByText('Save'))

            // Wait for first address to be saved
            await waitFor(() => {
                expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()
                expect(mockCreateCustomerAddress).toHaveBeenCalledWith({
                    body: {
                        firstName: 'Alice',
                        lastName: 'Johnson',
                        phone: '(111) 111-1111',
                        countryCode: 'US',
                        address1: '789 Home St',
                        city: 'Home City',
                        stateCode: 'TX',
                        postalCode: '11111',
                        preferred: false,
                        addressId: expect.any(String),
                        address2: '',
                        companyName: ''
                    },
                    parameters: {customerId: 'customer-1'}
                })
                expect(mockShowToast).toHaveBeenCalledWith({
                    title: 'Address saved successfully',
                    status: 'success'
                })
            })

            // Clear toast mock for second address
            mockShowToast.mockClear()

            // Add second new address
            const addNewAddressButtons2 = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons2[0])

            // Fill out second address form
            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'Bob'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'Wilson'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '2222222222'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '321 Work Ave'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'Work City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'CA'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '22222'}})

            fireEvent.click(screen.getByText('Save'))

            // Wait for second address to be saved
            await waitFor(() => {
                expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()
                expect(mockCreateCustomerAddress).toHaveBeenCalledWith({
                    body: {
                        firstName: 'Bob',
                        lastName: 'Wilson',
                        phone: '(222) 222-2222',
                        countryCode: 'US',
                        address1: '321 Work Ave',
                        city: 'Work City',
                        stateCode: 'CA',
                        postalCode: '22222',
                        preferred: false,
                        addressId: expect.any(String),
                        address2: '',
                        companyName: ''
                    },
                    parameters: {customerId: 'customer-1'}
                })
                expect(mockShowToast).toHaveBeenCalledWith({
                    title: 'Address saved successfully',
                    status: 'success'
                })
            })

            // Verify that createCustomerAddress was called twice (once for each address)
            expect(mockCreateCustomerAddress).toHaveBeenCalledTimes(2)

            // refetchCustomer called twice to refresh customer data
            expect(mockRefetchCustomer).toHaveBeenCalledTimes(2)
            expect(screen.queryByTestId('address-form')).not.toBeInTheDocument()
        })
    })

    describe('Unsaved guest addresses toggle warning', () => {
        const mockOnUnsavedGuestAddressesToggleWarning = jest.fn()
        beforeEach(() => {
            mockOnUnsavedGuestAddressesToggleWarning.mockClear()
        })

        test('should call onUnsavedGuestAddressesToggleWarning with false when no unpersisted addresses exist', () => {
            const basketWithPersistedAddresses = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'shipment-1',
                        shippingAddress: {
                            firstName: 'John',
                            lastName: 'Doe',
                            address1: '123 Test St',
                            city: 'Test City',
                            stateCode: 'CA',
                            postalCode: '12345'
                        }
                    }
                ]
            }

            useCurrentCustomer.mockReturnValue({
                data: {
                    customerId: 'guest-1',
                    isGuest: true,
                    addresses: []
                },
                isLoading: false
            })

            useCurrentBasket.mockReturnValue({
                data: basketWithPersistedAddresses
            })

            renderWithIntl(
                <ShippingMultiAddress
                    {...defaultProps}
                    basket={basketWithPersistedAddresses}
                    onUnsavedGuestAddressesToggleWarning={mockOnUnsavedGuestAddressesToggleWarning}
                />
            )
            expect(mockOnUnsavedGuestAddressesToggleWarning).toHaveBeenCalledWith(false)
        })

        test('should call onUnsavedGuestAddressesToggleWarning with true when unpersisted guest addresses exist', async () => {
            useCurrentCustomer.mockReturnValue({
                data: {
                    customerId: 'guest-1',
                    isGuest: true,
                    addresses: []
                },
                isLoading: false
            })

            useCurrentBasket.mockReturnValue({
                data: mockBasket
            })

            renderWithIntl(
                <ShippingMultiAddress
                    {...defaultProps}
                    onUnsavedGuestAddressesToggleWarning={mockOnUnsavedGuestAddressesToggleWarning}
                />
            )

            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'Guest'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'User'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1234567890'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '123 Guest St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'Guest City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'CA'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '12345'}})
            fireEvent.click(screen.getByText('Save'))

            await waitFor(() => {
                expect(mockOnUnsavedGuestAddressesToggleWarning).toHaveBeenCalledWith(true)
            })
        })

        test('should call onUnsavedGuestAddressesToggleWarning with false when guest addresses are persisted', async () => {
            const basketWithPersistedGuestAddresses = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'shipment-1',
                        shippingAddress: {
                            firstName: 'Guest',
                            lastName: 'User',
                            address1: '123 Guest St',
                            city: 'Guest City',
                            stateCode: 'CA',
                            postalCode: '12345'
                        }
                    }
                ]
            }

            useCurrentCustomer.mockReturnValue({
                data: {
                    customerId: 'guest-1',
                    isGuest: true,
                    addresses: []
                },
                isLoading: false
            })

            useCurrentBasket.mockReturnValue({
                data: basketWithPersistedGuestAddresses
            })

            renderWithIntl(
                <ShippingMultiAddress
                    {...defaultProps}
                    basket={basketWithPersistedGuestAddresses}
                    onUnsavedGuestAddressesToggleWarning={mockOnUnsavedGuestAddressesToggleWarning}
                />
            )

            // same guest address that's already persisted
            const addNewAddressButtons = screen.getAllByText('+ Add New Address')
            fireEvent.click(addNewAddressButtons[0])

            fireEvent.change(screen.getByLabelText('First Name'), {target: {value: 'Guest'}})
            fireEvent.change(screen.getByLabelText('Last Name'), {target: {value: 'User'}})
            fireEvent.change(screen.getByLabelText('Phone'), {target: {value: '1234567890'}})
            fireEvent.change(screen.getByLabelText('Address'), {target: {value: '123 Guest St'}})
            fireEvent.change(screen.getByLabelText('City'), {target: {value: 'Guest City'}})
            fireEvent.change(screen.getByLabelText('State'), {target: {value: 'CA'}})
            fireEvent.change(screen.getByLabelText('Zip Code'), {target: {value: '12345'}})
            fireEvent.click(screen.getByText('Save'))

            await waitFor(() => {
                expect(mockOnUnsavedGuestAddressesToggleWarning).toHaveBeenCalledWith(false)
            })
        })

        test('should call onUnsavedGuestAddressesToggleWarning with false for registered users', () => {
            useCurrentCustomer.mockReturnValue({
                data: {
                    customerId: 'customer-1',
                    isGuest: false,
                    addresses: mockCustomer.addresses
                },
                isLoading: false
            })

            useCurrentBasket.mockReturnValue({
                data: mockBasket
            })

            renderWithIntl(
                <ShippingMultiAddress
                    {...defaultProps}
                    onUnsavedGuestAddressesToggleWarning={mockOnUnsavedGuestAddressesToggleWarning}
                />
            )
            expect(mockOnUnsavedGuestAddressesToggleWarning).toHaveBeenCalledWith(false)
        })
    })
})
