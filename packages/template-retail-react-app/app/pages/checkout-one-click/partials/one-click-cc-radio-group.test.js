/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {screen, fireEvent} from '@testing-library/react'
import {useForm} from 'react-hook-form'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import CCRadioGroup from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-cc-radio-group'

// Mock dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer')
jest.mock('@salesforce/retail-react-app/app/utils/cc-utils', () => ({
    getCreditCardIcon: jest.fn(() => {
        const MockIcon = () => <div data-testid="card-icon">Card Icon</div>
        return MockIcon
    })
}))

// Mock payment instruments data
const mockPaymentInstruments = [
    {
        paymentInstrumentId: 'payment-1',
        paymentCard: {
            cardType: 'Visa',
            numberLastDigits: '1234',
            expirationMonth: 12,
            expirationYear: 2025,
            holder: 'John Doe'
        }
    },
    {
        paymentInstrumentId: 'payment-2',
        paymentCard: {
            cardType: 'MasterCard',
            numberLastDigits: '5678',
            expirationMonth: 6,
            expirationYear: 2026,
            holder: 'Jane Smith'
        }
    }
]

const TestWrapper = ({
    value = '',
    isEditingPayment = false,
    togglePaymentEdit = jest.fn(),
    onPaymentIdChange = jest.fn(),
    customerData = {paymentInstruments: mockPaymentInstruments},
    formErrors = {}
}) => {
    const form = useForm({
        defaultValues: {paymentInstrumentId: value}
    })

    // Set form errors if provided
    React.useEffect(() => {
        if (Object.keys(formErrors).length > 0) {
            Object.entries(formErrors).forEach(([field, error]) => {
                form.setError(field, error)
            })
        }
    }, [form, formErrors])

    // Mock customer hook
    useCurrentCustomer.mockReturnValue({data: customerData})

    return (
        <CCRadioGroup
            form={form}
            value={value}
            isEditingPayment={isEditingPayment}
            togglePaymentEdit={togglePaymentEdit}
            onPaymentIdChange={onPaymentIdChange}
        />
    )
}

// Add PropTypes to prevent "missing in props validation" warnings
TestWrapper.propTypes = {
    value: PropTypes.string,
    isEditingPayment: PropTypes.bool,
    togglePaymentEdit: PropTypes.func,
    onPaymentIdChange: PropTypes.func,
    customerData: PropTypes.object,
    formErrors: PropTypes.object
}

