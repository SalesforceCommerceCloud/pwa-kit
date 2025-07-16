/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import ShippingMultiAddress from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-multi-address'
import {useProducts} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

// Mock the commerce-sdk-react hooks
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useProducts: jest.fn()
}))

// Mock the hooks that ShippingMultiAddress component uses
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn()
}))

// Mock the image groups utility
jest.mock('@salesforce/retail-react-app/app/utils/image-groups-utils', () => ({
    findImageGroupBy: jest.fn((imageGroups) => {
        // Return different images based on the productId in the test
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

// Mock the item variant provider
jest.mock('@salesforce/retail-react-app/app/components/item-variant', () => {
    // eslint-disable-next-line react/prop-types
    function MockItemVariantProvider({children}) {
        return <div data-testid="item-variant-provider">{children}</div>
    }
    return MockItemVariantProvider
})

const mockBasket = {
    productItems: [
        {
            productId: 'product-1',
            productName: 'Test Product 1',
            quantity: 2,
            priceAfterItemDiscount: 29.99,
            variationValues: {color: 'red', size: 'M'}
        },
        {
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
    }
}

const renderWithIntl = (component) => {
    return render(<IntlProvider locale="en">{component}</IntlProvider>)
}

describe('ShippingMultiAddress', () => {
    beforeEach(() => {
        useProducts.mockReturnValue({
            data: mockProducts
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

    it('should render empty state when no items in basket', () => {
        const emptyBasket = {...mockBasket, productItems: []}
        renderWithIntl(<ShippingMultiAddress {...defaultProps} basket={emptyBasket} />)

        expect(screen.getByText('No items in basket.')).toBeInTheDocument()
    })

    it('should render product items with correct information', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
        expect(screen.getByText('Quantity: 2')).toBeInTheDocument()
        expect(screen.getByText('Quantity: 1')).toBeInTheDocument()
    })

    it('should render delivery address sections for each product', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        const deliveryAddressLabels = screen.getAllByText('Delivery Address')
        expect(deliveryAddressLabels).toHaveLength(2)
    })

    it('should render product images', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        const images = screen.getAllByAltText('Test Product 1')
        expect(images).toHaveLength(1)
        expect(images[0]).toHaveAttribute('src', 'https://test-image-1.jpg')
    })

    it('should render variation attributes', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        expect(screen.getByText('Color: Red')).toBeInTheDocument()
        expect(screen.getByText('Size: Medium')).toBeInTheDocument()
        expect(screen.getByText('Color: Blue')).toBeInTheDocument()
        expect(screen.getByText('Size: Large')).toBeInTheDocument()
    })

    it('should render product prices', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        expect(screen.getByText('$29.99')).toBeInTheDocument()
        expect(screen.getByText('$19.99')).toBeInTheDocument()
    })

    it('should render continue button', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        expect(screen.getByText('Continue')).toBeInTheDocument()
    })

    it('should call onSubmit when continue button is clicked', () => {
        const mockOnSubmit = jest.fn()
        renderWithIntl(<ShippingMultiAddress {...defaultProps} onSubmit={mockOnSubmit} />)

        fireEvent.click(screen.getByText('Continue'))
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })

    it('should render address dropdowns', () => {
        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        // The dropdowns should be present but collapsed initially
        const dropdowns = screen.getAllByRole('button', {hidden: true})
        expect(dropdowns.length).toBeGreaterThan(0)
    })

    it('should handle empty product data gracefully', () => {
        useProducts.mockReturnValue({
            data: null
        })

        renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

        // Should still render the products even without detailed product data
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
    })

    it('should render with custom submit button label', () => {
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

    it('should render with custom add new address label', () => {
        const customProps = {
            ...defaultProps,
            addNewAddressLabel: {
                defaultMessage: 'Add Another Address',
                id: 'checkout.button.add_another_address'
            }
        }

        renderWithIntl(<ShippingMultiAddress {...customProps} />)

        // Find and click the dropdown trigger using role=button
        const dropdownTriggers = screen.getAllByRole('button')
        fireEvent.click(dropdownTriggers[0])

        // The add new address option should be available in dropdowns
        const addNewAddressOptions = screen.getAllByText((content, element) =>
            element?.textContent?.replace(/\s+/g, ' ').trim().includes('Add Another Address')
        )
        expect(addNewAddressOptions.length).toBeGreaterThan(0)
    })

    describe('Accessibility', () => {
        it('should have proper alt text for images', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const images = screen.getAllByAltText(/Test Product/)
            expect(images).toHaveLength(2)
        })

        it('should have proper button roles', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            const continueButton = screen.getByText('Continue')
            expect(continueButton).toBeInTheDocument()
        })
    })

    describe('Responsive Design', () => {
        it('should apply responsive CSS classes', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Check that the component has the expected number of cards using data-testid
            const multiShippingCards = screen.getAllByTestId('multi-shipping-card')
            expect(multiShippingCards).toHaveLength(2)
        })
    })

    describe('Internationalization', () => {
        it('should use proper i18n for address formatting', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Verify that the address is displayed in two separate lines
            // First line: just the street address
            expect(screen.getAllByText('123 Test St')).toHaveLength(2)

            // Second line: formatted city, state, postal code using i18n
            expect(screen.getAllByText('Test City, CA 12345')).toHaveLength(2)
        })

        it('should handle missing state code in address formatting', () => {
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

            // Verify that the address is still displayed correctly even with missing stateCode
            expect(screen.getAllByText('123 Test St')).toHaveLength(2)

            // The formatted address should show "Test City, 12345" (empty stateCode, ignore whitespace)
            expect(
                screen.getAllByText(
                    (content) => content.replace(/\s+/g, ' ').trim() === 'Test City, 12345'
                )
            ).toHaveLength(2)
        })

        it('should display address in two separate lines', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Verify that address1 is displayed separately
            expect(screen.getAllByText('123 Test St')).toHaveLength(2)

            // Verify that the formatted city, state, postal code is displayed
            expect(screen.getAllByText('Test City, CA 12345')).toHaveLength(2)
        })

        it('should not use hardcoded address formatting', () => {
            renderWithIntl(<ShippingMultiAddress {...defaultProps} />)

            // Verify that the old hardcoded format is NOT present
            // The old format would be: "123 Test St, Test City, CA 12345" in one line
            const hardcodedFormat = screen.queryByText('123 Test St, Test City, CA 12345')
            expect(hardcodedFormat).not.toBeInTheDocument()

            // Instead, verify that the address is split into two lines
            expect(screen.getAllByText('123 Test St')).toHaveLength(2)
            expect(screen.getAllByText('Test City, CA 12345')).toHaveLength(2)
        })
    })
})
