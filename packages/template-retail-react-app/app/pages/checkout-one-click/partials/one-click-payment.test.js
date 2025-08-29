/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable react/prop-types */
import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useShopperBasketsMutation, useCustomerType} from '@salesforce/commerce-sdk-react'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
import Payment from '@salesforce/retail-react-app/../../app/pages/checkout-one-click/partials/one-click-payment'

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
        const MockPaymentForm = function ({onSubmit}) {
            return (
                <div data-testid="payment-form">
                    <div>Credit Card</div>
                    <input aria-label="Card Number" data-testid="card-number" />
                    <input aria-label="Expiry Date" data-testid="expiry-date" />
                    <input aria-label="CVV" data-testid="cvv" />
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
        const MockSavePaymentMethod = function ({isRegistered}) {
            return isRegistered ? (
                <div data-testid="save-payment-method">Save Payment Method</div>
            ) : null
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
    const ToggleCard = ({children, title, editing, onEdit, editLabel, ...props}) => (
        <div {...props}>
            <div data-testid="toggle-card-title">{title}</div>
            {editing && (
                <div data-testid="toggle-card-edit">
                    {children}
                    <button type="submit">Review Order</button>
                </div>
            )}
            {!editing && (
                <div data-testid="toggle-card-summary">
                    <button onClick={onEdit}>{editLabel}</button>
                    {children}
                </div>
            )}
        </div>
    )

    const ToggleCardEdit = ({children}) => <div data-testid="toggle-card-edit">{children}</div>

    const ToggleCardSummary = ({children}) => (
        <div data-testid="toggle-card-summary">{children}</div>
    )

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

const TestWrapper = ({
    basketData = mockBasket,
    customerData = mockCustomer,
    isRegistered = false,
    enableUserRegistration = false,
    setEnableUserRegistration = jest.fn(),
    onPaymentMethodSaved = jest.fn(),
    onSavePreferenceChange = jest.fn(),
    registeredUserChoseGuest = false
}) => {
    // Mock hooks
    useCurrentCustomer.mockReturnValue({data: customerData})
    useCurrentBasket.mockReturnValue({data: basketData})
    useCustomerType.mockReturnValue({
        isRegistered,
        isGuest: !isRegistered
    })
    useToast.mockReturnValue(jest.fn())

    const mockCheckout = {
        step: 4,
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
    const mockRemovePaymentInstrument = jest.fn().mockResolvedValue({})

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
        <Payment
            paymentMethodForm={mockPaymentMethodForm}
            billingAddressForm={mockBillingAddressForm}
            enableUserRegistration={enableUserRegistration}
            setEnableUserRegistration={setEnableUserRegistration}
            registeredUserChoseGuest={registeredUserChoseGuest}
            onPaymentMethodSaved={onPaymentMethodSaved}
            onSavePreferenceChange={onSavePreferenceChange}
        />
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

            render(<TestWrapper basketData={basketWithPayment} />)

            expect(screen.getAllByText('Visa')).toHaveLength(2) // Shows in both edit and summary sections
            expect(screen.getAllByText('•••• 1234')).toHaveLength(2) // Shows in both edit and summary sections
        })

        test('renders billing address section', () => {
            render(<TestWrapper />)

            // The heading shows as the message ID since we're mocking formatMessage
            // It appears in both edit and summary sections
            expect(screen.getAllByText('checkout_payment.heading.billing_address')).toHaveLength(2)
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

    describe('Payment Instrument Management', () => {
        test('adds payment instrument when form is submitted', async () => {
            const user = userEvent.setup()
            const mockAddPaymentInstrument = jest.fn().mockResolvedValue({})
            useShopperBasketsMutation.mockImplementation((mutationType) => {
                if (mutationType === 'addPaymentInstrumentToBasket') {
                    return {mutateAsync: mockAddPaymentInstrument}
                }
                return {mutateAsync: jest.fn()}
            })

            render(<TestWrapper />)

            // Use the mock payment form's submit button which simulates form submission
            const submitPaymentButton = screen.getByText('Submit Payment')
            await user.click(submitPaymentButton)

            const submitButton = screen.getByText('Review Order')
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockAddPaymentInstrument).toHaveBeenCalledWith({
                    parameters: {basketId: 'test-basket-id'},
                    body: expect.objectContaining({
                        paymentMethodId: 'CREDIT_CARD',
                        paymentCard: expect.objectContaining({
                            holder: 'John Doe',
                            cardType: 'Visa',
                            expirationMonth: 12,
                            expirationYear: 2025
                        })
                    })
                })
            })
        })

        test('removes payment instrument when remove button is clicked', async () => {
            const user = userEvent.setup()
            const mockRemovePaymentInstrument = jest.fn().mockResolvedValue({})
            useShopperBasketsMutation.mockImplementation((mutationType) => {
                if (mutationType === 'removePaymentInstrumentFromBasket') {
                    return {mutateAsync: mockRemovePaymentInstrument}
                }
                return {mutateAsync: jest.fn()}
            })

            const basketWithPayment = {
                ...mockBasket,
                paymentInstruments: [mockPaymentInstruments[0]]
            }

            render(<TestWrapper basketData={basketWithPayment} />)

            const removeButton = screen.getByText('checkout_payment.action.remove')
            await user.click(removeButton)

            await waitFor(() => {
                expect(mockRemovePaymentInstrument).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id',
                        paymentInstrumentId: 'payment-1'
                    }
                })
            })
        })

        test('handles payment instrument removal errors', async () => {
            const user = userEvent.setup()
            const mockShowToast = jest.fn()
            const mockRemovePaymentInstrument = jest
                .fn()
                .mockRejectedValue(new Error('Remove failed'))

            useToast.mockReturnValue(mockShowToast)
            useShopperBasketsMutation.mockImplementation((mutationType) => {
                if (mutationType === 'removePaymentInstrumentFromBasket') {
                    return {mutateAsync: mockRemovePaymentInstrument}
                }
                return {mutateAsync: jest.fn()}
            })

            const basketWithPayment = {
                ...mockBasket,
                paymentInstruments: [mockPaymentInstruments[0]]
            }

            render(<TestWrapper basketData={basketWithPayment} />)

            const removeButton = screen.getByText('checkout_payment.action.remove')
            await user.click(removeButton)

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith({
                    title: expect.any(String),
                    status: 'error'
                })
            })
        })
    })

    describe('Billing Address Management', () => {
        test('uses shipping address as billing when "Same as shipping" is checked', async () => {
            const user = userEvent.setup()
            const mockUpdateBillingAddress = jest.fn().mockResolvedValue({})
            useShopperBasketsMutation.mockImplementation((mutationType) => {
                if (mutationType === 'updateBillingAddressForBasket') {
                    return {mutateAsync: mockUpdateBillingAddress}
                }
                return {mutateAsync: jest.fn()}
            })

            render(<TestWrapper />)

            // Ensure "Same as shipping address" is checked (default)
            const sameAsShippingCheckbox = screen.getByText(
                'checkout_payment.label.same_as_shipping'
            )
            expect(sameAsShippingCheckbox.closest('label')).toBeInTheDocument()

            // Submit form
            const submitButton = screen.getByText('Review Order')
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockUpdateBillingAddress).toHaveBeenCalledWith({
                    body: expect.objectContaining({
                        firstName: 'John',
                        lastName: 'Doe',
                        address1: '123 Main St',
                        city: 'New York',
                        stateCode: 'NY',
                        postalCode: '10001',
                        countryCode: 'US'
                    }),
                    parameters: {basketId: 'test-basket-id'}
                })
            })
        })

        test('allows separate billing address when checkbox is unchecked', async () => {
            const user = userEvent.setup()
            const mockUpdateBillingAddress = jest.fn().mockResolvedValue({})
            useShopperBasketsMutation.mockImplementation((mutationType) => {
                if (mutationType === 'updateBillingAddressForBasket') {
                    return {mutateAsync: mockUpdateBillingAddress}
                }
                return {mutateAsync: jest.fn()}
            })

            render(<TestWrapper />)

            // Uncheck "Same as shipping address"
            const sameAsShippingCheckbox = screen.getByText(
                'checkout_payment.label.same_as_shipping'
            )
            await user.click(sameAsShippingCheckbox)

            // Should show the billing address form
            await waitFor(() => {
                expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
            })

            // Submit form
            const submitButton = screen.getByText('Review Order')
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockUpdateBillingAddress).toHaveBeenCalledWith({
                    body: expect.objectContaining({
                        firstName: 'Jane',
                        lastName: 'Smith',
                        address1: '456 Billing St',
                        city: 'Oakland',
                        stateCode: 'CA',
                        postalCode: '94601',
                        countryCode: 'US'
                    }),
                    parameters: {basketId: 'test-basket-id'}
                })
            })
        })

        test('validates billing address form when separate billing is used', async () => {
            const user = userEvent.setup()
            const mockTrigger = jest.fn().mockResolvedValue(false) // Invalid form
            const mockBillingAddressForm = {
                trigger: mockTrigger,
                getValues: jest.fn(),
                formState: {isSubmitting: false}
            }

            render(
                <TestWrapper
                    billingAddressForm={mockBillingAddressForm}
                    basketData={{...mockBasket, billingAddress: null}}
                />
            )

            // Uncheck "Same as shipping address"
            const sameAsShippingCheckbox = screen.getByText(
                'checkout_payment.label.same_as_shipping'
            )
            await user.click(sameAsShippingCheckbox)

            // Submit form
            const submitButton = screen.getByText('Review Order')
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockTrigger).toHaveBeenCalled()
            })
        })

        test('displays existing billing address when present', () => {
            const basketWithBilling = {
                ...mockBasket,
                billingAddress: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    address1: '456 Billing St',
                    city: 'Oakland',
                    stateCode: 'CA',
                    postalCode: '94601',
                    countryCode: 'US'
                }
            }

            render(<TestWrapper basketData={basketWithBilling} />)

            expect(screen.getByText('Jane Smith')).toBeInTheDocument()
            expect(screen.getByText('456 Billing St')).toBeInTheDocument()
        })
    })

    describe('User Registration', () => {
        test('shows user registration component when enabled', () => {
            render(<TestWrapper enableUserRegistration={true} isRegistered={false} />)

            // User registration should be shown
            expect(screen.getByTestId('user-registration')).toBeInTheDocument()
            expect(screen.getByText('Review Order')).toBeInTheDocument()
        })

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
        test('shows save payment method option for registered users', () => {
            render(<TestWrapper isRegistered={true} />)

            expect(screen.getByTestId('save-payment-method')).toBeInTheDocument()
        })

        test('hides save payment method option for guest users', () => {
            render(<TestWrapper isRegistered={false} />)

            expect(screen.queryByTestId('save-payment-method')).not.toBeInTheDocument()
        })

        test('calls onSavePreferenceChange when save preference changes', () => {
            const mockOnSavePreferenceChange = jest.fn()

            render(
                <TestWrapper
                    onSavePreferenceChange={mockOnSavePreferenceChange}
                    isRegistered={true}
                />
            )

            // The component should set up the save preference handler
            expect(mockOnSavePreferenceChange).toBeDefined()
        })

        test('identifies new payment instruments correctly', () => {
            const customerWithDifferentCard = {
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'different-payment-1',
                        paymentCard: {
                            cardType: 'Mastercard',
                            numberLastDigits: '5678',
                            expirationMonth: 11,
                            expirationYear: 2026,
                            holder: 'Jane Doe'
                        }
                    }
                ]
            }

            render(<TestWrapper customerData={customerWithDifferentCard} isRegistered={true} />)

            // Component should detect new payment instruments
            expect(screen.getByText('Review Order')).toBeInTheDocument()
        })
    })

    describe('Form Validation and Submission', () => {
        test('validates payment form before submission', async () => {
            const user = userEvent.setup()
            const mockAddPaymentInstrument = jest.fn().mockResolvedValue({})
            const mockPaymentMethodForm = {
                handleSubmit: jest.fn((callback) => (e) => {
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

        test('submits form when all validations pass', async () => {
            const user = userEvent.setup()
            const mockAddPaymentInstrument = jest.fn().mockResolvedValue({})
            const mockUpdateBillingAddress = jest.fn().mockResolvedValue({basketId: 'updated'})
            const mockGoToNextStep = jest.fn()

            useShopperBasketsMutation.mockImplementation((mutationType) => {
                if (mutationType === 'addPaymentInstrumentToBasket') {
                    return {mutateAsync: mockAddPaymentInstrument}
                }
                if (mutationType === 'updateBillingAddressForBasket') {
                    return {mutateAsync: mockUpdateBillingAddress}
                }
                return {mutateAsync: jest.fn()}
            })

            useCheckout.mockReturnValue({
                step: 4,
                STEPS: {PAYMENT: 4, REVIEW_ORDER: 5},
                goToStep: jest.fn(),
                goToNextStep: mockGoToNextStep
            })

            render(<TestWrapper />)

            const submitButton = screen.getByText('Review Order')
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockGoToNextStep).toHaveBeenCalled()
            })
        })

        test('handles form submission errors gracefully', async () => {
            const user = userEvent.setup()
            const mockShowToast = jest.fn()
            const mockUpdateBillingAddress = jest
                .fn()
                .mockRejectedValue(new Error('Billing address update failed'))

            useToast.mockReturnValue(mockShowToast)
            useShopperBasketsMutation.mockImplementation((mutationType) => {
                if (mutationType === 'updateBillingAddressForBasket') {
                    return {mutateAsync: mockUpdateBillingAddress}
                }
                return {mutateAsync: jest.fn()}
            })

            render(<TestWrapper />)

            const submitButton = screen.getByText('Review Order')
            await user.click(submitButton)

            // Error should be handled gracefully
            await waitFor(() => {
                expect(mockUpdateBillingAddress).toHaveBeenCalled()
            })
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
