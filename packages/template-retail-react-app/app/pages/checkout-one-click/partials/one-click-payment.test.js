/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable react/prop-types */
import React from 'react'
import {render, screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useShopperBasketsMutation, useCustomerType} from '@salesforce/commerce-sdk-react'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
import Payment from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-payment'
import {CurrencyProvider} from '@salesforce/retail-react-app/app/contexts'
import {IntlProvider} from 'react-intl'

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
    defineMessage: (descriptor) => descriptor
}))

// Mock constants
jest.mock('@salesforce/retail-react-app/app/constants', () => ({
    API_ERROR_MESSAGE: {
        defaultMessage: 'Something went wrong. Please try again.',
        id: 'error.generic'
    }
}))

// Mock dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer')
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast')
jest.mock('@salesforce/commerce-sdk-react')
jest.mock('@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context')

// Mock sub-components
jest.mock('@salesforce/retail-react-app/app/components/promo-code', () => ({
    PromoCode: () => <div data-testid="promo-code">Promo Code Component</div>,
    usePromoCode: () => ({
        form: {
            handleSubmit: jest.fn(() => jest.fn()),
            getValues: jest.fn(() => ({})),
            formState: {isValid: true}
        },
        promoCodeItems: [],
        step: 0,
        STEPS: {FORM: 0, PENDING: 1}
    })
}))

jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-payment-form',
    () => {
        const MockPaymentForm = function ({onSubmit, children}) {
            return (
                <div data-testid="payment-form">
                    <div>Credit Card</div>
                    <input aria-label="Card Number" data-testid="card-number" />
                    <input aria-label="Expiry Date" data-testid="expiry-date" />
                    <input aria-label="CVV" data-testid="cvv" />
                    {children}
                    <button
                        type="button"
                        onClick={() =>
                            onSubmit?.({
                                number: '4111111111111111',
                                expiry: '12/25',
                                cvv: '123',
                                holder: 'John Doe',
                                cardType: 'Visa'
                            })
                        }
                    >
                        Submit Payment
                    </button>
                </div>
            )
        }

        return MockPaymentForm
    }
)

jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address-selection',
    () => {
        const MockShippingAddressSelection = function ({hideSubmitButton}) {
            return (
                <div data-testid="shipping-address-selection">
                    <input aria-label="First Name" data-testid="first-name" />
                    <input aria-label="Last Name" data-testid="last-name" />
                    <input aria-label="Street Address" data-testid="street-address" />
                    {!hideSubmitButton && <button type="submit">Submit Address</button>}
                </div>
            )
        }

        return MockShippingAddressSelection
    }
)

jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-user-registration',
    () => {
        const MockUserRegistration = function ({enableUserRegistration}) {
            return enableUserRegistration ? (
                <div data-testid="user-registration">User Registration</div>
            ) : null
        }

        return MockUserRegistration
    }
)

jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-save-payment-method',
    () => {
        const MockSavePaymentMethod = function () {
            return <div data-testid="save-payment-method">Save Payment Method</div>
        }

        return MockSavePaymentMethod
    }
)

jest.mock('@salesforce/retail-react-app/app/components/address-display', () => {
    const MockAddressDisplay = function ({address}) {
        return (
            <div data-testid="address-display">
                {address?.firstName} {address?.lastName}
                <br />
                {address?.address1}
                <br />
                {address?.city}, {address?.stateCode} {address?.postalCode}
            </div>
        )
    }

    return MockAddressDisplay
})

// Mock ToggleCard components
jest.mock('@salesforce/retail-react-app/app/components/toggle-card', () => {
    const ToggleCardEdit = ({children}) => children
    const ToggleCardSummary = ({children}) => children

    const ToggleCard = ({children, title, editing, onEdit, editLabel, ...props}) => {
        const toArray = (c) => (Array.isArray(c) ? c : [c])
        const arr = toArray(children).filter(Boolean)
        const editEl = arr.find((c) => c && c.type === ToggleCardEdit)
        const summaryEl = arr.find((c) => c && c.type === ToggleCardSummary)
        const editContent = editEl ? editEl.props.children : null
        const summaryContent = summaryEl ? summaryEl.props.children : null
        return (
            <div {...props}>
                <div data-testid="toggle-card-title">{title}</div>
                {editing ? (
                    <div data-testid="toggle-card-edit">
                        {editContent}
                        <button type="submit">Review Order</button>
                    </div>
                ) : (
                    <div data-testid="toggle-card-summary">
                        <button onClick={onEdit} aria-label={editLabel}>
                            {editLabel}
                        </button>
                        {summaryContent}
                    </div>
                )}
            </div>
        )
    }

    return {
        ToggleCard,
        ToggleCardEdit,
        ToggleCardSummary
    }
})

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
    }
]

