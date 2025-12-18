/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import PaymentForm from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-payment-form'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useForm} from 'react-hook-form'
const renderOC = (ui, options) => renderWithProviders(ui, {wrapper: Wrapper, ...(options || {})})
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

// Note: Do not mock CreditCardFields here so that validation tests use real rules.

// Mock cc-utils
jest.mock('@salesforce/retail-react-app/app/utils/cc-utils', () => {
    const actual = jest.requireActual('@salesforce/retail-react-app/app/utils/cc-utils')
    return {
        ...actual,
        getCreditCardIcon: jest.fn(() => {
            return function MockCardIcon() {
                return <div data-testid="card-icon">Card Icon</div>
            }
        })
    }
})

// Mock icons
jest.mock('@salesforce/retail-react-app/app/components/icons', () => {
    const actual = jest.requireActual('@salesforce/retail-react-app/app/components/icons')
    return {
        ...actual,
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
    }
})

const mockBasket = {
    orderTotal: 99.99,
    basketId: 'test-basket-id'
}

const Wrapper = ({children}) => {
    // Provide a RHF form with onChange mode to surface inline validation
    const form = useForm({
        mode: 'onChange',
        shouldUnregister: false,
        defaultValues: {
            holder: '',
            number: '',
            cardType: '',
            expiry: '',
            securityCode: ''
        }
    })
    const onSubmit = jest.fn()
    return React.cloneElement(children, {
        ...children.props,
        form,
        onSubmit: children.props?.onSubmit ?? onSubmit,
        selectedPaymentMethod: children.props?.selectedPaymentMethod ?? 'cc',
        savedPaymentInstruments: children.props?.savedPaymentInstruments ?? []
    })
}

