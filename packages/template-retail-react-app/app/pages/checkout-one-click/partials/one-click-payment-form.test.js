/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import PaymentForm from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-payment-form'

// Mock react-intl
jest.mock('react-intl', () => ({
    ...jest.requireActual('react-intl'),
    useIntl: () => ({
        formatMessage: jest.fn((descriptor) => {
            if (typeof descriptor === 'string') return descriptor
            if (descriptor && typeof descriptor.defaultMessage === 'string')
                return descriptor.defaultMessage
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
    FormattedNumber: ({value, style, currency}) => {
        if (style === 'currency') {
            return `${currency}${value?.toFixed(2) || '0.00'}`
        }
        return value?.toString() || '0'
    }
}))

// Mock dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')
jest.mock('@salesforce/retail-react-app/app/hooks')

// Mock CreditCardFields
jest.mock('@salesforce/retail-react-app/app/components/forms/credit-card-fields', () => {
    return function CreditCardFields() {
        return (
            <div data-testid="credit-card-fields">
                <input aria-label="Card Number" data-testid="card-number" />
                <input aria-label="Expiry Date" data-testid="expiry-date" />
                <input aria-label="CVV" data-testid="cvv" />
                <input aria-label="Cardholder Name" data-testid="cardholder-name" />
            </div>
        )
    }
})

// Mock cc-utils
jest.mock('@salesforce/retail-react-app/app/utils/cc-utils', () => ({
    getCreditCardIcon: jest.fn(() => {
        return function MockCardIcon() {
            return <div data-testid="card-icon">Card Icon</div>
        }
    })
}))

// Mock icons
jest.mock('@salesforce/retail-react-app/app/components/icons', () => ({
    LockIcon: (props) => (
        <div data-testid="lock-icon" {...props}>
            🔒
        </div>
    ),
    PaypalIcon: (props) => (
        <div data-testid="paypal-icon" {...props}>
            PayPal
        </div>
    )
}))

const mockBasket = {
    orderTotal: 99.99,
    basketId: 'test-basket-id'
}

const mockForm = {
    handleSubmit: jest.fn((callback) => (e) => {
        e?.preventDefault?.()
        callback({
            number: '4111111111111111',
            expiry: '12/25',
            cvv: '123',
            holder: 'John Doe'
        })
    }),
    formState: {errors: {}},
    control: {}
}

describe('PaymentForm Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useCurrentBasket.mockReturnValue({data: mockBasket})
        useCurrency.mockReturnValue({currency: 'USD'})
    })

    describe('Rendering', () => {
        test('renders PayPal option', () => {
            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

            expect(screen.getByTestId('paypal-icon')).toBeInTheDocument()
        })

        test('displays order total with currency formatting', () => {
            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

            expect(screen.getByText('USD99.99')).toBeInTheDocument()
        })

        test('shows security lock icon with tooltip', () => {
            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

            expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
        })

        test('credit card radio is selected by default', () => {
            render(<PaymentForm form={mockForm} selectedPaymentMethod="cc" onSubmit={jest.fn()} />)

            const creditCardRadio = screen.getByDisplayValue('cc')
            expect(creditCardRadio).toBeChecked()
        })

        test('renders additional children when provided', () => {
            render(
                <PaymentForm form={mockForm} onSubmit={jest.fn()}>
                    <div data-testid="additional-content">Save Payment Method</div>
                </PaymentForm>
            )

            expect(screen.getByTestId('additional-content')).toBeInTheDocument()
            expect(screen.getByText('Save Payment Method')).toBeInTheDocument()
        })

        test('does not render children section when no children provided', () => {
            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

            expect(screen.queryByTestId('additional-content')).not.toBeInTheDocument()
        })
    })

    describe('Saved Payment Methods', () => {
        const mockSavedPaymentInstruments = [
            {
                paymentInstrumentId: 'saved-payment-1',
                paymentCard: {
                    cardType: 'Visa',
                    numberLastDigits: '1234',
                    holder: 'John Doe',
                    expirationMonth: 12,
                    expirationYear: 2025
                }
            },
            {
                paymentInstrumentId: 'saved-payment-2',
                paymentCard: {
                    cardType: 'Mastercard',
                    numberLastDigits: '5678',
                    holder: 'Jane Smith',
                    expirationMonth: 6,
                    expirationYear: 2026
                }
            }
        ]

        test('renders saved payment methods when provided', () => {
            render(
                <PaymentForm
                    form={mockForm}
                    onSubmit={jest.fn()}
                    savedPaymentInstruments={mockSavedPaymentInstruments}
                />
            )

            // Check that saved payment methods are rendered
            expect(screen.getByDisplayValue('saved-payment-1')).toBeInTheDocument()
            // we only show 1 saved payment method up front.  User has to click Show All to see the second one
            expect(screen.queryByDisplayValue('saved-payment-2')).not.toBeInTheDocument()
        })

        test('displays saved payment method details correctly', () => {
            render(
                <PaymentForm
                    form={mockForm}
                    onSubmit={jest.fn()}
                    savedPaymentInstruments={mockSavedPaymentInstruments}
                />
            )

            // Check first saved payment method details
            expect(screen.getByText('Visa')).toBeInTheDocument()
            expect(screen.getByText('•••• 1234')).toBeInTheDocument()
            expect(screen.getByText('12/2025')).toBeInTheDocument()
        })

        test('renders credit card icon for saved payment methods', () => {
            render(
                <PaymentForm
                    form={mockForm}
                    onSubmit={jest.fn()}
                    savedPaymentInstruments={[mockSavedPaymentInstruments[0]]}
                />
            )

            // The mock getCreditCardIcon should be called and return a component
            expect(screen.getByTestId('card-icon')).toBeInTheDocument()
        })

        test('does not render saved payment methods when array is empty', () => {
            render(
                <PaymentForm form={mockForm} onSubmit={jest.fn()} savedPaymentInstruments={[]} />
            )

            expect(screen.queryByDisplayValue('saved-payment-1')).not.toBeInTheDocument()
            expect(screen.queryByDisplayValue('saved-payment-2')).not.toBeInTheDocument()
        })

        test('does not render saved payment methods when prop is undefined', () => {
            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

            expect(screen.queryByDisplayValue('saved-payment-1')).not.toBeInTheDocument()
            expect(screen.queryByDisplayValue('saved-payment-2')).not.toBeInTheDocument()
        })

        test('handles saved payment method selection', () => {
            const mockOnPaymentMethodChange = jest.fn()

            render(
                <PaymentForm
                    form={mockForm}
                    onSubmit={jest.fn()}
                    savedPaymentInstruments={mockSavedPaymentInstruments}
                    onPaymentMethodChange={mockOnPaymentMethodChange}
                />
            )

            const savedPaymentRadio = screen.getByDisplayValue('saved-payment-1')
            savedPaymentRadio.click()

            expect(mockOnPaymentMethodChange).toHaveBeenCalledWith('saved-payment-1')
        })

        test('shows selected saved payment method', () => {
            render(
                <PaymentForm
                    form={mockForm}
                    onSubmit={jest.fn()}
                    savedPaymentInstruments={mockSavedPaymentInstruments}
                    selectedPaymentMethod="saved-payment-1"
                />
            )

            const savedPaymentRadio = screen.getByDisplayValue('saved-payment-1')
            expect(savedPaymentRadio).toBeChecked()
        })

        test('handles saved payment method with missing card details gracefully', () => {
            const incompletePaymentInstrument = [
                {
                    paymentInstrumentId: 'incomplete-payment',
                    paymentCard: {
                        cardType: 'Visa'
                        // Missing other fields
                    }
                }
            ]

            expect(() => {
                render(
                    <PaymentForm
                        form={mockForm}
                        onSubmit={jest.fn()}
                        savedPaymentInstruments={incompletePaymentInstrument}
                    />
                )
            }).not.toThrow()
        })

        test('renders saved payment methods between credit card and PayPal options', () => {
            render(
                <PaymentForm
                    form={mockForm}
                    onSubmit={jest.fn()}
                    savedPaymentInstruments={mockSavedPaymentInstruments}
                />
            )

            const radioButtons = screen.getAllByRole('radio')
            const values = radioButtons.map((radio) => radio.value)

            // Should have credit card, saved payments, and PayPal in order
            expect(values).toContain('cc')
            expect(values).toContain('saved-payment-1')
            expect(values).toContain('paypal')
        })

        test('renders card icons for saved payment methods', () => {
            render(
                <PaymentForm
                    form={mockForm}
                    onSubmit={jest.fn()}
                    savedPaymentInstruments={mockSavedPaymentInstruments}
                />
            )

            // Should render card icons for each saved payment method
            const cardIcons = screen.getAllByTestId('card-icon')
            expect(cardIcons).toHaveLength(1)
        })

        describe('Show All Payment Instruments', () => {
            test('renders show all button when there are more than 1 saved payment methods', () => {
                render(
                    <PaymentForm
                        form={mockForm}
                        onSubmit={jest.fn()}
                        savedPaymentInstruments={mockSavedPaymentInstruments}
                    />
                )
                expect(screen.getByText('payment_selection.button.view_all')).toBeInTheDocument()
            })

            test('does not render show all button when there is only one saved payment method', () => {
                render(
                    <PaymentForm
                        form={mockForm}
                        onSubmit={jest.fn()}
                        savedPaymentInstruments={mockSavedPaymentInstruments.slice(0, 1)}
                    />
                )
                expect(
                    screen.queryByText('payment_selection.button.view_all')
                ).not.toBeInTheDocument()
            })

            test('does not render show all button when there are no saved payment methods', () => {
                ;[undefined, null, []].forEach((savedPaymentInstruments) => {
                    render(
                        <PaymentForm
                            form={mockForm}
                            onSubmit={jest.fn()}
                            savedPaymentInstruments={savedPaymentInstruments}
                        />
                    )
                    expect(
                        screen.queryByText('payment_selection.button.view_all')
                    ).not.toBeInTheDocument()
                })
            })

            test('renders multiple saved payment methods with unique keys', async () => {
                render(
                    <PaymentForm
                        form={mockForm}
                        onSubmit={jest.fn()}
                        savedPaymentInstruments={mockSavedPaymentInstruments}
                    />
                )

                // Both saved payment methods should be present
                expect(screen.getByDisplayValue('saved-payment-1')).toBeInTheDocument()

                const showAllButton = screen.getByText('payment_selection.button.view_all')
                await showAllButton.click()

                expect(screen.getByDisplayValue('saved-payment-2')).toBeInTheDocument()

                // Each should have unique radio button names
                const radioButtons = screen.getAllByRole('radio')
                const savedPaymentRadios = radioButtons.filter(
                    (radio) =>
                        radio.value === 'saved-payment-1' || radio.value === 'saved-payment-2'
                )
                expect(savedPaymentRadios).toHaveLength(2)
            })

            test('renders card icons for saved payment methods', () => {
                render(
                    <PaymentForm
                        form={mockForm}
                        onSubmit={jest.fn()}
                        savedPaymentInstruments={mockSavedPaymentInstruments}
                    />
                )

                // Should render card icons for each saved payment method
                const cardIcons = screen.getAllByTestId('card-icon')
                expect(cardIcons).toHaveLength(1)
            })
        })
    })

    describe('Data Handling', () => {
        test('handles basket with zero total', () => {
            useCurrentBasket.mockReturnValue({
                data: {...mockBasket, orderTotal: 0}
            })

            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

            expect(screen.getByText('USD0.00')).toBeInTheDocument()
        })

        test('handles basket with null total', () => {
            useCurrentBasket.mockReturnValue({
                data: {...mockBasket, orderTotal: null}
            })

            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

            expect(screen.getByText('USD0.00')).toBeInTheDocument()
        })

        test('handles different currency', () => {
            useCurrency.mockReturnValue({currency: 'EUR'})

            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

            expect(screen.getByText('EUR99.99')).toBeInTheDocument()
        })

        test('handles missing basket data', () => {
            useCurrentBasket.mockReturnValue({data: null})

            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

            expect(screen.getByText('USD0.00')).toBeInTheDocument()
        })

        test('handles undefined basket', () => {
            useCurrentBasket.mockReturnValue({data: undefined})

            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

            expect(screen.getByText('USD0.00')).toBeInTheDocument()
        })
    })

    describe('Form Integration', () => {
        test('integrates with react-hook-form properly', () => {
            const customForm = {
                handleSubmit: jest.fn(),
                formState: {errors: {}},
                control: {}
            }

            render(<PaymentForm form={customForm} onSubmit={jest.fn()} />)

            expect(screen.getByTestId('credit-card-fields')).toBeInTheDocument()
        })

        test('passes form to CreditCardFields component', () => {
            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

            // CreditCardFields should be rendered, indicating form was passed
            expect(screen.getByTestId('credit-card-fields')).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        test('radio buttons have proper names', () => {
            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

            const creditCardRadio = screen.getByDisplayValue('cc')
            const paypalRadio = screen.getByDisplayValue('paypal')

            expect(creditCardRadio).toHaveAttribute('name', 'payment-selection')
            expect(paypalRadio).toHaveAttribute('name', 'payment-selection')
        })

        test('credit card fields are accessible', () => {
            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

            expect(screen.getByLabelText('Card Number')).toBeInTheDocument()
            expect(screen.getByLabelText('Expiry Date')).toBeInTheDocument()
            expect(screen.getByLabelText('CVV')).toBeInTheDocument()
            expect(screen.getByLabelText('Cardholder Name')).toBeInTheDocument()
        })
    })

    describe('Visual Layout', () => {})

    describe('Error Handling', () => {
        test('handles missing onSubmit callback gracefully', () => {
            expect(() => {
                render(<PaymentForm form={mockForm} />)
            }).not.toThrow()
        })
    })
})