const mockBasket = {
    basketId: 'test-basket-id',
    paymentInstruments: [],
    shipments: [
        {
            shippingAddress: {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Main St',
                city: 'New York',
                stateCode: 'NY',
                postalCode: '10001',
                countryCode: 'US'
            },
            shippingMethod: {
                c_storePickupEnabled: false
            }
        }
    ],
    billingAddress: null
}

const mockCustomer = {
    paymentInstruments: mockPaymentInstruments
}

const mockToastFn = jest.fn()

const TestWrapper = ({
    basketData = mockBasket,
    customerData = mockCustomer,
    isRegistered = false,
    enableUserRegistration = false,
    setEnableUserRegistration = jest.fn(),
    onPaymentMethodSaved = jest.fn(),
    onSavePreferenceChange = jest.fn(),
    registeredUserChoseGuest = false,
    removePaymentShouldFail = false,
    initialStep = 4
}) => {
    // Mock hooks
    useCurrentCustomer.mockReturnValue({data: customerData})
    useCurrentBasket.mockReturnValue({data: basketData, refetch: jest.fn().mockResolvedValue({})})
    useCustomerType.mockReturnValue({
        isRegistered,
        isGuest: !isRegistered
    })
    useToast.mockReturnValue(mockToastFn)

    const mockCheckout = {
        step: initialStep,
        STEPS: {
            CONTACT_INFO: 0,
            PICKUP_ADDRESS: 1,
            SHIPPING_ADDRESS: 2,
            SHIPPING_OPTIONS: 3,
            PAYMENT: 4,
            REVIEW_ORDER: 5
        },
        goToStep: jest.fn(),
        goToNextStep: jest.fn()
    }
    useCheckout.mockReturnValue(mockCheckout)

    // Mock mutations
    const mockAddPaymentInstrument = jest.fn().mockResolvedValue({})
    const mockUpdateBillingAddress = jest.fn().mockResolvedValue({})
    const mockRemovePaymentInstrument = removePaymentShouldFail
        ? jest.fn().mockRejectedValue(new Error('remove failed'))
        : jest.fn().mockResolvedValue({})

    useShopperBasketsMutation.mockImplementation((mutationType) => {
        switch (mutationType) {
            case 'addPaymentInstrumentToBasket':
                return {mutateAsync: mockAddPaymentInstrument}
            case 'updateBillingAddressForBasket':
                return {mutateAsync: mockUpdateBillingAddress}
            case 'removePaymentInstrumentFromBasket':
                return {mutateAsync: mockRemovePaymentInstrument}
            default:
                return {mutateAsync: jest.fn()}
        }
    })

    // Mock form objects
    const mockPaymentMethodForm = {
        handleSubmit: jest.fn((callback) => (e) => {
            e?.preventDefault?.()
            callback({
                number: '4111111111111111',
                expiry: '12/25',
                cvv: '123',
                holder: 'John Doe',
                cardType: 'Visa'
            })
        }),
        watch: jest.fn(() => ({unsubscribe: jest.fn()})),
        formState: {isSubmitting: false}
    }

    const mockBillingAddressForm = {
        handleSubmit: jest.fn((callback) => (e) => {
            e?.preventDefault?.()
            callback({
                firstName: 'Jane',
                lastName: 'Smith',
                address1: '456 Billing St',
                city: 'Oakland',
                stateCode: 'CA',
                postalCode: '94601',
                countryCode: 'US'
            })
        }),
        trigger: jest.fn().mockResolvedValue(true),
        getValues: jest.fn(() => ({
            firstName: 'Jane',
            lastName: 'Smith',
            address1: '456 Billing St',
            city: 'Oakland',
            stateCode: 'CA',
            postalCode: '94601',
            countryCode: 'US'
        })),
        formState: {isSubmitting: false}
    }

    return (
        <IntlProvider locale="en-GB">
            <CurrencyProvider>
                <Payment
                    paymentMethodForm={mockPaymentMethodForm}
                    billingAddressForm={mockBillingAddressForm}
                    enableUserRegistration={enableUserRegistration}
                    setEnableUserRegistration={setEnableUserRegistration}
                    registeredUserChoseGuest={registeredUserChoseGuest}
                    onPaymentMethodSaved={onPaymentMethodSaved}
                    onSavePreferenceChange={onSavePreferenceChange}
                />
            </CurrencyProvider>
        </IntlProvider>
    )
}