describe('PaymentForm Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useCurrentBasket.mockReturnValue({data: mockBasket})
        useCurrency.mockReturnValue({currency: 'USD'})
    })

    describe('One-Click PaymentForm credit card validation', () => {
        test('shows required errors when fields are left empty after interaction', async () => {
            const {user} = renderWithProviders(<PaymentForm>{null}</PaymentForm>, {
                wrapper: Wrapper
            })

            // Interact with each field to trigger validation
            const number = await screen.findByLabelText(
                /(Card Number|use_credit_card_fields\.label\.card_number)/i
            )
            const name = screen.getByLabelText(
                /(Name on Card|Cardholder Name|use_credit_card_fields\.label\.name)/i
            )
            const expiry = screen.getByLabelText(
                /(Expiration Date|Expiry Date|use_credit_card_fields\.label\.expiry)/i
            )
            const cvv = screen.getByLabelText(
                /(Security Code|CVV|use_credit_card_fields\.label\.security_code)/i
            )

            await user.type(number, '1')
            await user.clear(number)
            await user.tab()
            await user.type(name, 'a')
            await user.clear(name)
            await user.tab()
            await user.type(expiry, '1')
            await user.clear(expiry)
            await user.tab()
            await user.type(cvv, '1')
            await user.clear(cvv)
            await user.tab()

            await waitFor(() => {
                expect(
                    screen.getAllByText(/use_credit_card_fields\.error\./i).length
                ).toBeGreaterThanOrEqual(3)
            })
        })

        test('shows invalid errors for bad values and clears when values are valid', async () => {
            const {user} = renderWithProviders(<PaymentForm>{null}</PaymentForm>, {
                wrapper: Wrapper
            })

            const number = await screen.findByLabelText(
                /(Card Number|use_credit_card_fields\.label\.card_number)/i
            )
            const name = screen.getByLabelText(
                /(Name on Card|Cardholder Name|use_credit_card_fields\.label\.name)/i
            )
            const expiry = screen.getByLabelText(
                /(Expiration Date|Expiry Date|use_credit_card_fields\.label\.expiry)/i
            )
            const cvv = screen.getByLabelText(
                /(Security Code|CVV|use_credit_card_fields\.label\.security_code)/i
            )

            // Enter invalid values
            await user.type(number, '1234 5678 9012 3456')
            await user.tab()
            await user.type(name, 'A')
            await user.tab()
            await user.type(expiry, '1329') // invalid month 13 -> formatted to 13/29
            await user.tab()
            await user.type(cvv, '1')
            await user.tab()

            // Expect some validation errors to appear (match intl ids or messages)
            await waitFor(() => {
                expect(
                    screen.getAllByText(/use_credit_card_fields\.error\./i).length
                ).toBeGreaterThan(0)
            })

            // Replace with valid Visa test card, proper name, valid expiry and cvv
            await user.clear(number)
            await user.type(number, '4111 1111 1111 1111')
            await user.clear(name)
            await user.type(name, 'John Smith')
            await user.clear(expiry)
            await user.type(expiry, '0129') // 01/29
            await user.clear(cvv)
            await user.type(cvv, '123')

            // Errors should disappear
            await waitFor(() => {
                expect(screen.queryByText(/use_credit_card_fields\.error\./i)).toBeNull()
            })
        })
    })

    describe('Rendering', () => {
        test('renders PayPal option', () => {
            renderOC(<PaymentForm onSubmit={jest.fn()}>{null}</PaymentForm>)

            expect(screen.getByTestId('paypal-icon')).toBeInTheDocument()
        })

        test('shows security lock icon with tooltip', () => {
            renderOC(<PaymentForm onSubmit={jest.fn()}>{null}</PaymentForm>)

            expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
        })

        test('credit card radio is selected by default', () => {
            renderOC(
                <PaymentForm selectedPaymentMethod="cc" onSubmit={jest.fn()}>
                    {null}
                </PaymentForm>
            )

            const creditCardRadio = screen.getByDisplayValue('cc')
            expect(creditCardRadio).toBeChecked()
        })

        test('renders additional children when provided', () => {
            renderOC(
                <PaymentForm onSubmit={jest.fn()}>
                    <div data-testid="additional-content">Save Payment Method</div>
                </PaymentForm>
            )

            expect(screen.getByTestId('additional-content')).toBeInTheDocument()
            expect(screen.getByText('Save Payment Method')).toBeInTheDocument()
        })

        test('does not render children section when no children provided', () => {
            renderOC(<PaymentForm onSubmit={jest.fn()}>{null}</PaymentForm>)

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
            renderOC(
                <PaymentForm
                    onSubmit={jest.fn()}
                    savedPaymentInstruments={mockSavedPaymentInstruments}
                >
                    {null}
                </PaymentForm>
            )

            // Check that saved payment methods are rendered
            expect(screen.getByDisplayValue('saved-payment-1')).toBeInTheDocument()
            // With unified collapsed view (n=3), both saved methods are initially visible
            expect(screen.getByDisplayValue('saved-payment-2')).toBeInTheDocument()
        })

        test('displays saved payment method details correctly', () => {
            renderOC(
                <PaymentForm
                    onSubmit={jest.fn()}
                    savedPaymentInstruments={mockSavedPaymentInstruments}
                >
                    {null}
                </PaymentForm>
            )

            // Check first saved payment method details
            expect(screen.getByText('Visa')).toBeInTheDocument()
            expect(screen.getByText('•••• 1234')).toBeInTheDocument()
            expect(screen.getByText('12/2025')).toBeInTheDocument()
        })

        test('renders credit card icon for saved payment methods', () => {
            renderOC(
                <PaymentForm
                    onSubmit={jest.fn()}
                    savedPaymentInstruments={[mockSavedPaymentInstruments[0]]}
                >
                    {null}
                </PaymentForm>
            )

            // The mock getCreditCardIcon should be called and return a component
            expect(screen.getByTestId('card-icon')).toBeInTheDocument()
        })

        test('does not render saved payment methods when array is empty', () => {
            renderOC(<PaymentForm onSubmit={jest.fn()} savedPaymentInstruments={[]} />)

            expect(screen.queryByDisplayValue('saved-payment-1')).not.toBeInTheDocument()
            expect(screen.queryByDisplayValue('saved-payment-2')).not.toBeInTheDocument()
        })

        test('does not render saved payment methods when prop is undefined', () => {
            renderOC(<PaymentForm onSubmit={jest.fn()}>{null}</PaymentForm>)

            expect(screen.queryByDisplayValue('saved-payment-1')).not.toBeInTheDocument()
            expect(screen.queryByDisplayValue('saved-payment-2')).not.toBeInTheDocument()
        })

        test('orders saved payment methods with default first', () => {
            const savedWithDefault = [
                {...mockSavedPaymentInstruments[0]},
                {...mockSavedPaymentInstruments[1], default: true}
            ]

            renderOC(
                <PaymentForm
                    onSubmit={jest.fn()}
                    savedPaymentInstruments={savedWithDefault}
                    selectedPaymentMethod={savedWithDefault[1].paymentInstrumentId}
                />
            )

            const radios = screen.getAllByRole('radio')
            expect(radios[0]).toHaveAttribute('value', savedWithDefault[1].paymentInstrumentId)
        })

        test('handles saved payment method selection', () => {
            const mockOnPaymentMethodChange = jest.fn()

            renderOC(
                <PaymentForm
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
            renderOC(
                <PaymentForm
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
                renderOC(
                    <PaymentForm
                        onSubmit={jest.fn()}
                        savedPaymentInstruments={incompletePaymentInstrument}
                    />
                )
            }).not.toThrow()
        })

        test('renders saved payment methods between credit card and PayPal options', async () => {
            renderOC(
                <PaymentForm
                    onSubmit={jest.fn()}
                    savedPaymentInstruments={mockSavedPaymentInstruments}
                />
            )

            // Expand to ensure PayPal is visible in the list
            const showAllButton = screen.getByTestId('view-all-saved-payments')
            await userEvent.click(showAllButton)

            const radioButtons = screen.getAllByRole('radio')
            const values = radioButtons.map((radio) => radio.value)

            // Should include credit card, saved payments, and PayPal
            expect(values).toContain('cc')
            expect(values).toContain('saved-payment-1')
            expect(values).toContain('paypal')
        })

        test('renders card icons for saved payment methods', () => {
            renderOC(
                <PaymentForm
                    onSubmit={jest.fn()}
                    savedPaymentInstruments={mockSavedPaymentInstruments}
                />
            )

            // Should render card icons for each initially visible saved payment method (max 3)
            let cardIcons = screen.getAllByTestId('card-icon')
            expect(cardIcons).toHaveLength(2)

            // Expand and assert all saved payment icons render
            const showAllButton = screen.getByText('payment_selection.button.view_all')
            showAllButton.click()
            cardIcons = screen.getAllByTestId('card-icon')
            expect(cardIcons).toHaveLength(mockSavedPaymentInstruments.length)
        })

        describe('Show All Payment Instruments', () => {
            test('renders show all button when there are more than 1 saved payment methods', () => {
                renderOC(
                    <PaymentForm
                        onSubmit={jest.fn()}
                        savedPaymentInstruments={mockSavedPaymentInstruments}
                    />
                )
                expect(screen.getByText('payment_selection.button.view_all')).toBeInTheDocument()
            })

            test('does not render show all button when there is only one saved payment method', () => {
                renderOC(
                    <PaymentForm
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
                    renderOC(
                        <PaymentForm
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
                renderOC(
                    <PaymentForm
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
                renderOC(
                    <PaymentForm
                        onSubmit={jest.fn()}
                        savedPaymentInstruments={mockSavedPaymentInstruments}
                    />
                )

                // Should render card icons for each initially visible saved payment method (max 3)
                const cardIcons = screen.getAllByTestId('card-icon')
                expect(cardIcons).toHaveLength(2)
            })

            test('hides CC/PayPal when there are 3 or more saved methods (collapsed)', () => {
                const threeSaved = [
                    ...mockSavedPaymentInstruments,
                    {
                        paymentInstrumentId: 'saved-payment-3',
                        paymentCard: {
                            cardType: 'Visa',
                            numberLastDigits: '9012',
                            expirationMonth: '03',
                            expirationYear: '30'
                        }
                    }
                ]

                renderOC(<PaymentForm onSubmit={jest.fn()} savedPaymentInstruments={threeSaved} />)

                // Collapsed should show first 3 saved only, not CC/PayPal
                expect(screen.queryByDisplayValue('cc')).not.toBeInTheDocument()
                expect(screen.queryByDisplayValue('paypal')).not.toBeInTheDocument()
            })
        })
    })

    describe('Data Handling', () => {
        test('handles basket with zero total', () => {
            useCurrentBasket.mockReturnValue({
                data: {...mockBasket, orderTotal: 0}
            })

            renderOC(<PaymentForm onSubmit={jest.fn()}>{null}</PaymentForm>)
            expect(
                screen.getByLabelText('payment_selection.radio_group.assistive_msg')
            ).toBeInTheDocument()
        })

        test('handles basket with null total', () => {
            useCurrentBasket.mockReturnValue({
                data: {...mockBasket, orderTotal: null}
            })

            renderOC(<PaymentForm onSubmit={jest.fn()}>{null}</PaymentForm>)
            expect(
                screen.getByLabelText('payment_selection.radio_group.assistive_msg')
            ).toBeInTheDocument()
        })

        test('handles different currency', () => {
            useCurrency.mockReturnValue({currency: 'EUR'})

            renderOC(<PaymentForm onSubmit={jest.fn()}>{null}</PaymentForm>)
            expect(
                screen.getByLabelText('payment_selection.radio_group.assistive_msg')
            ).toBeInTheDocument()
        })

        test('handles missing basket data', () => {
            useCurrentBasket.mockReturnValue({data: null})

            renderOC(<PaymentForm onSubmit={jest.fn()}>{null}</PaymentForm>)
            expect(
                screen.getByLabelText('payment_selection.radio_group.assistive_msg')
            ).toBeInTheDocument()
        })

        test('handles undefined basket', () => {
            useCurrentBasket.mockReturnValue({data: undefined})

            renderOC(<PaymentForm onSubmit={jest.fn()}>{null}</PaymentForm>)
            expect(
                screen.getByLabelText('payment_selection.radio_group.assistive_msg')
            ).toBeInTheDocument()
        })
    })

    describe('Form Integration', () => {
        test('integrates with react-hook-form properly', () => {
            renderWithProviders(<PaymentForm onSubmit={jest.fn()}>{null}</PaymentForm>, {
                wrapper: Wrapper
            })
            expect(
                screen.getByLabelText(/(Card Number|use_credit_card_fields\.label\.card_number)/i)
            ).toBeInTheDocument()
        })

        test('passes form to CreditCardFields component', () => {
            renderWithProviders(<PaymentForm onSubmit={jest.fn()}>{null}</PaymentForm>, {
                wrapper: Wrapper
            })

            // CreditCardFields should be rendered, indicating form was passed
            expect(
                screen.getByLabelText(/(Card Number|use_credit_card_fields\.label\.card_number)/i)
            ).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        test('radio buttons have proper names', () => {
            renderWithProviders(<PaymentForm onSubmit={jest.fn()}>{null}</PaymentForm>, {
                wrapper: Wrapper
            })

            const creditCardRadio = screen.getByDisplayValue('cc')
            const paypalRadio = screen.getByDisplayValue('paypal')

            expect(creditCardRadio).toHaveAttribute('name', 'payment-selection')
            expect(paypalRadio).toHaveAttribute('name', 'payment-selection')
        })

        test('credit card fields are accessible', () => {
            renderWithProviders(<PaymentForm onSubmit={jest.fn()}>{null}</PaymentForm>, {
                wrapper: Wrapper
            })

            expect(
                screen.getByLabelText(/(Card Number|use_credit_card_fields\.label\.card_number)/i)
            ).toBeInTheDocument()
            expect(
                screen.getByLabelText(
                    /(Expiration Date|Expiry Date|use_credit_card_fields\.label\.expiry)/i
                )
            ).toBeInTheDocument()
            expect(
                screen.getByLabelText(
                    /(Security Code|CVV|use_credit_card_fields\.label\.security_code)/i
                )
            ).toBeInTheDocument()
            expect(
                screen.getByLabelText(
                    /(Name on Card|Cardholder Name|use_credit_card_fields\.label\.name)/i
                )
            ).toBeInTheDocument()
        })
    })

    describe('Visual Layout', () => {})

    describe('Error Handling', () => {
        test('handles missing onSubmit callback gracefully', () => {
            expect(() => {
                renderOC(<PaymentForm>{null}</PaymentForm>)
            }).not.toThrow()
        })
    })
})
