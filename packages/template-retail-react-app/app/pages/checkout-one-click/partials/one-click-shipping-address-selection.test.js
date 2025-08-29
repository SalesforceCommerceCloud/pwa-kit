/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable react/prop-types */
import React from 'react'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import ShippingAddressSelection from '@salesforce/retail-react-app/../../app/pages/checkout-one-click/partials/one-click-shipping-address-selection'

// Mock react-intl
jest.mock('react-intl', () => ({
    ...jest.requireActual('react-intl'),
    useIntl: () => ({
        formatMessage: jest.fn((descriptor, values) => {
            if (typeof descriptor === 'string') return descriptor
            if (descriptor && typeof descriptor.defaultMessage === 'string') {
                let message = descriptor.defaultMessage
                if (values) {
                    Object.keys(values).forEach((key) => {
                        message = message.replace(`{${key}}`, values[key])
                    })
                }
                return message
            }
            if (descriptor && typeof descriptor.id === 'string') return descriptor.id
            return 'Formatted Message'
        })
    }),
    FormattedMessage: ({defaultMessage, children, id}) => {
        if (typeof defaultMessage === 'string') return defaultMessage
        if (typeof children === 'string') return children
        if (typeof id === 'string') return id
        return 'Formatted Message'
    },
    defineMessage: (descriptor) => descriptor
}))

// Mock dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer')
jest.mock('@salesforce/commerce-sdk-react')
jest.mock('react-hook-form', () => ({
    useForm: () => ({
        handleSubmit: jest.fn((callback) => (e) => {
            e?.preventDefault?.()
            callback({
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Main St',
                city: 'New York',
                stateCode: 'NY',
                postalCode: '10001',
                countryCode: 'US'
            })
        }),
        reset: jest.fn(),
        formState: {errors: {}},
        control: {}
    }),
    Controller: ({children}) => children
}))

// Mock sub-components
jest.mock('@salesforce/retail-react-app/app/components/radio-card', () => ({
    RadioCard: ({children, value, ...props}) => (
        <div data-testid={`radio-card-${value}`} data-value={value} {...props}>
            {children}
        </div>
    ),
    RadioCardGroup: ({children, onChange}) => (
        <div data-testid="radio-card-group" onChange={onChange}>
            {children}
        </div>
    )
}))

jest.mock('@salesforce/retail-react-app/app/components/action-card', () => {
    return function ActionCard({children, ...props}) {
        return (
            <div data-testid="action-card" {...props}>
                {children}
            </div>
        )
    }
})

jest.mock('@salesforce/retail-react-app/app/components/address-display', () => {
    return function AddressDisplay({address}) {
        return (
            <div data-testid="address-display">
                {address?.firstName} {address?.lastName}
                <br />
                {address?.address1}
            </div>
        )
    }
})

jest.mock('@salesforce/retail-react-app/app/components/forms/address-fields', () => {
    return function AddressFields() {
        return (
            <div data-testid="address-fields">
                <input aria-label="First Name" data-testid="first-name" />
                <input aria-label="Last Name" data-testid="last-name" />
                <input aria-label="Street Address" data-testid="street-address" />
            </div>
        )
    }
})

jest.mock('@salesforce/retail-react-app/app/components/forms/form-action-buttons', () => {
    return function FormActionButtons({onCancel, onSubmit}) {
        return (
            <div data-testid="form-action-buttons">
                <button type="button" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" onClick={onSubmit}>
                    Save
                </button>
            </div>
        )
    }
})

jest.mock('@salesforce/retail-react-app/app/components/icons', () => ({
    PlusIcon: () => <div data-testid="plus-icon">+</div>
}))

const mockAddresses = [
    {
        addressId: 'address-1',
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        stateCode: 'NY',
        postalCode: '10001',
        countryCode: 'US',
        preferred: true
    },
    {
        addressId: 'address-2',
        firstName: 'Jane',
        lastName: 'Smith',
        address1: '456 Oak Ave',
        city: 'Los Angeles',
        stateCode: 'CA',
        postalCode: '90210',
        countryCode: 'US',
        preferred: false
    }
]

const mockCustomer = {
    addresses: mockAddresses
}

