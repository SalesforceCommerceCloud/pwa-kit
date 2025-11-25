/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address-selection'

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

const mockCustomer = {
    addresses: []
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

    test('renders address form by default', () => {
        const {container} = render(<ShippingAddressSelection />)
        // Ensure the form element is present
        expect(container.querySelector('form')).toBeInTheDocument()
    })

    test('renders saved addresses with Edit/Remove buttons when customer has addresses', () => {
        useCurrentCustomer.mockReturnValue({
            data: {
                addresses: [
                    {
                        addressId: 'addr-1',
                        address1: '123 Main St',
                        city: 'NYC',
                        stateCode: 'NY',
                        postalCode: '10001',
                        countryCode: 'US',
                        preferred: true
                    }
                ]
            },
            isLoading: false,
            isFetching: false
        })
        render(<ShippingAddressSelection />)
        // In this test harness, aria-labels are untranslated ids
        expect(
            screen.getByRole('button', {name: /shipping_address\.label\.remove_button/i})
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', {name: /shipping_address\.label\.edit_button/i})
        ).toBeInTheDocument()
    })

    describe('Billing Address Mode', () => {
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

            // Component should render without errors
            expect(screen.queryByTestId('error')).not.toBeInTheDocument()
        })

        test('returns null while registered customer is loading', () => {
            useCurrentCustomer.mockReturnValue({
                data: {addresses: [], isRegistered: true},
                isLoading: true,
                isFetching: true
            })
            const {container} = render(<ShippingAddressSelection />)
            // Nothing should render yet
            expect(container.firstChild).toBeNull()
        })
    })

    describe('Billing/Registered Effects', () => {
        // Skipped: creating a real RHF form instance in this test context causes hook errors

        test('sets preferred=true when customer becomes registered', () => {
            const setValue = jest.fn()
            const mockForm = {
                handleSubmit: jest.fn(() => (e) => e?.preventDefault?.()),
                reset: jest.fn(),
                setValue,
                formState: {isSubmitting: false}
            }
            useCurrentCustomer.mockReturnValue({
                data: {addresses: [], isRegistered: true},
                isLoading: false,
                isFetching: false
            })
            render(<ShippingAddressSelection form={mockForm} isBillingAddress={false} />)
            expect(setValue).toHaveBeenCalledWith('preferred', true, {
                shouldValidate: false,
                shouldDirty: true
            })
        })
    })

    describe('Interactions', () => {
        test('shows edit form when clicking Add New Address', async () => {
            useCurrentCustomer.mockReturnValue({
                data: {
                    addresses: [
                        {
                            addressId: 'addr-1',
                            address1: '123 Main St'
                        }
                    ]
                },
                isLoading: false,
                isFetching: false
            })
            render(<ShippingAddressSelection />)
            // Click Add New Address
            await userEvent.click(
                screen.getByRole('button', {
                    name: /shipping_address_selection\.button\.add_address/i
                })
            )
            // Edit form should appear
            expect(screen.getByTestId('sf-shipping-address-edit-form')).toBeInTheDocument()
        })

        test('removes saved address via mutation', async () => {
            const mutateAsync = jest.fn().mockResolvedValue({})
            useShopperCustomersMutation.mockReturnValue({mutateAsync})
            useCurrentCustomer.mockReturnValue({
                data: {
                    customerId: 'cust-1',
                    addresses: [
                        {
                            addressId: 'addr-1',
                            address1: '123 Main St'
                        }
                    ]
                },
                isLoading: false,
                isFetching: false
            })
            render(<ShippingAddressSelection />)
            // Click Remove button by aria-label id
            await userEvent.click(
                screen.getByRole('button', {name: /shipping_address\.label\.remove_button/i})
            )
            // Assert mutation called
            expect(mutateAsync).toHaveBeenCalled()
        })
    })
})