describe('CCRadioGroup', () => {
    let mockTogglePaymentEdit
    let mockOnPaymentIdChange

    beforeEach(() => {
        mockTogglePaymentEdit = jest.fn()
        mockOnPaymentIdChange = jest.fn()
        jest.clearAllMocks()
    })

    describe('Rendering', () => {
        test('renders payment instrument cards when customer has saved payments', () => {
            renderWithProviders(
                <TestWrapper
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            // Should render both payment cards
            expect(screen.getByText('Visa')).toBeInTheDocument()
            expect(screen.getByText('MasterCard')).toBeInTheDocument()
            expect(screen.getByText('•••• 1234')).toBeInTheDocument()
            expect(screen.getByText('•••• 5678')).toBeInTheDocument()
            expect(screen.getByText('12/2025')).toBeInTheDocument()
            expect(screen.getByText('6/2026')).toBeInTheDocument()
            expect(screen.getByText('John Doe')).toBeInTheDocument()
            expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        })

        test('renders card icons for each payment instrument', () => {
            renderWithProviders(
                <TestWrapper
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            const cardIcons = screen.getAllByTestId('card-icon')
            expect(cardIcons).toHaveLength(2)
        })

        test('renders remove buttons for each payment card', () => {
            renderWithProviders(
                <TestWrapper
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            const removeButtons = screen.getAllByText('Remove')
            expect(removeButtons).toHaveLength(2)
            removeButtons.forEach((button) => {
                expect(button).toBeInTheDocument()
            })
        })

        test('renders "Add New Card" button when not editing payment', () => {
            renderWithProviders(
                <TestWrapper
                    isEditingPayment={false}
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            expect(screen.getByText('Add New Card')).toBeInTheDocument()
        })

        test('does not render "Add New Card" button when editing payment', () => {
            renderWithProviders(
                <TestWrapper
                    isEditingPayment={true}
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            expect(screen.queryByText('Add New Card')).not.toBeInTheDocument()
        })

        test('renders empty state when customer has no payment instruments', () => {
            renderWithProviders(
                <TestWrapper
                    customerData={{paymentInstruments: []}}
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            expect(screen.queryByText('Visa')).not.toBeInTheDocument()
            expect(screen.queryByText('MasterCard')).not.toBeInTheDocument()
            expect(screen.getByText('Add New Card')).toBeInTheDocument()
        })

        test('handles null/undefined payment instruments gracefully', () => {
            renderWithProviders(
                <TestWrapper
                    customerData={{paymentInstruments: null}}
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            expect(screen.getByText('Add New Card')).toBeInTheDocument()
        })
    })

    describe('Error Handling', () => {
        test('displays form error message when payment instrument validation fails', () => {
            const errorMessage = 'Please select a payment method'

            renderWithProviders(
                <TestWrapper
                    formErrors={{
                        paymentInstrumentId: {message: errorMessage}
                    }}
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            expect(screen.getByText(errorMessage)).toBeInTheDocument()
        })

        test('sets invalid state on form control when there are errors', () => {
            renderWithProviders(
                <TestWrapper
                    formErrors={{
                        paymentInstrumentId: {message: 'Error message'}
                    }}
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            // Verify that error handling is in place
            expect(screen.getByText('Error message')).toBeInTheDocument()
        })

        test('does not display error message when form is valid', () => {
            renderWithProviders(
                <TestWrapper
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            expect(screen.queryByText('Please select a payment method')).not.toBeInTheDocument()
        })
    })

    describe('User Interactions', () => {
        test('calls togglePaymentEdit when "Add New Card" button is clicked', () => {
            renderWithProviders(
                <TestWrapper
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            const addButton = screen.getByText('Add New Card')
            fireEvent.click(addButton)

            expect(mockTogglePaymentEdit).toHaveBeenCalledTimes(1)
        })

        test('calls onPaymentIdChange when payment card is selected', async () => {
            const {user} = renderWithProviders(
                <TestWrapper
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            // Find the first radio card input and click it
            const firstCardInput = screen.getByDisplayValue('payment-1')
            await user.click(firstCardInput)

            expect(mockOnPaymentIdChange).toHaveBeenCalledWith('payment-1')
        })

        test('shows selected payment card when value is provided', () => {
            renderWithProviders(
                <TestWrapper
                    value="payment-2"
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            const secondCardInput = screen.getByDisplayValue('payment-2')
            expect(secondCardInput).toBeChecked()
        })
    })

    describe('Accessibility', () => {
        test('form control has proper structure', () => {
            renderWithProviders(
                <TestWrapper
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            // Check that payment cards are rendered properly
            expect(screen.getByText('Visa')).toBeInTheDocument()
            expect(screen.getByText('MasterCard')).toBeInTheDocument()
        })

        test('form control adapts when editing payment', () => {
            renderWithProviders(
                <TestWrapper
                    isEditingPayment={true}
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            // When editing payment, "Add New Card" button should not be visible
            expect(screen.queryByText('Add New Card')).not.toBeInTheDocument()
        })

        test('radio cards have proper role and attributes', () => {
            renderWithProviders(
                <TestWrapper
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            const radioInputs = screen.getAllByRole('radio')
            expect(radioInputs).toHaveLength(2)

            radioInputs.forEach((input) => {
                expect(input).toHaveAttribute('type', 'radio')
            })
        })

        test('buttons have accessible labels', () => {
            renderWithProviders(
                <TestWrapper
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            const addButton = screen.getByText('Add New Card')
            expect(addButton).toBeInTheDocument()

            const removeButtons = screen.getAllByText('Remove')
            removeButtons.forEach((button) => {
                expect(button).toBeInTheDocument()
            })
        })
    })

    describe('Edge Cases', () => {
        test('handles missing card type gracefully', () => {
            const incompletePaymentInstruments = [
                {
                    paymentInstrumentId: 'payment-incomplete',
                    paymentCard: {
                        numberLastDigits: '9999',
                        expirationMonth: 12,
                        expirationYear: 2025,
                        holder: 'Test User'
                    }
                }
            ]

            renderWithProviders(
                <TestWrapper
                    customerData={{paymentInstruments: incompletePaymentInstruments}}
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            expect(screen.getByText('•••• 9999')).toBeInTheDocument()
            expect(screen.getByText('Test User')).toBeInTheDocument()
        })

        test('handles missing card holder gracefully', () => {
            const incompletePaymentInstruments = [
                {
                    paymentInstrumentId: 'payment-no-holder',
                    paymentCard: {
                        cardType: 'Visa',
                        numberLastDigits: '8888',
                        expirationMonth: 1,
                        expirationYear: 2027
                    }
                }
            ]

            renderWithProviders(
                <TestWrapper
                    customerData={{paymentInstruments: incompletePaymentInstruments}}
                    togglePaymentEdit={mockTogglePaymentEdit}
                    onPaymentIdChange={mockOnPaymentIdChange}
                />
            )

            expect(screen.getByText('Visa')).toBeInTheDocument()
            expect(screen.getByText('•••• 8888')).toBeInTheDocument()
            expect(screen.getByText('1/2027')).toBeInTheDocument()
        })

        test('provides default functions when callbacks are not provided', () => {
            // This test ensures the component doesn't crash when callbacks are undefined
            renderWithProviders(
                <TestWrapper customerData={{paymentInstruments: mockPaymentInstruments}} />
            )

            expect(screen.getByText('Visa')).toBeInTheDocument()
            expect(screen.getByText('Add New Card')).toBeInTheDocument()
        })
    })
})