describe('ShippingAddressSelection Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            isLoading: false,
            isFetching: false
        })
        useShopperCustomersMutation.mockReturnValue({
            mutateAsync: jest.fn().mockResolvedValue({})
        })
    })

    describe('Rendering', () => {
        test('renders address selection component', () => {
            render(<ShippingAddressSelection />)

            expect(screen.getByTestId('radio-card-group')).toBeInTheDocument()
        })

        test('displays saved addresses', () => {
            render(<ShippingAddressSelection />)

            expect(screen.getByTestId('radio-card-address-1')).toBeInTheDocument()
            expect(screen.getByTestId('radio-card-address-2')).toBeInTheDocument()
            expect(screen.getByText('John Doe')).toBeInTheDocument()
            expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        })

        test('shows "Add New Address" button', () => {
            render(<ShippingAddressSelection />)

            expect(
                screen.getByText('shipping_address_selection.button.add_new_address')
            ).toBeInTheDocument()
            expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
        })

        test('renders correctly for customers without saved addresses', () => {
            useCurrentCustomer.mockReturnValue({
                data: {addresses: []},
                isLoading: false,
                isFetching: false
            })

            render(<ShippingAddressSelection />)

            expect(screen.getByTestId('address-fields')).toBeInTheDocument()
        })

        test('handles loading state', () => {
            useCurrentCustomer.mockReturnValue({
                data: {addresses: []},
                isLoading: true,
                isFetching: true
            })

            render(<ShippingAddressSelection />)

            // Component should still render but may show loading indicators
            expect(screen.getByTestId('address-fields')).toBeInTheDocument()
        })
    })

    describe('User Interactions', () => {
        test('allows editing an address', async () => {
            const user = userEvent.setup()

            render(<ShippingAddressSelection />)

            const editButton = screen.getByText('Edit 123 Main St')
            await user.click(editButton)

            expect(screen.getByTestId('address-fields')).toBeInTheDocument()
        })

        test('allows removing an address', async () => {
            const user = userEvent.setup()
            const mockRemoveAddress = jest.fn().mockResolvedValue({})
            useShopperCustomersMutation.mockReturnValue({
                mutateAsync: mockRemoveAddress
            })

            render(<ShippingAddressSelection />)

            const removeButton = screen.getByText('Remove 123 Main St')
            await user.click(removeButton)

            expect(mockRemoveAddress).toHaveBeenCalledWith({
                parameters: {
                    customerId: undefined,
                    addressName: 'address-1'
                }
            })
        })

        test('allows adding a new address', async () => {
            const user = userEvent.setup()

            render(<ShippingAddressSelection />)

            const addNewButton = screen.getByText(
                'shipping_address_selection.button.add_new_address'
            )
            await user.click(addNewButton)

            expect(screen.getByTestId('address-fields')).toBeInTheDocument()
        })

        test('handles form submission', async () => {
            const user = userEvent.setup()

            render(<ShippingAddressSelection />)

            const addNewButton = screen.getByText(
                'shipping_address_selection.button.add_new_address'
            )
            await user.click(addNewButton)

            const submitButton = screen.getByText('Save')
            await user.click(submitButton)

            // Form should be handled by parent component
            expect(screen.getByTestId('address-fields')).toBeInTheDocument()
        })
    })

    describe('Billing Address Mode', () => {
        test('renders correctly when used for billing address', () => {
            render(<ShippingAddressSelection isBillingAddress={true} />)

            expect(screen.getByTestId('radio-card-group')).toBeInTheDocument()
        })

        test('hides submit button when requested', () => {
            render(<ShippingAddressSelection hideSubmitButton={true} />)

            expect(screen.queryByText('Submit')).not.toBeInTheDocument()
        })
    })

    describe('Edge Cases', () => {
        test('handles customer with null addresses', () => {
            useCurrentCustomer.mockReturnValue({
                data: {addresses: null},
                isLoading: false,
                isFetching: false
            })

            render(<ShippingAddressSelection />)

            expect(screen.getByTestId('address-fields')).toBeInTheDocument()
        })

        test('handles undefined customer data', () => {
            useCurrentCustomer.mockReturnValue({
                data: undefined,
                isLoading: false,
                isFetching: false
            })

            render(<ShippingAddressSelection />)

            expect(screen.getByTestId('address-fields')).toBeInTheDocument()
        })

        test('handles custom form object', () => {
            const customForm = {
                handleSubmit: jest.fn(),
                reset: jest.fn(),
                formState: {errors: {}},
                control: {}
            }

            render(<ShippingAddressSelection form={customForm} />)

            expect(screen.getByTestId('radio-card-group')).toBeInTheDocument()
        })

        test('handles selected address prop', () => {
            const selectedAddress = mockAddresses[0]

            render(<ShippingAddressSelection selectedAddress={selectedAddress} />)

            expect(screen.getByTestId('radio-card-group')).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        test('has proper form structure', () => {
            render(<ShippingAddressSelection />)

            expect(screen.getByTestId('radio-card-group')).toBeInTheDocument()
        })

        test('edit and remove buttons have accessible labels', () => {
            render(<ShippingAddressSelection />)

            expect(screen.getByText('Edit 123 Main St')).toBeInTheDocument()
            expect(screen.getByText('Remove 123 Main St')).toBeInTheDocument()
        })
    })
})
