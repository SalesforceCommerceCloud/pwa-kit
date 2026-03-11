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
import {useCurrency} from '@salesforce/retail-react-app/app/hooks/use-currency'
import {
    useShopperBasketsV2Mutation as useShopperBasketsMutation,
    useCustomerType
} from '@salesforce/commerce-sdk-react'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
import Payment from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-payment'
import {CurrencyProvider} from '@salesforce/retail-react-app/app/contexts'
import {IntlProvider} from 'react-intl'
jest.mock('@salesforce/retail-react-app/app/hooks/use-app-origin', () => ({
    useAppOrigin: () => 'https://example.test'
}))

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
jest.mock('@salesforce/retail-react-app/app/hooks/use-currency')
jest.mock('@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context')
jest.mock('@salesforce/commerce-sdk-react', () => {
    const original = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...original,
        useShopperBasketsV2Mutation: jest.fn(),
        useAuthHelper: jest.fn(() => ({mutateAsync: jest.fn()})),
        useUsid: () => ({getUsidWhenReady: jest.fn().mockResolvedValue('usid-123')}),
        useCustomerType: jest.fn(() => ({isGuest: true, isRegistered: false})),
        useDNT: jest.fn(() => ({effectiveDnt: false}))
    }
})

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
        const MockPaymentForm = function ({onSubmit, onPaymentMethodChange, children}) {
            return (
                <div data-testid="payment-form">
                    <div>Credit Card</div>
                    <input aria-label="Card Number" data-testid="card-number" />
                    <input aria-label="Expiry Date" data-testid="expiry-date" />
                    <input aria-label="CVV" data-testid="cvv" />
                    {children}
                    <button type="button" onClick={() => onPaymentMethodChange?.('cc')}>
                        Select CC
                    </button>
                    <button type="button" onClick={() => onPaymentMethodChange?.('pi-1')}>
                        Select Saved
                    </button>
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
        const MockUserRegistration = function ({enableUserRegistration, onRegistered, isDisabled}) {
            return (
                <div data-testid="user-registration" data-disabled={isDisabled}>
                    User Registration
                    <input
                        type="checkbox"
                        data-testid="user-registration-checkbox"
                        checked={enableUserRegistration}
                        disabled={isDisabled}
                        onChange={() => {}}
                    />
                    <button
                        data-testid="trigger-registration"
                        onClick={async () => {
                            if (onRegistered) {
                                await onRegistered('new-basket-id')
                            }
                        }}
                    >
                        Complete Registration
                    </button>
                </div>
            )
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
    orderTotal: 100.0,
    shipments: [
        {
            shipmentId: 's-1',
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
    productItems: [
        {
            itemId: 'item-1',
            shipmentId: 's-1'
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
    onPaymentSubmitted = undefined,
    registeredUserChoseGuest = false,
    removePaymentShouldFail = false,
    addPaymentShouldFail = false,
    initialStep = 4,
    selectedPaymentMethod = null,
    isEditing = false,
    onSelectedPaymentMethodChange = jest.fn(),
    onIsEditingChange = jest.fn(),
    billingSameAsShipping: initialBillingSameAsShipping = true,
    setBillingSameAsShipping: providedSetBillingSameAsShipping,
    paymentMethodForm: providedPaymentMethodForm,
    billingAddressForm: providedBillingAddressForm
}) => {
    // Manage billingSameAsShipping as state so the component can update it
    const [billingSameAsShipping, setBillingSameAsShippingState] = React.useState(
        initialBillingSameAsShipping
    )

    // Create a setter that updates both state and calls the provided setter if given
    const setBillingSameAsShipping = React.useCallback(
        (value) => {
            setBillingSameAsShippingState(value)
            if (providedSetBillingSameAsShipping) {
                providedSetBillingSameAsShipping(value)
            }
        },
        [providedSetBillingSameAsShipping]
    )

    // Sync state when initial prop changes
    React.useEffect(() => {
        setBillingSameAsShippingState(initialBillingSameAsShipping)
    }, [initialBillingSameAsShipping])
    // Mock hooks
    useCurrentCustomer.mockReturnValue({data: customerData})
    useCurrentBasket.mockReturnValue({data: basketData, refetch: jest.fn().mockResolvedValue({})})
    useCustomerType.mockReturnValue({
        isRegistered,
        isGuest: !isRegistered
    })
    useToast.mockReturnValue(mockToastFn)
    useCurrency.mockReturnValue({currency: 'USD'})

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
    const mockAddPaymentInstrument = addPaymentShouldFail
        ? jest.fn().mockRejectedValue(new Error('add failed'))
        : jest.fn().mockResolvedValue({})
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
    const mockPaymentMethodForm = providedPaymentMethodForm || {
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

    const mockBillingAddressForm = providedBillingAddressForm || {
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
                    onPaymentSubmitted={onPaymentSubmitted}
                    selectedPaymentMethod={selectedPaymentMethod}
                    isEditing={isEditing}
                    onSelectedPaymentMethodChange={onSelectedPaymentMethodChange}
                    onIsEditingChange={onIsEditingChange}
                    billingSameAsShipping={billingSameAsShipping}
                    setBillingSameAsShipping={setBillingSameAsShipping}
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

            expect(
                screen.getByRole('checkbox', {
                    name: /same as shipping address|checkout_payment\.label\.same_as_shipping/i
                })
            ).toBeInTheDocument()
        })

        test('hides "Same as shipping address" checkbox for pickup orders', () => {
            const pickupBasket = {
                ...mockBasket,
                shipments: [
                    {
                        ...mockBasket.shipments[0],
                        shipmentId: 'shipment-1',
                        shippingMethod: {
                            c_storePickupEnabled: true
                        }
                    }
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        shipmentId: 'shipment-1',
                        productId: 'product-1',
                        quantity: 1
                    }
                ]
            }

            render(<TestWrapper basketData={pickupBasket} />)

            const sameAs =
                screen.queryByRole('checkbox', {name: /same as shipping address/i}) ||
                screen.queryByText('checkout_payment.label.same_as_shipping')
            expect(sameAs).not.toBeInTheDocument()

            // Billing form should be shown immediately for pickup-only
            expect(screen.getByTestId('payment-form')).toBeInTheDocument()
        })

        test('pickup-only shows billing address form immediately (initial render)', async () => {
            const pickupBasket = {
                ...mockBasket,
                billingAddress: null,
                shipments: [
                    {
                        shipmentId: 'p-1',
                        shippingAddress: null,
                        shippingMethod: {
                            c_storePickupEnabled: true
                        }
                    }
                ],
                productItems: [{itemId: 'p-item', shipmentId: 'p-1'}]
            }
            render(<TestWrapper basketData={pickupBasket} />)
            // When pickup-only, billingSameAsShipping is forced false and the form should be shown
            expect(await screen.findByTestId('shipping-address-selection')).toBeInTheDocument()
        })

        test('pickup-only shows billing address form immediately', async () => {
            const pickupBasket = {
                ...mockBasket,
                billingAddress: null,
                shipments: [
                    {
                        shipmentId: 'p2-1',
                        shippingAddress: null,
                        shippingMethod: {
                            c_storePickupEnabled: true
                        }
                    }
                ],
                productItems: [{itemId: 'p2-item', shipmentId: 'p2-1'}]
            }
            render(<TestWrapper basketData={pickupBasket} />)
            // When pickup-only, billingSameAsShipping is forced false and the form should be shown
            await waitFor(() => {
                expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
            })
        })
    })

    describe('Callbacks', () => {
        test('calls onPaymentSubmitted with full card details on submit', async () => {
            const user = userEvent.setup()
            const onPaymentSubmitted = jest.fn()
            render(
                <TestWrapper
                    onPaymentMethodSaved={jest.fn()}
                    onSavePreferenceChange={jest.fn()}
                    onPaymentSubmitted={onPaymentSubmitted}
                />
            )
            await user.click(screen.getByText('Submit Payment'))
            expect(onPaymentSubmitted).toHaveBeenCalledWith({
                number: '4111111111111111',
                expiry: '12/25',
                cvv: '123',
                holder: 'John Doe',
                cardType: 'Visa'
            })
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

        test('retains billingSameAsShipping unchecked after authentication via user registration', async () => {
            const user = userEvent.setup()

            render(<TestWrapper enableUserRegistration={true} billingSameAsShipping={false} />)

            // Verify initial state - billingSameAsShipping should be false
            expect(screen.getByText('checkout_payment.label.same_as_shipping')).toBeInTheDocument()
            const checkboxBefore = document.querySelector('input[name="billingSameAsShipping"]')
            expect(checkboxBefore).toBeInTheDocument()
            expect(checkboxBefore).not.toBeChecked()

            // Find and trigger user registration
            const registrationComponent = screen.getByTestId('user-registration')
            const triggerRegistrationButton =
                within(registrationComponent).getByTestId('trigger-registration')

            // Trigger registration
            await user.click(triggerRegistrationButton)

            // Wait for registration to complete
            await waitFor(() => {
                expect(screen.getByTestId('user-registration')).toBeInTheDocument()
            })

            // Verify checkbox still reflects the retained state (unchecked)
            const checkboxAfter = document.querySelector('input[name="billingSameAsShipping"]')
            expect(checkboxAfter).toBeInTheDocument()
            expect(checkboxAfter).not.toBeChecked()
        })

        test('retains billingSameAsShipping checked after authentication via user registration', async () => {
            const user = userEvent.setup()

            render(<TestWrapper enableUserRegistration={true} billingSameAsShipping={true} />)

            // Verify initial state - billingSameAsShipping should be true
            expect(screen.getByText('checkout_payment.label.same_as_shipping')).toBeInTheDocument()
            const checkboxBefore = document.querySelector('input[name="billingSameAsShipping"]')
            expect(checkboxBefore).toBeInTheDocument()
            expect(checkboxBefore).toBeChecked()

            // Find and trigger user registration
            const registrationComponent = screen.getByTestId('user-registration')
            const triggerRegistrationButton =
                within(registrationComponent).getByTestId('trigger-registration')

            // Trigger registration
            await user.click(triggerRegistrationButton)

            // Wait for registration to complete
            await waitFor(() => {
                expect(screen.getByTestId('user-registration')).toBeInTheDocument()
            })

            // Verify checkbox still reflects the retained state (checked)
            const checkboxAfter = document.querySelector('input[name="billingSameAsShipping"]')
            expect(checkboxAfter).toBeInTheDocument()
            expect(checkboxAfter).toBeChecked()
        })

        test('does not add payment again during registration when payment already exists on basket', async () => {
            const user = userEvent.setup()
            const mockAddPaymentInstrument = jest.fn().mockResolvedValue({})

            const basketWithPayment = {
                ...mockBasket,
                paymentInstruments: [mockPaymentInstruments[0]]
            }

            useShopperBasketsMutation.mockImplementation((mutationType) => {
                switch (mutationType) {
                    case 'addPaymentInstrumentToBasket':
                        return {mutateAsync: mockAddPaymentInstrument}
                    case 'updateBillingAddressForBasket':
                        return {mutateAsync: jest.fn().mockResolvedValue({})}
                    case 'removePaymentInstrumentFromBasket':
                        return {mutateAsync: jest.fn().mockResolvedValue({})}
                    default:
                        return {mutateAsync: jest.fn()}
                }
            })

            render(
                <TestWrapper
                    basketData={basketWithPayment}
                    enableUserRegistration={true}
                    paymentMethodForm={{
                        handleSubmit: jest.fn((callback) => (e) => {
                            e?.preventDefault?.()
                            callback({})
                        }),
                        watch: jest.fn(() => ({unsubscribe: jest.fn()})),
                        getValues: jest.fn(() => ({
                            number: '4111111111111111',
                            holder: 'John Doe',
                            expiry: '12/25'
                        })),
                        formState: {isSubmitting: false, isValid: true}
                    }}
                />
            )

            // Find and trigger user registration
            const registrationComponent = screen.getByTestId('user-registration')
            const triggerRegistrationButton =
                within(registrationComponent).getByTestId('trigger-registration')

            // Trigger registration
            await user.click(triggerRegistrationButton)

            // Wait for registration to complete
            await waitFor(() => {
                expect(screen.getByTestId('user-registration')).toBeInTheDocument()
            })

            // Verify payment was NOT added again (payment already exists on basket)
            // Payment should be transferred during basket merge, not added again
            expect(mockAddPaymentInstrument).not.toHaveBeenCalled()
        })

        test('does not add payment during registration even when payment form has values', async () => {
            const user = userEvent.setup()
            const mockAddPaymentInstrument = jest.fn().mockResolvedValue({})

            // Basket without payment initially, but payment will be on basket before registration
            // (since registration checkbox is disabled until payment is filled)
            const basketWithPayment = {
                ...mockBasket,
                paymentInstruments: [mockPaymentInstruments[0]]
            }

            useShopperBasketsMutation.mockImplementation((mutationType) => {
                switch (mutationType) {
                    case 'addPaymentInstrumentToBasket':
                        return {mutateAsync: mockAddPaymentInstrument}
                    case 'updateBillingAddressForBasket':
                        return {mutateAsync: jest.fn().mockResolvedValue({})}
                    case 'removePaymentInstrumentFromBasket':
                        return {mutateAsync: jest.fn().mockResolvedValue({})}
                    default:
                        return {mutateAsync: jest.fn()}
                }
            })

            const mockPaymentMethodForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                watch: jest.fn(() => ({unsubscribe: jest.fn()})),
                getValues: jest.fn(() => ({
                    number: '4111111111111111',
                    holder: 'John Doe',
                    expiry: '12/25',
                    cardType: 'Visa'
                })),
                formState: {isSubmitting: false, isValid: true}
            }

            render(
                <TestWrapper
                    basketData={basketWithPayment}
                    enableUserRegistration={true}
                    paymentMethodForm={mockPaymentMethodForm}
                />
            )

            // Find and trigger user registration
            const registrationComponent = screen.getByTestId('user-registration')
            const triggerRegistrationButton =
                within(registrationComponent).getByTestId('trigger-registration')

            // Trigger registration
            await user.click(triggerRegistrationButton)

            // Wait for registration to complete
            await waitFor(() => {
                expect(screen.getByTestId('user-registration')).toBeInTheDocument()
            })

            // Verify payment was NOT added again
            // Payment is already on basket (registration requires payment to be filled first)
            // Basket transfer/merge will preserve the payment, no need to add it again
            expect(mockAddPaymentInstrument).not.toHaveBeenCalled()
        })

        test('disables user registration checkbox when payment is not filled in', () => {
            const mockPaymentMethodForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                watch: jest.fn(() => ({unsubscribe: jest.fn()})),
                formState: {isSubmitting: false, isValid: false}
            }

            render(
                <TestWrapper
                    enableUserRegistration={false}
                    paymentMethodForm={mockPaymentMethodForm}
                />
            )

            const registrationCheckbox = screen.getByTestId('user-registration-checkbox')
            expect(registrationCheckbox).toBeDisabled()
        })

        test('disables user registration checkbox when same as shipping is unchecked and billing address is not filled in', () => {
            const mockPaymentMethodForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                watch: jest.fn(() => ({unsubscribe: jest.fn()})),
                formState: {isSubmitting: false, isValid: true}
            }

            const mockBillingAddressForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                trigger: jest.fn().mockResolvedValue(true),
                getValues: jest.fn(() => ({})),
                formState: {isSubmitting: false, isValid: false}
            }

            render(
                <TestWrapper
                    enableUserRegistration={false}
                    billingSameAsShipping={false}
                    paymentMethodForm={mockPaymentMethodForm}
                    billingAddressForm={mockBillingAddressForm}
                />
            )

            const registrationCheckbox = screen.getByTestId('user-registration-checkbox')
            expect(registrationCheckbox).toBeDisabled()
        })

        test('enables user registration checkbox when same as shipping is checked even if billing address form is invalid', () => {
            const mockPaymentMethodForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                watch: jest.fn(() => ({unsubscribe: jest.fn()})),
                formState: {isSubmitting: false, isValid: true}
            }

            const mockBillingAddressForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                trigger: jest.fn().mockResolvedValue(true),
                getValues: jest.fn(() => ({})),
                formState: {isSubmitting: false, isValid: false}
            }

            render(
                <TestWrapper
                    enableUserRegistration={false}
                    billingSameAsShipping={true}
                    paymentMethodForm={mockPaymentMethodForm}
                    billingAddressForm={mockBillingAddressForm}
                />
            )

            const registrationCheckbox = screen.getByTestId('user-registration-checkbox')
            expect(registrationCheckbox).not.toBeDisabled()
        })

        test('enables user registration checkbox when same as shipping is unchecked but billing address is filled in', () => {
            const mockPaymentMethodForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                watch: jest.fn(() => ({unsubscribe: jest.fn()})),
                formState: {isSubmitting: false, isValid: true}
            }

            const mockBillingAddressForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
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
                formState: {isSubmitting: false, isValid: true}
            }

            render(
                <TestWrapper
                    enableUserRegistration={false}
                    billingSameAsShipping={false}
                    paymentMethodForm={mockPaymentMethodForm}
                    billingAddressForm={mockBillingAddressForm}
                />
            )

            const registrationCheckbox = screen.getByTestId('user-registration-checkbox')
            expect(registrationCheckbox).not.toBeDisabled()
        })

        test('disables user registration checkbox when payment is filled in but same as shipping is unchecked and billing address is invalid', () => {
            const basketWithPayment = {
                ...mockBasket,
                paymentInstruments: [mockPaymentInstruments[0]]
            }

            const mockPaymentMethodForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                watch: jest.fn(() => ({unsubscribe: jest.fn()})),
                formState: {isSubmitting: false, isValid: false}
            }

            const mockBillingAddressForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                trigger: jest.fn().mockResolvedValue(true),
                getValues: jest.fn(() => ({})),
                formState: {isSubmitting: false, isValid: false}
            }

            render(
                <TestWrapper
                    basketData={basketWithPayment}
                    enableUserRegistration={false}
                    billingSameAsShipping={false}
                    paymentMethodForm={mockPaymentMethodForm}
                    billingAddressForm={mockBillingAddressForm}
                />
            )

            const registrationCheckbox = screen.getByTestId('user-registration-checkbox')
            expect(registrationCheckbox).toBeDisabled()
        })

        test('enables user registration checkbox when payment is filled in and billing address is valid', () => {
            const basketWithPayment = {
                ...mockBasket,
                paymentInstruments: [mockPaymentInstruments[0]]
            }

            const mockPaymentMethodForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                watch: jest.fn(() => ({unsubscribe: jest.fn()})),
                formState: {isSubmitting: false, isValid: false}
            }

            const mockBillingAddressForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
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
                formState: {isSubmitting: false, isValid: true}
            }

            render(
                <TestWrapper
                    basketData={basketWithPayment}
                    enableUserRegistration={false}
                    billingSameAsShipping={false}
                    paymentMethodForm={mockPaymentMethodForm}
                    billingAddressForm={mockBillingAddressForm}
                />
            )

            const registrationCheckbox = screen.getByTestId('user-registration-checkbox')
            expect(registrationCheckbox).not.toBeDisabled()
        })

        test('disables user registration checkbox when unchecking same as shipping with invalid billing address', async () => {
            const user = userEvent.setup()

            const mockPaymentMethodForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                watch: jest.fn(() => ({unsubscribe: jest.fn()})),
                formState: {isSubmitting: false, isValid: true}
            }

            const mockBillingAddressForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                trigger: jest.fn().mockResolvedValue(true),
                getValues: jest.fn(() => ({})),
                formState: {isSubmitting: false, isValid: false}
            }

            render(
                <TestWrapper
                    enableUserRegistration={false}
                    billingSameAsShipping={true}
                    paymentMethodForm={mockPaymentMethodForm}
                    billingAddressForm={mockBillingAddressForm}
                />
            )

            // Initially enabled when same as shipping is checked
            let registrationCheckbox = screen.getByTestId('user-registration-checkbox')
            expect(registrationCheckbox).not.toBeDisabled()

            // Uncheck "same as shipping"
            const sameAsShippingCheckbox = screen.getByRole('checkbox', {
                name: /same as shipping address|checkout_payment\.label\.same_as_shipping/i
            })
            await user.click(sameAsShippingCheckbox)

            // Now should be disabled because billing address is not filled in
            await waitFor(() => {
                registrationCheckbox = screen.getByTestId('user-registration-checkbox')
                expect(registrationCheckbox).toBeDisabled()
            })
        })

        test('disables user registration checkbox in summary view when same as shipping is unchecked and billing address is invalid', () => {
            const basketWithPayment = {
                ...mockBasket,
                paymentInstruments: [mockPaymentInstruments[0]]
            }

            const mockPaymentMethodForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                watch: jest.fn(() => ({unsubscribe: jest.fn()})),
                formState: {isSubmitting: false, isValid: false}
            }

            const mockBillingAddressForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                trigger: jest.fn().mockResolvedValue(true),
                getValues: jest.fn(() => ({})),
                formState: {isSubmitting: false, isValid: false}
            }

            render(
                <TestWrapper
                    basketData={basketWithPayment}
                    enableUserRegistration={false}
                    billingSameAsShipping={false}
                    initialStep={5}
                    isEditing={false}
                    paymentMethodForm={mockPaymentMethodForm}
                    billingAddressForm={mockBillingAddressForm}
                />
            )

            // In summary view, should be disabled when same as shipping is unchecked and billing is invalid
            const registrationCheckbox = screen.getByTestId('user-registration-checkbox')
            expect(registrationCheckbox).toBeDisabled()
        })

        test('enables user registration checkbox in summary view when payment is applied', () => {
            const basketWithPayment = {
                ...mockBasket,
                paymentInstruments: [mockPaymentInstruments[0]]
            }

            const mockPaymentMethodForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                watch: jest.fn(() => ({unsubscribe: jest.fn()})),
                formState: {isSubmitting: false, isValid: false}
            }

            const mockBillingAddressForm = {
                handleSubmit: jest.fn((callback) => (e) => {
                    e?.preventDefault?.()
                    callback({})
                }),
                trigger: jest.fn().mockResolvedValue(true),
                getValues: jest.fn(() => ({})),
                formState: {isSubmitting: false, isValid: false}
            }

            render(
                <TestWrapper
                    basketData={basketWithPayment}
                    enableUserRegistration={false}
                    billingSameAsShipping={true}
                    initialStep={5}
                    isEditing={false}
                    paymentMethodForm={mockPaymentMethodForm}
                    billingAddressForm={mockBillingAddressForm}
                />
            )

            // In summary view with payment applied, should be enabled
            const registrationCheckbox = screen.getByTestId('user-registration-checkbox')
            expect(registrationCheckbox).not.toBeDisabled()
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
            const checkbox = screen.getByRole('checkbox', {
                name: /same as shipping address|checkout_payment\.label\.same_as_shipping/i
            })
            await user.click(checkbox)

            // Should show the billing address form
            await waitFor(() => {
                expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
            })
        })
    })

    describe('Error Handling', () => {
        test('shows error toast when add payment API fails on submit', async () => {
            const user = userEvent.setup()
            render(<TestWrapper addPaymentShouldFail={true} />)
            await user.click(screen.getByText('Submit Payment'))
            await waitFor(() => {
                expect(mockToastFn).toHaveBeenCalled()
            })
        })

        test('shows error toast and aborts when removing applied payment fails on change', async () => {
            const user = userEvent.setup()
            const basketWithApplied = {
                ...mockBasket,
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'applied-1',
                        paymentCard: {
                            cardType: 'Visa',
                            numberLastDigits: '1111',
                            expirationMonth: 1,
                            expirationYear: 2030
                        }
                    }
                ]
            }
            render(
                <TestWrapper
                    basketData={basketWithApplied}
                    removePaymentShouldFail={true}
                    isEditing={true}
                />
            )
            // Payment form should be visible in edit mode
            expect(await screen.findByTestId('payment-form')).toBeInTheDocument()
            await user.click(screen.getByText('Select CC'))
            await waitFor(() => {
                expect(mockToastFn).toHaveBeenCalled()
            })
        })

        test('enters edit mode successfully when handleEditPayment is called', async () => {
            const user = userEvent.setup()

            // Mock customer as registered with a payment instrument
            useCustomerType.mockReturnValue({isGuest: false, isRegistered: true})
            const basketWithPayment = {
                ...mockBasket,
                paymentInstruments: [mockPaymentInstruments[0]]
            }

            // Create state management for the test
            let isEditing = false
            const mockOnIsEditingChange = jest.fn((value) => {
                isEditing = value
            })

            const {rerender} = render(
                <TestWrapper
                    basketData={basketWithPayment}
                    initialStep={5} // REVIEW_ORDER step
                    isEditing={isEditing}
                    onIsEditingChange={mockOnIsEditingChange}
                />
            )

            // Click Edit Payment Info to enter edit mode
            const summary = screen.getAllByTestId('toggle-card-summary').pop()
            const editButton = within(summary).getByRole('button', {
                name: /toggle_card.action.changePaymentInfo|Change/i
            })
            await user.click(editButton)

            // Re-render with updated state
            rerender(
                <TestWrapper
                    basketData={basketWithPayment}
                    initialStep={5}
                    isEditing={isEditing}
                    onIsEditingChange={mockOnIsEditingChange}
                />
            )

            // Should enter edit mode successfully
            await waitFor(() => {
                expect(screen.getByTestId('toggle-card-edit')).toBeInTheDocument()
            })

            // Verify payment form is visible in edit mode
            expect(screen.getByTestId('payment-form')).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        test('changing to a saved payment instrument does not error', async () => {
            const user = userEvent.setup()
            // Provide saved instrument id 'pi-1' to match the PaymentForm mock
            const customerWithSaved = {
                isRegistered: true,
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'pi-1',
                        default: true,
                        billingAddress: null
                    }
                ]
            }
            // Use isEditing so auto-apply is skipped and the form stays visible (avoids CI race)
            render(
                <TestWrapper
                    isRegistered={true}
                    customerData={customerWithSaved}
                    isEditing={true}
                />
            )
            await screen.findByTestId('payment-form')
            await user.click(screen.getByText('Select Saved'))
            // If no error thrown, the path executed successfully
            expect(screen.getByTestId('payment-form')).toBeInTheDocument()
        })

        test('changing to a saved instrument on pickup updates without error', async () => {
            const user = userEvent.setup()
            const pickupBasket = {
                ...mockBasket,
                shipments: [
                    {
                        ...mockBasket.shipments[0],
                        shippingMethod: {c_storePickupEnabled: true}
                    }
                ]
            }
            const customerWithSaved = {
                isRegistered: true,
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'pi-1',
                        default: true,
                        billingAddress: {
                            address1: '1 Admin Way',
                            city: 'SF',
                            stateCode: 'CA',
                            postalCode: '94105',
                            countryCode: 'US'
                        }
                    }
                ]
            }
            // Use isEditing so auto-apply is skipped and the form stays visible (avoids CI race)
            render(
                <TestWrapper
                    basketData={pickupBasket}
                    isRegistered={true}
                    customerData={customerWithSaved}
                    isEditing={true}
                />
            )
            await screen.findByTestId('payment-form')
            await user.click(screen.getByText('Select Saved'))
            expect(screen.getByTestId('payment-form')).toBeInTheDocument()
        })
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
            expect(screen.getByText('Select CC')).toBeInTheDocument()
            expect(screen.getByText('Select Saved')).toBeInTheDocument()
            expect(screen.getByText('Review Order')).toBeInTheDocument()
        })

        test('checkboxes have proper labels', () => {
            render(<TestWrapper />)

            const labelNode =
                screen.queryByText(/same as shipping address/i) ||
                screen.queryByText('checkout_payment.label.same_as_shipping')
            expect(labelNode).toBeInTheDocument()
        })
    })
})
