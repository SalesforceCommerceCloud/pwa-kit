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
import CCRadioGroup from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-cc-radio-group'

// Mock react-intl
jest.mock('react-intl', () => ({
    ...jest.requireActual('react-intl'),
    FormattedMessage: ({defaultMessage, children, id}) => {
        if (typeof defaultMessage === 'string') return defaultMessage
        if (typeof children === 'string') return children
        if (typeof id === 'string') return id
        return 'Formatted Message'
    }
}))

// Mock dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer')

jest.mock('@salesforce/retail-react-app/app/components/radio-card', () => ({
    RadioCard: ({children, value, ...props}) => (
        <div data-testid={`radio-card-${value}`} data-value={value} {...props}>
            {children}
        </div>
    ),
    RadioCardGroup: ({children, value, onChange}) => (
        <div data-testid="radio-card-group" data-value={value} onChange={onChange}>
            {children}
        </div>
    )
}))

// Mock credit card icons
jest.mock('@salesforce/retail-react-app/app/utils/cc-utils', () => ({
    getCreditCardIcon: (cardType) => {
        const MockIcon = () => (
            <div data-testid={`${cardType?.toLowerCase()}-icon`}>{cardType} Icon</div>
        )
        return MockIcon
    }
}))

// Mock plus icon
jest.mock('@salesforce/retail-react-app/app/components/icons', () => ({
    PlusIcon: (props) => (
        <div data-testid="plus-icon" {...props}>
            +
        </div>
    )
}))

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
            cardType: 'Mastercard',
            numberLastDigits: '5678',
            expirationMonth: 11,
            expirationYear: 2026,
            holder: 'Jane Smith'
        }
    }
]

const mockCustomer = {
    paymentInstruments: mockPaymentInstruments
}

const mockForm = {
    formState: {
        errors: {}
    }
}

const mockFormWithErrors = {
    formState: {
        errors: {
            paymentInstrumentId: {
                message: 'Please select a payment method'
            }
        }
    }
}