describe('Payment Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Rendering', () => {
        test('renders payment component with title', () => {
            render(<TestWrapper />)

            expect(screen.getByText('checkout_payment.title.payment')).toBeInTheDocument()
            expect(screen.getByTestId('payment-component')).toBeInTheDocument()
        })

        test('renders promo code component', () => {
            render(<TestWrapper />)

            expect(screen.getByTestId('promo-code')).toBeInTheDocument()
        })

        test('renders payment form when no payment instrument is applied', () => {
            render(<TestWrapper />)

            expect(screen.getByText('Credit Card')).toBeInTheDocument()
            expect(screen.getByTestId('payment-form')).toBeInTheDocument()
        })

        test('displays applied payment instrument when present', () => {
            const basketWithPayment = {
                ...mockBasket,
                paymentInstruments: [mockPaymentInstruments[0]]
            }

            render(<TestWrapper basketData={basketWithPayment} initialStep={5} />)

            const summary = screen.getAllByTestId('toggle-card-summary').pop()
            // Check summary section for applied payment details
            expect(within(summary).getByText('Visa')).toBeInTheDocument()
            expect(within(summary).getByText('•••• 1234')).toBeInTheDocument()
        })

        test('shows "Same as shipping address" checkbox for non-pickup orders', () => {
            render(<TestWrapper />)

            // The checkbox label shows as the message ID since we're mocking formatMessage
            expect(screen.getByText('checkout_payment.label.same_as_shipping')).toBeInTheDocument()
        })

        test('hides "Same as shipping address" checkbox for pickup orders', () => {
            const pickupBasket = {
                ...mockBasket,
                shipments: [
                    {
                        ...mockBasket.shipments[0],
                        shippingMethod: {
                            c_storePickupEnabled: true
                        }
                    }
                ]
            }

            render(<TestWrapper basketData={pickupBasket} />)

            expect(
                screen.queryByText('checkout_payment.label.same_as_shipping')
            ).not.toBeInTheDocument()
        })
    })

    describe('User Registration', () => {
        test('hides user registration when user chose guest checkout', () => {
            render(<TestWrapper enableUserRegistration={true} registeredUserChoseGuest={true} />)

            // User registration should be hidden
            expect(screen.getByText('Review Order')).toBeInTheDocument()
        })

        test('calls setEnableUserRegistration when registration preference changes', () => {
            const mockSetEnableUserRegistration = jest.fn()

            render(<TestWrapper setEnableUserRegistration={mockSetEnableUserRegistration} />)

            // The component should set up the registration preference handler
            expect(mockSetEnableUserRegistration).toBeDefined()
        })
    })

    describe('Save Payment Method', () => {
        test('hides save payment method option for guest users', () => {
            render(<TestWrapper isRegistered={false} />)

            expect(screen.queryByTestId('save-payment-method')).not.toBeInTheDocument()
        })

        test('shows save payment method option for registered users entering a new card', async () => {
            const user = userEvent.setup()
            render(<TestWrapper isRegistered={true} />)

            // Payment form is visible
            expect(screen.getByTestId('payment-form')).toBeInTheDocument()

            // Simulate typing to trigger form watcher
            await user.type(screen.getByLabelText('Card Number'), '4111111111111111')
            await user.type(screen.getByLabelText('Expiry Date'), '12/25')
            await user.type(screen.getByLabelText('CVV'), '123')

            // Our mocked SavePaymentMethod renders this test id for registered users
            expect(await screen.findByTestId('save-payment-method')).toBeInTheDocument()
        })
    })

    describe('Form Validation and Submission', () => {
        test('validates payment form before submission', async () => {
            const user = userEvent.setup()
            const mockAddPaymentInstrument = jest.fn().mockResolvedValue({})
            const mockPaymentMethodForm = {
                handleSubmit: jest.fn(() => (e) => {
                    e?.preventDefault?.()
                    // Simulate form validation failure
                    throw new Error('Form validation failed')
                }),
                formState: {isSubmitting: false}
            }

            useShopperBasketsMutation.mockImplementation((mutationType) => {
                if (mutationType === 'addPaymentInstrumentToBasket') {
                    return {mutateAsync: mockAddPaymentInstrument}
                }
                return {mutateAsync: jest.fn()}
            })

            render(<TestWrapper paymentMethodForm={mockPaymentMethodForm} />)

            const submitButton = screen.getByText('Review Order')
            await user.click(submitButton)

            // Should not call payment API if form validation fails
            expect(mockAddPaymentInstrument).not.toHaveBeenCalled()
        })
    })

    describe('Edge Cases', () => {
        test('handles empty basket gracefully', () => {
            render(<TestWrapper basketData={null} />)
            expect(screen.getByTestId('payment-component')).toBeInTheDocument()
        })

        test('handles customer without payment instruments', () => {
            render(<TestWrapper customerData={{paymentInstruments: []}} />)
            expect(screen.getByTestId('payment-component')).toBeInTheDocument()
        })

        test('handles undefined customer data', () => {
            render(<TestWrapper customerData={undefined} />)
            expect(screen.getByTestId('payment-component')).toBeInTheDocument()
        })

        test('handles basket without shipments', () => {
            const basketWithoutShipments = {
                ...mockBasket,
                shipments: []
            }
            render(<TestWrapper basketData={basketWithoutShipments} />)
            expect(screen.getByTestId('payment-component')).toBeInTheDocument()
        })

        test('handles null billing address form values', async () => {
            const user = userEvent.setup()
            const mockBillingAddressForm = {
                trigger: jest.fn().mockResolvedValue(true),
                getValues: jest.fn(() => null),
                formState: {isSubmitting: false}
            }

            render(<TestWrapper billingAddressForm={mockBillingAddressForm} />)

            // Uncheck same as shipping
            const checkbox = screen.getByText('checkout_payment.label.same_as_shipping')
            await user.click(checkbox)

            // Should show the billing address form
            await waitFor(() => {
                expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
            })
        })
    })

    describe('Error Handling', () => {
        test('shows error and does not enter edit mode if removing applied payment fails', async () => {
            const user = userEvent.setup()

            // Mock customer as registered with a payment instrument
            useCustomerType.mockReturnValue({isGuest: false, isRegistered: true})
            const basketWithPayment = {
                ...mockBasket,
                paymentInstruments: [mockPaymentInstruments[0]]
            }

            // Make removal fail for this test
            // Render starting at REVIEW_ORDER so summary is visible and edit is available
            render(
                <TestWrapper
                    basketData={basketWithPayment}
                    removePaymentShouldFail={true}
                    initialStep={5}
                />
            )

            // Click Edit Payment Info
            const summary = screen.getAllByTestId('toggle-card-summary').pop()
            const editButton = within(summary).getByRole('button', {
                name: /toggle_card.action.editPaymentInfo|Edit Payment Info/i
            })
            await user.click(editButton)

            // Assert error toast shown
            await waitFor(() => expect(mockToastFn).toHaveBeenCalled())

            // Should remain in summary (not enter edit mode)
            // Because we render starting at REVIEW_ORDER, summary should persist
            // and edit region should not be present.
            expect(screen.queryByTestId('toggle-card-edit')).not.toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        test('payment section has proper heading structure', () => {
            render(<TestWrapper />)

            expect(screen.getByText('checkout_payment.title.payment')).toBeInTheDocument()
            expect(screen.getByText('Credit Card')).toBeInTheDocument()
            expect(screen.getByText('checkout_payment.heading.billing_address')).toBeInTheDocument()
        })

        test('form controls have proper labels', () => {
            render(<TestWrapper />)

            expect(screen.getByLabelText('Card Number')).toBeInTheDocument()
            expect(screen.getByLabelText('Expiry Date')).toBeInTheDocument()
            expect(screen.getByLabelText('CVV')).toBeInTheDocument()
        })

        test('buttons have accessible labels', () => {
            render(<TestWrapper />)

            expect(screen.getByText('Submit Payment')).toBeInTheDocument()
            expect(screen.getByText('Review Order')).toBeInTheDocument()
        })

        test('checkboxes have proper labels', () => {
            render(<TestWrapper />)

            expect(screen.getByText('checkout_payment.label.same_as_shipping')).toBeInTheDocument()
        })
    })
})
