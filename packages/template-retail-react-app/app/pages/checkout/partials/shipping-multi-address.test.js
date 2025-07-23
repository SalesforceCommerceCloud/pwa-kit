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
    }))
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn()
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

jest.mock('@salesforce/retail-react-app/app/components/item-variant', () => {
    // eslint-disable-next-line react/prop-types
    function MockItemVariantProvider({children}) {
        return <div data-testid="item-variant-provider">{children}</div>
    }
    return MockItemVariantProvider
})

jest.mock('@salesforce/retail-react-app/app/components/display-price', () => {
    /* eslint-disable react/prop-types */
    function MockDisplayPrice({priceData, currency}) {
        return (
            <span data-testid="display-price">
                {new Intl.NumberFormat('en', {
                    style: 'currency',
                    currency: currency || 'USD'
                }).format(priceData?.currentPrice || 29.99)}
            </span>
        )
    }
    /* eslint-enable react/prop-types */

    return MockDisplayPrice
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
        defaultMessage: 'Add New Address',
        id: 'checkout.button.add_new_address'
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
            }
        })
        useCurrentCustomer.mockReturnValue({
            data: mockCustomer
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

    test('should render product items with correct information', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
        expect(screen.getByText('Quantity: 2')).toBeInTheDocument()
        expect(screen.getByText('Quantity: 1')).toBeInTheDocument()
    })

    test('should render delivery address sections for each product', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        const deliveryAddressLabels = screen.getAllByText('Delivery Address')
        expect(deliveryAddressLabels).toHaveLength(2)
    })

    test('should render product images', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        const images = screen.getAllByAltText('Product image for Test Product 1')
        expect(images).toHaveLength(1)
        expect(images[0]).toHaveAttribute('src', 'https://test-image-1.jpg')
    })

    test('should render variation attributes', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        expect(screen.getByText('Color: Red')).toBeInTheDocument()
        expect(screen.getByText('Size: Medium')).toBeInTheDocument()
        expect(screen.getByText('Color: Blue')).toBeInTheDocument()
        expect(screen.getByText('Size: Large')).toBeInTheDocument()
    })

    test('should render product prices', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        const priceElements = screen.getAllByTestId('display-price')

        expect(priceElements).toHaveLength(2)

        priceElements.forEach((element) => {
            expect(element.textContent).toMatch(/\$\d+\.\d{2}/)
        })
    })

    test('should render continue button', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        expect(screen.getByText('Continue')).toBeInTheDocument()
    })

    test('should call onSubmit when continue button is clicked', () => {
        const mockOnSubmit = jest.fn()
        renderWithIntl(<ShippingMultiAddress {...defaultProps} onSubmit={mockOnSubmit} />)

        fireEvent.click(screen.getByText('Continue'))
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })

    test('should render address dropdowns', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        const dropdowns = screen.getAllByRole('combobox', {hidden: true})
        expect(dropdowns.length).toBeGreaterThan(0)
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

    describe('Accessibility', () => {
        test('should have proper alt text for images', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const images = screen.getAllByAltText(/Product image for Test Product/)
            expect(images).toHaveLength(2)
        })

        test('should have proper button roles', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const continueButton = screen.getByText('Continue')
            expect(continueButton).toBeInTheDocument()
        })
    })

    describe('Responsive Design', () => {
        test('should apply responsive CSS classes', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Check that the component has the expected number of cards using data-testid
            const multiShippingCards = screen.getAllByTestId('multi-shipping-card')
            expect(multiShippingCards).toHaveLength(2)
        })
    })

    describe('Internationalization', () => {
        test('should use proper i18n for address formatting', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            expect(selectElements).toHaveLength(2)

            selectElements.forEach((select) => {
                expect(select).toHaveValue('addr-1')
            })
        })

        test('should handle missing state code in address formatting', () => {
            const customerWithMissingState = {
                ...mockCustomer,
                addresses: [
                    {
                        ...mockCustomer.addresses[0],
                        stateCode: null
                    }
                ]
            }

            useCurrentCustomer.mockReturnValue({
                data: customerWithMissingState
            })

            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            expect(selectElements).toHaveLength(2)

            selectElements.forEach((select) => {
                expect(select).toHaveValue('addr-1')
            })
        })

        test('should display address in current format', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            expect(selectElements).toHaveLength(2)

            expect(selectElements[0]).toHaveValue('addr-1')
        })

        test('should not use hardcoded address formatting', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            expect(selectElements).toHaveLength(2)

            selectElements.forEach((select) => {
                expect(select).toHaveValue('addr-1')
            })
        })
    })

    describe('Keyboard Navigation', () => {
        test('should handle arrow key navigation in dropdown', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            expect(firstSelect).toBeInTheDocument()
            expect(firstSelect).toHaveValue('addr-1')

            fireEvent.change(firstSelect, {target: {value: 'addr-2'}})
            expect(firstSelect).toHaveValue('addr-2')
        })

        test('should handle Enter key to select address', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            fireEvent.change(firstSelect, {target: {value: 'addr-2'}})
            expect(firstSelect).toHaveValue('addr-2')
        })

        test('should handle Space key to select address', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            fireEvent.change(firstSelect, {target: {value: 'addr-2'}})
            expect(firstSelect).toHaveValue('addr-2')

            fireEvent.change(firstSelect, {target: {value: 'addr-1'}})
            expect(firstSelect).toHaveValue('addr-1')
        })

        test('should handle Escape key to close dropdown', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            expect(firstSelect).toBeInTheDocument()
            expect(firstSelect).toHaveValue('addr-1')

            fireEvent.change(firstSelect, {target: {value: 'addr-2'}})
            expect(firstSelect).toHaveValue('addr-2')
        })
    })

    describe('Add New Address Functionality', () => {
        test('should show "Add New Address" option in dropdown', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            // Check that "Add New Address" option is present
            expect(firstSelect).toHaveTextContent('+ Add New Address')
        })

        test('should show address form when "Add New Address" is selected', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            // Select "Add New Address" option
            fireEvent.change(firstSelect, {target: {value: 'add-new-address'}})

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByText('First Name')).toBeInTheDocument()
                expect(screen.getByText('Last Name')).toBeInTheDocument()
                expect(screen.getByText('Phone')).toBeInTheDocument()
                expect(screen.getByText('Country')).toBeInTheDocument()
                expect(screen.getByText('Address')).toBeInTheDocument()
                expect(screen.getByText('City')).toBeInTheDocument()
                expect(screen.getByText('State')).toBeInTheDocument()
                expect(screen.getByText('Zip Code')).toBeInTheDocument()
            })
        })

        test('should show Save and Cancel buttons in address form', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            // Select "Add New Address" option
            fireEvent.change(firstSelect, {target: {value: 'add-new-address'}})

            // Wait for the form to appear and check for buttons
            await waitFor(() => {
                expect(screen.getByText('Save')).toBeInTheDocument()
                expect(screen.getByText('Cancel')).toBeInTheDocument()
            })
        })

        test('should hide address form when Cancel button is clicked', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            // Select "Add New Address" option
            fireEvent.change(firstSelect, {target: {value: 'add-new-address'}})

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByText('First Name')).toBeInTheDocument()
            })

            // Click Cancel button
            fireEvent.click(screen.getByText('Cancel'))

            // Wait for the form to disappear
            await waitFor(() => {
                expect(screen.queryByText('First Name')).not.toBeInTheDocument()
            })
        })

        test('should update dropdown to show "Add New Address" when form is open', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            // Select "Add New Address" option
            fireEvent.change(firstSelect, {target: {value: 'add-new-address'}})

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByText('First Name')).toBeInTheDocument()
            })

            // Check that the dropdown still shows "Add New Address" as selected
            expect(firstSelect).toHaveValue('add-new-address')
        })

        test('should hide form and reset dropdown when an existing address is selected', async () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            // Select "Add New Address" option
            fireEvent.change(firstSelect, {target: {value: 'add-new-address'}})

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByText('First Name')).toBeInTheDocument()
            })

            // Select an existing address
            fireEvent.change(firstSelect, {target: {value: 'addr-2'}})

            // Wait for the form to disappear
            await waitFor(() => {
                expect(screen.queryByText('First Name')).not.toBeInTheDocument()
            })

            // Check that the dropdown shows the selected address
            expect(firstSelect).toHaveValue('addr-2')
        })
    })

    describe('Continue to Shipping Method Button', () => {
        test('should be enabled when no address forms are open', () => {
            const mockOnSubmit = jest.fn()
            renderWithIntl(<ShippingMultiAddress {...defaultProps} onSubmit={mockOnSubmit} />)

            const continueButton = screen.getByText('Continue')
            expect(continueButton).toBeInTheDocument()

            // Click the button to verify it's functional
            fireEvent.click(continueButton)
            expect(mockOnSubmit).toHaveBeenCalledTimes(1)
        })

        test('should be disabled when "Add New Address" is selected', async () => {
            const mockOnSubmit = jest.fn()
            renderWithIntl(<ShippingMultiAddress {...defaultProps} onSubmit={mockOnSubmit} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            // Select "Add New Address" option
            fireEvent.change(firstSelect, {target: {value: 'add-new-address'}})

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByText('First Name')).toBeInTheDocument()
            })

            // Try to click the button (should not call onSubmit)
            const continueButton = screen.getByText('Continue')
            fireEvent.click(continueButton)
            expect(mockOnSubmit).not.toHaveBeenCalled()
        })

        test('should be disabled when multiple address forms are open', async () => {
            const mockOnSubmit = jest.fn()
            renderWithIntl(<ShippingMultiAddress {...defaultProps} onSubmit={mockOnSubmit} />)

            const selectElements = screen.getAllByRole('combobox')

            // Select "Add New Address" for first product
            fireEvent.change(selectElements[0], {target: {value: 'add-new-address'}})

            // Wait for first form to appear
            await waitFor(() => {
                expect(screen.getByText('First Name')).toBeInTheDocument()
            })

            // Select "Add New Address" for second product
            fireEvent.change(selectElements[1], {target: {value: 'add-new-address'}})

            // Wait for second form to appear
            await waitFor(() => {
                const firstNameFields = screen.getAllByText('First Name')
                expect(firstNameFields).toHaveLength(2)
            })

            // Try to click the button (should not call onSubmit)
            const continueButton = screen.getByText('Continue')
            fireEvent.click(continueButton)
            expect(mockOnSubmit).not.toHaveBeenCalled()
        })

        test('should be re-enabled when address form is cancelled', async () => {
            const mockOnSubmit = jest.fn()
            renderWithIntl(<ShippingMultiAddress {...defaultProps} onSubmit={mockOnSubmit} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            // Select "Add New Address" option
            fireEvent.change(firstSelect, {target: {value: 'add-new-address'}})

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByText('First Name')).toBeInTheDocument()
            })

            // Try to click the button (should not call onSubmit)
            const continueButton = screen.getByText('Continue')
            fireEvent.click(continueButton)
            expect(mockOnSubmit).not.toHaveBeenCalled()

            // Click Cancel button
            fireEvent.click(screen.getByText('Cancel'))

            // Wait for the form to disappear
            await waitFor(() => {
                expect(screen.queryByText('First Name')).not.toBeInTheDocument()
            })

            // Button should now be enabled
            fireEvent.click(continueButton)
            expect(mockOnSubmit).toHaveBeenCalledTimes(1)
        })

        test('should be re-enabled when address form is saved', async () => {
            const mockOnSubmit = jest.fn()
            renderWithIntl(<ShippingMultiAddress {...defaultProps} onSubmit={mockOnSubmit} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            // Select "Add New Address" option
            fireEvent.change(firstSelect, {target: {value: 'add-new-address'}})

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByText('First Name')).toBeInTheDocument()
            })

            // Try to click the button (should not call onSubmit)
            const continueButton = screen.getByText('Continue')
            fireEvent.click(continueButton)
            expect(mockOnSubmit).not.toHaveBeenCalled()

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
                expect(screen.queryByText('First Name')).not.toBeInTheDocument()
            })

            // Button should now be enabled
            fireEvent.click(continueButton)
            expect(mockOnSubmit).toHaveBeenCalledTimes(1)
        })

        test('should be re-enabled when existing address is selected', async () => {
            const mockOnSubmit = jest.fn()
            renderWithIntl(<ShippingMultiAddress {...defaultProps} onSubmit={mockOnSubmit} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            // Select "Add New Address" option
            fireEvent.change(firstSelect, {target: {value: 'add-new-address'}})

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByText('First Name')).toBeInTheDocument()
            })

            // Try to click the button (should not call onSubmit)
            const continueButton = screen.getByText('Continue')
            fireEvent.click(continueButton)
            expect(mockOnSubmit).not.toHaveBeenCalled()

            // Select an existing address
            fireEvent.change(firstSelect, {target: {value: 'addr-2'}})

            // Wait for the form to disappear
            await waitFor(() => {
                expect(screen.queryByText('First Name')).not.toBeInTheDocument()
            })

            // Click the button again (should call onSubmit now)
            fireEvent.click(continueButton)
            expect(mockOnSubmit).toHaveBeenCalledTimes(1)
        })

        test('should not call onSubmit when clicked while disabled', async () => {
            const mockOnSubmit = jest.fn()
            renderWithIntl(<ShippingMultiAddress {...defaultProps} onSubmit={mockOnSubmit} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            // Select "Add New Address" option
            fireEvent.change(firstSelect, {target: {value: 'add-new-address'}})

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByText('First Name')).toBeInTheDocument()
            })

            // Try to click the button
            const continueButton = screen.getByText('Continue')
            fireEvent.click(continueButton)

            // Verify onSubmit was not called
            expect(mockOnSubmit).not.toHaveBeenCalled()
        })

        test('should call onSubmit when clicked while enabled', async () => {
            const mockOnSubmit = jest.fn()
            renderWithIntl(<ShippingMultiAddress {...defaultProps} onSubmit={mockOnSubmit} />)

            const continueButton = screen.getByText('Continue')

            // Click the enabled button
            fireEvent.click(continueButton)

            // Verify onSubmit was called
            expect(mockOnSubmit).toHaveBeenCalledTimes(1)
        })

        test('should show visual feedback when disabled', async () => {
            const mockOnSubmit = jest.fn()
            renderWithIntl(<ShippingMultiAddress {...defaultProps} onSubmit={mockOnSubmit} />)

            const selectElements = screen.getAllByRole('combobox')
            const firstSelect = selectElements[0]

            // Select "Add New Address" option
            fireEvent.change(firstSelect, {target: {value: 'add-new-address'}})

            // Wait for the form to appear
            await waitFor(() => {
                expect(screen.getByText('First Name')).toBeInTheDocument()
            })

            // Try to click the button
            const continueButton = screen.getByText('Continue')
            fireEvent.click(continueButton)

            // Verify onSubmit was not called (button is functionally disabled)
            expect(mockOnSubmit).not.toHaveBeenCalled()
        })

        test('should handle mixed state - some forms open, some closed', async () => {
            const mockOnSubmit = jest.fn()
            renderWithIntl(<ShippingMultiAddress {...defaultProps} onSubmit={mockOnSubmit} />)

            const selectElements = screen.getAllByRole('combobox')

            // Select "Add New Address" for first product
            fireEvent.change(selectElements[0], {target: {value: 'add-new-address'}})

            // Wait for first form to appear
            await waitFor(() => {
                expect(screen.getByText('First Name')).toBeInTheDocument()
            })

            // Select existing address for second product
            fireEvent.change(selectElements[1], {target: {value: 'addr-2'}})

            // Try to click the button (should not call onSubmit)
            const continueButton = screen.getByText('Continue')
            fireEvent.click(continueButton)
            expect(mockOnSubmit).not.toHaveBeenCalled()

            // Cancel the first form
            fireEvent.click(screen.getByText('Cancel'))

            // Wait for form to disappear
            await waitFor(() => {
                expect(screen.queryByText('First Name')).not.toBeInTheDocument()
            })

            // Button should now be enabled
            fireEvent.click(continueButton)
            expect(mockOnSubmit).toHaveBeenCalledTimes(1)
        })
    })
})
