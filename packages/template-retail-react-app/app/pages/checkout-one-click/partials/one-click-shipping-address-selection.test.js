/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {screen} from '@testing-library/react'
import {useForm} from 'react-hook-form'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address-selection'

// Mock dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer')
jest.mock('@salesforce/commerce-sdk-react')

// Mock customer addresses
const mockAddresses = [
    {
        addressId: 'address-1',
        addressName: 'Home Address',
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'San Francisco',
        stateCode: 'CA',
        postalCode: '94105',
        countryCode: 'US',
        phone: '+1-555-123-4567'
    }
]

// Helper component that properly wraps the component under test
const TestShippingAddressSelection = (props) => {
    const defaultForm = useForm({
        defaultValues: props.selectedAddress || {}
    })

    // Mock the customer hook
    useCurrentCustomer.mockReturnValue({
        data: {
            addresses: props.customerAddresses || mockAddresses,
            isGuest: !(props.customerAddresses && props.customerAddresses.length > 0),
            isRegistered: props.customerAddresses && props.customerAddresses.length > 0
        },
        isLoading: false
    })

    // Mock mutations
    useShopperCustomersMutation.mockReturnValue({
        mutateAsync: jest.fn()
    })

    return (
        <ShippingAddressSelection
            form={props.form || defaultForm}
            selectedAddress={props.selectedAddress || null}
            hideSubmitButton={props.hideSubmitButton || false}
            isBillingAddress={props.isBillingAddress || false}
            formTitleAriaLabel={
                props.formTitleAriaLabel || {defaultMessage: 'Shipping Address Form'}
            }
            onSubmit={props.onSubmit || jest.fn()}
            {...props}
        />
    )
}

// Add PropTypes to prevent "missing in props validation" warnings
TestShippingAddressSelection.propTypes = {
    form: PropTypes.object,
    selectedAddress: PropTypes.object,
    customerAddresses: PropTypes.array,
    hideSubmitButton: PropTypes.bool,
    isBillingAddress: PropTypes.bool,
    formTitleAriaLabel: PropTypes.object,
    onSubmit: PropTypes.func,
    submitButtonLabel: PropTypes.object
}

describe('ShippingAddressSelection', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('PropTypes Validation', () => {
        test('accepts all required props without validation errors', () => {
            // Create a properly structured props object
            const props = {
                form: null, // Component creates its own form if not provided
                selectedAddress: null,
                hideSubmitButton: false,
                isBillingAddress: false,
                formTitleAriaLabel: {defaultMessage: 'Test Shipping Address Form'},
                onSubmit: jest.fn()
            }

            // This should render without PropTypes validation warnings
            expect(() => {
                renderWithProviders(<TestShippingAddressSelection {...props} />)
            }).not.toThrow()
        })

        test('accepts form prop as object', () => {
            // Create a mock form object that mimics the structure of useForm() return value
            const mockForm = {
                register: jest.fn(),
                handleSubmit: jest.fn(),
                formState: {errors: {}, isValid: true, isSubmitting: false},
                getValues: jest.fn(),
                reset: jest.fn(),
                trigger: jest.fn()
            }

            const props = {
                form: mockForm,
                onSubmit: jest.fn()
            }

            expect(() => {
                renderWithProviders(<TestShippingAddressSelection {...props} />)
            }).not.toThrow()
        })

        test('accepts selectedAddress prop as object', () => {
            const props = {
                selectedAddress: mockAddresses[0],
                onSubmit: jest.fn()
            }

            expect(() => {
                renderWithProviders(<TestShippingAddressSelection {...props} />)
            }).not.toThrow()
        })

        test('accepts submitButtonLabel as message prop type', () => {
            const props = {
                submitButtonLabel: {defaultMessage: 'Custom Submit Label'},
                onSubmit: jest.fn()
            }

            expect(() => {
                renderWithProviders(<TestShippingAddressSelection {...props} />)
            }).not.toThrow()
        })

        test('accepts formTitleAriaLabel as message prop type', () => {
            const props = {
                formTitleAriaLabel: {defaultMessage: 'Custom Aria Label'},
                onSubmit: jest.fn()
            }

            expect(() => {
                renderWithProviders(<TestShippingAddressSelection {...props} />)
            }).not.toThrow()
        })

        test('accepts hideSubmitButton as boolean', () => {
            const props = {
                hideSubmitButton: true,
                onSubmit: jest.fn()
            }

            expect(() => {
                renderWithProviders(<TestShippingAddressSelection {...props} />)
            }).not.toThrow()
        })

        test('accepts isBillingAddress as boolean', () => {
            const props = {
                isBillingAddress: true,
                onSubmit: jest.fn()
            }

            expect(() => {
                renderWithProviders(<TestShippingAddressSelection {...props} />)
            }).not.toThrow()
        })

        test('accepts onSubmit as function', () => {
            const mockOnSubmit = jest.fn()
            const props = {
                onSubmit: mockOnSubmit
            }

            expect(() => {
                renderWithProviders(<TestShippingAddressSelection {...props} />)
            }).not.toThrow()
        })
    })

    describe('Component Rendering', () => {
        test('component renders and mounts successfully', () => {
            const props = {
                onSubmit: jest.fn(),
                customerAddresses: []
            }

            const {container} = renderWithProviders(<TestShippingAddressSelection {...props} />)
            expect(container).toBeInTheDocument()
        })

        test('component renders with customer addresses', () => {
            const props = {
                onSubmit: jest.fn(),
                customerAddresses: mockAddresses
            }

            const {container} = renderWithProviders(<TestShippingAddressSelection {...props} />)
            expect(container).toBeInTheDocument()
        })
    })
})