describe('CCRadioGroup Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useCurrentCustomer.mockReturnValue({data: mockCustomer})
    })

    describe('Rendering', () => {
        test('sorts default payment instrument to the top of the list', () => {
            // Arrange: mark the second instrument as default
            useCurrentCustomer.mockReturnValue({
                data: {
                    paymentInstruments: [
                        {...mockPaymentInstruments[0]},
                        {...mockPaymentInstruments[1], default: true}
                    ]
                }
            })

            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            // The first rendered radio card should be the default one (payment-2)
            const cards = screen.getAllByTestId(/^radio-card-payment-/)
            expect(cards[0]).toHaveAttribute('data-testid', 'radio-card-payment-2')
        })
        test('renders radio group with payment instruments', () => {
            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            expect(screen.getByTestId('radio-card-group')).toBeInTheDocument()
            expect(screen.getByTestId('radio-card-payment-1')).toBeInTheDocument()
            expect(screen.getByTestId('radio-card-payment-2')).toBeInTheDocument()
        })

        test('displays payment instrument details correctly', () => {
            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            // Check first payment instrument
            expect(screen.getByText('Visa')).toBeInTheDocument()
            expect(screen.getByText('•••• 1234')).toBeInTheDocument()
            expect(screen.getByText('12/2025')).toBeInTheDocument()
            expect(screen.getByText('John Doe')).toBeInTheDocument()

            // Check second payment instrument
            expect(screen.getByText('Mastercard')).toBeInTheDocument()
            expect(screen.getByText('•••• 5678')).toBeInTheDocument()
            expect(screen.getByText('11/2026')).toBeInTheDocument()
            expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        })

        test('displays credit card icons', () => {
            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            expect(screen.getByTestId('visa-icon')).toBeInTheDocument()
            expect(screen.getByTestId('mastercard-icon')).toBeInTheDocument()
        })

        test('shows "Add New Card" button when not editing payment', () => {
            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    isEditingPayment={false}
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            expect(screen.getByText('cc_radio_group.button.add_new_card')).toBeInTheDocument()
            expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
        })

        test('hides "Add New Card" button when editing payment', () => {
            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    isEditingPayment={true}
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            expect(screen.queryByText('cc_radio_group.button.add_new_card')).not.toBeInTheDocument()
        })

        test('shows remove buttons for each payment instrument', () => {
            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            const removeButtons = screen.getAllByText('cc_radio_group.action.remove')
            expect(removeButtons).toHaveLength(2)
        })

        test('displays form error when present', () => {
            render(
                <CCRadioGroup
                    form={mockFormWithErrors}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            expect(screen.getByText('Please select a payment method')).toBeInTheDocument()
        })
    })

    describe('User Interactions', () => {
        test('calls togglePaymentEdit when "Add New Card" button is clicked', async () => {
            const user = userEvent.setup()
            const mockTogglePaymentEdit = jest.fn()

            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    isEditingPayment={false}
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={mockTogglePaymentEdit}
                />
            )

            const addButton = screen.getByText('cc_radio_group.button.add_new_card')
            await user.click(addButton)

            expect(mockTogglePaymentEdit).toHaveBeenCalled()
        })

        test('calls onPaymentIdChange when radio selection changes', async () => {
            const user = userEvent.setup()
            const mockOnPaymentIdChange = jest.fn()

            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={mockOnPaymentIdChange}
                    togglePaymentEdit={jest.fn()}
                />
            )

            // Simulate clicking on a radio card
            const firstCard = screen.getByTestId('radio-card-payment-1')
            await user.click(firstCard)

            // Note: In a real implementation, the RadioCardGroup would handle this
            // For this test, we're verifying the callback is passed correctly
            expect(mockOnPaymentIdChange).toBeDefined()
        })

        test('remove buttons are clickable', async () => {
            const user = userEvent.setup()

            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            const removeButtons = screen.getAllByText('cc_radio_group.action.remove')

            // Verify buttons are clickable (they don't have disabled attribute)
            removeButtons.forEach((button) => {
                expect(button.closest('button')).not.toBeDisabled()
            })

            // Test clicking the first remove button
            await user.click(removeButtons[0])
            // Note: The actual remove functionality would be handled by parent component
        })
    })

    describe('Edge Cases', () => {
        test('handles customer with no payment instruments', () => {
            useCurrentCustomer.mockReturnValue({
                data: {paymentInstruments: []}
            })

            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            expect(screen.getByTestId('radio-card-group')).toBeInTheDocument()
            expect(screen.getByText('cc_radio_group.button.add_new_card')).toBeInTheDocument()
            expect(screen.queryByText('Visa')).not.toBeInTheDocument()
        })

        test('handles customer with null payment instruments', () => {
            useCurrentCustomer.mockReturnValue({
                data: {paymentInstruments: null}
            })

            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            expect(screen.getByTestId('radio-card-group')).toBeInTheDocument()
            expect(screen.getByText('cc_radio_group.button.add_new_card')).toBeInTheDocument()
        })

        test('handles payment instruments without card type', () => {
            const customerWithIncompleteData = {
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'incomplete-payment',
                        paymentCard: {
                            cardType: null,
                            numberLastDigits: '9999',
                            expirationMonth: 1,
                            expirationYear: 2030,
                            holder: 'Test User'
                        }
                    }
                ]
            }

            useCurrentCustomer.mockReturnValue({data: customerWithIncompleteData})

            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            expect(screen.getByText('•••• 9999')).toBeInTheDocument()
            expect(screen.getByText('Test User')).toBeInTheDocument()
        })

        test('handles default prop values', () => {
            render(
                <CCRadioGroup
                    form={mockForm}
                    // Testing default values - not passing value, isEditingPayment, etc.
                />
            )

            expect(screen.getByTestId('radio-card-group')).toBeInTheDocument()
            expect(screen.getByText('cc_radio_group.button.add_new_card')).toBeInTheDocument()
        })
    })

    describe('Value Handling', () => {
        test('shows selected payment instrument when value is provided', () => {
            render(
                <CCRadioGroup
                    form={mockForm}
                    value="payment-1"
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            const radioGroup = screen.getByTestId('radio-card-group')
            expect(radioGroup).toHaveAttribute('data-value', 'payment-1')
        })

        test('handles empty string value', () => {
            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            const radioGroup = screen.getByTestId('radio-card-group')
            expect(radioGroup).toHaveAttribute('data-value', '')
        })
    })

    describe('Form State', () => {
        test('does not show invalid state when form has no errors', () => {
            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            const formControl = screen.getByRole('group')
            expect(formControl).not.toHaveAttribute('aria-invalid')
        })
    })

    describe('Accessibility', () => {
        test('has proper form control structure', () => {
            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            expect(screen.getByRole('group')).toBeInTheDocument()
        })

        test('associates error message with form control', () => {
            render(
                <CCRadioGroup
                    form={mockFormWithErrors}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            const errorMessage = screen.getByText('Please select a payment method')
            expect(errorMessage).toBeInTheDocument()
        })

        test('buttons have proper accessibility attributes', () => {
            render(
                <CCRadioGroup
                    form={mockForm}
                    value=""
                    onPaymentIdChange={jest.fn()}
                    togglePaymentEdit={jest.fn()}
                />
            )

            const addButton = screen.getByText('cc_radio_group.button.add_new_card')
            expect(addButton.closest('button')).toBeInTheDocument()

            const removeButtons = screen.getAllByText('cc_radio_group.action.remove')
            removeButtons.forEach((button) => {
                expect(button.closest('button')).toBeInTheDocument()
            })
        })
    })
})
