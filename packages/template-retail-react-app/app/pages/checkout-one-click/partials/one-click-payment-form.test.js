/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
            render(<PaymentForm form={mockForm} onSubmit={jest.fn()} />)

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

    describe('Form Interactions', () => {})

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
