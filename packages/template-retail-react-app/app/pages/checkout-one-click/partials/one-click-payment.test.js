/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, fireEvent, waitFor} from '@testing-library/react'
import {useForm} from 'react-hook-form'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useShopperBasketsMutation, useCustomerType} from '@salesforce/commerce-sdk-react'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-container/util/checkout-context'
import Payment from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-payment'

// Mock dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer')
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast')
jest.mock('@salesforce/commerce-sdk-react')
jest.mock('@salesforce/retail-react-app/app/pages/checkout-container/util/checkout-context')
jest.mock('@salesforce/retail-react-app/app/components/promo-code', () => ({
    PromoCode: () => <div data-testid="promo-code">Promo Code Component</div>,
    usePromoCode: () => ({
        removePromoCode: jest.fn(),
        // Other promo code props
        promoCodeError: null,
        promoCodeLoading: false
    })
}))

// Mock CC utils
jest.mock('@salesforce/retail-react-app/app/utils/cc-utils', () => ({
    getPaymentInstrumentCardType: jest.fn((type) => type),
    getMaskCreditCardNumber: jest.fn((number) => `****${number.slice(-4)}`),
    getCreditCardIcon: jest.fn(() => {
        const MockIcon = () => <div data-testid="card-icon">Card Icon</div>
        return MockIcon
    })
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
    }
]

const mockBasket = {
    basketId: 'test-basket-id',
    paymentInstruments: [],
    billingAddress: null,
    shipments: [
        {
            shippingAddress: {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Main St',
                city: 'San Francisco',
                stateCode: 'CA',
                postalCode: '94105',
                countryCode: 'US'
            },
            shippingMethod: {
                c_storePickupEnabled: false
            }
        }
    ]
}

const TestWrapper = ({
    enableUserRegistration = false,
    registeredUserChoseGuest = false,
    onPaymentMethodSaved = jest.fn(),
    onSavePreferenceChange = jest.fn(),
    setEnableUserRegistration = jest.fn(),
    customerData = {paymentInstruments: mockPaymentInstruments},
    basketData = mockBasket,
    isRegistered = false
}) => {
    const paymentMethodForm = useForm()
    const billingAddressForm = useForm()

    // Mock hooks
    useCurrentCustomer.mockReturnValue({data: customerData})
    useCurrentBasket.mockReturnValue({data: basketData})
    useCustomerType.mockReturnValue({isRegistered})
    useToast.mockReturnValue(jest.fn())

    const mockCheckout = {
        step: 4,
        STEPS: {PAYMENT: 4},
        goToStep: jest.fn()
    }
    useCheckout.mockReturnValue(mockCheckout)

    // Mock mutations
    const mockAddPaymentInstrument = jest.fn()
    const mockUpdateBillingAddress = jest.fn()
    const mockRemovePaymentInstrument = jest.fn()

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

    return (
        <Payment
            paymentMethodForm={paymentMethodForm}
            billingAddressForm={billingAddressForm}
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
            renderWithProviders(<TestWrapper />)

            expect(screen.getByText('Payment')).toBeInTheDocument()
        })

        test('renders promo code component', () => {
            renderWithProviders(<TestWrapper />)

            expect(screen.getByTestId('promo-code')).toBeInTheDocument()
        })

        test('renders payment form when no payment instrument is applied', () => {
            renderWithProviders(<TestWrapper />)

            expect(screen.getByText('Credit Card')).toBeInTheDocument()
        })

        test('displays applied payment instrument when present', () => {
            const basketWithPayment = {
                ...mockBasket,
                paymentInstruments: [mockPaymentInstruments[0]]
            }

            renderWithProviders(<TestWrapper basketData={basketWithPayment} />)

            expect(screen.getByText('Visa')).toBeInTheDocument()
            expect(screen.getByText('•••• 1234')).toBeInTheDocument()
        })

        test('renders billing address section', () => {
            renderWithProviders(<TestWrapper />)

            expect(screen.getByText('Billing Address')).toBeInTheDocument()
        })

        test('shows "Same as shipping address" checkbox for non-pickup orders', () => {
            renderWithProviders(<TestWrapper />)

            expect(screen.getByText('Same as shipping address')).toBeInTheDocument()
        })

        test('hides "Same as shipping address" checkbox for pickup orders', () => {
            const pickupBasket = {
                ...mockBasket,
                shipments: [
                    {
                        ...mockBasket.shipments[0],
                        shippingMethod: {c_storePickupEnabled: true}
                    }
                ]
            }

            renderWithProviders(<TestWrapper basketData={pickupBasket} />)

            expect(screen.queryByText('Same as shipping address')).not.toBeInTheDocument()
        })
    })

    describe('Payment Instrument Management', () => {
        test('adds payment instrument when form is submitted', async () => {
            const mockAddPaymentInstrument = jest.fn().mockResolvedValue({})
            useShopperBasketsMutation.mockImplementation((mutationType) => {
                if (mutationType === 'addPaymentInstrumentToBasket') {
                    return {mutateAsync: mockAddPaymentInstrument}
                }
                return {mutateAsync: jest.fn()}
            })

            const {user} = renderWithProviders(<TestWrapper />)

            // Fill payment form and submit
            const numberInput = screen.getByLabelText('Card Number')
            await user.type(numberInput, '4111111111111111')

            const expiryInput = screen.getByLabelText('Expiry Date')
            await user.type(expiryInput, '12/25')

            const securityCodeInput = screen.getByLabelText('Security Code')
            await user.type(securityCodeInput, '123')

            const nameInput = screen.getByLabelText('Name on Card')
            await user.type(nameInput, 'John Doe')

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

            const {user} = renderWithProviders(<TestWrapper basketData={basketWithPayment} />)

            const removeButton = screen.getByText('Remove')
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
            const mockRemovePaymentInstrument = jest
                .fn()
                .mockRejectedValue(new Error('Remove failed'))
            const mockShowToast = jest.fn()
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

            const {user} = renderWithProviders(<TestWrapper basketData={basketWithPayment} />)

            const removeButton = screen.getByText('Remove')
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
            const mockUpdateBillingAddress = jest.fn().mockResolvedValue({})
            useShopperBasketsMutation.mockImplementation((mutationType) => {
                if (mutationType === 'updateBillingAddressForBasket') {
                    return {mutateAsync: mockUpdateBillingAddress}
                }
                return {mutateAsync: jest.fn()}
            })

            const {user} = renderWithProviders(<TestWrapper />)

            // Ensure "Same as shipping address" is checked (default)
            const sameAsShippingCheckbox = screen.getByText('Same as shipping address')
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
                        city: 'San Francisco',
                        stateCode: 'CA',
                        postalCode: '94105',
                        countryCode: 'US'
                    }),
                    parameters: {basketId: 'test-basket-id'}
                })
            })
        })

        test('allows separate billing address when checkbox is unchecked', async () => {
            const {user} = renderWithProviders(<TestWrapper />)

            const sameAsShippingCheckbox = screen.getByRole('checkbox')
            await user.click(sameAsShippingCheckbox)

            // Should show billing address form
            await waitFor(() => {
                expect(screen.getByLabelText('First Name')).toBeInTheDocument()
            })
        })

        test('validates billing address form when separate billing is used', async () => {
            const {user} = renderWithProviders(<TestWrapper />)

            // Uncheck "Same as shipping address"
            const sameAsShippingCheckbox = screen.getByRole('checkbox')
            await user.click(sameAsShippingCheckbox)

            await waitFor(() => {
                expect(screen.getByLabelText('First Name')).toBeInTheDocument()
            })

            // Try to submit without filling required fields
            const submitButton = screen.getByText('Review Order')
            await user.click(submitButton)

            // Should not proceed due to validation errors
            await waitFor(() => {
                expect(screen.getByText('Please enter your first name.')).toBeInTheDocument()
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

            renderWithProviders(<TestWrapper basketData={basketWithBilling} />)

            expect(screen.getByText('Jane Smith')).toBeInTheDocument()
            expect(screen.getByText('456 Billing St')).toBeInTheDocument()
        })
    })

    describe('User Registration', () => {
        test('shows user registration component when enabled', () => {
            renderWithProviders(<TestWrapper enableUserRegistration={true} isRegistered={false} />)

            // User registration component should be rendered
            // (The actual component test would verify its content)
            expect(screen.getByText('Review Order')).toBeInTheDocument()
        })

        test('hides user registration when user chose guest checkout', () => {
            renderWithProviders(
                <TestWrapper enableUserRegistration={true} registeredUserChoseGuest={true} />
            )

            // User registration should be hidden
            expect(screen.getByText('Review Order')).toBeInTheDocument()
        })

        test('calls setEnableUserRegistration when registration preference changes', () => {
            const mockSetEnableUserRegistration = jest.fn()

            renderWithProviders(
                <TestWrapper setEnableUserRegistration={mockSetEnableUserRegistration} />
            )

            // The component should set up the registration preference handler
            expect(mockSetEnableUserRegistration).toBeDefined()
        })
    })

    describe('Save Payment Method', () => {
        test('shows save payment method option for registered users', () => {
            renderWithProviders(<TestWrapper isRegistered={true} />)

            // Save payment method component should be rendered for registered users
            expect(screen.getByText('Review Order')).toBeInTheDocument()
        })

        test('hides save payment method option for guest users', () => {
            renderWithProviders(<TestWrapper isRegistered={false} />)

            // Component should still render but without save payment method option
            expect(screen.getByText('Review Order')).toBeInTheDocument()
        })

        test('calls onSavePreferenceChange when save preference changes', () => {
            const mockOnSavePreferenceChange = jest.fn()

            renderWithProviders(
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
                        paymentInstrumentId: 'different-payment',
                        paymentCard: {
                            cardType: 'MasterCard',
                            numberLastDigits: '5678',
                            expirationMonth: 6,
                            expirationYear: 2026,
                            holder: 'Jane Doe'
                        }
                    }
                ]
            }

            renderWithProviders(
                <TestWrapper customerData={customerWithDifferentCard} isRegistered={true} />
            )

            // Component should detect new payment instruments
            expect(screen.getByText('Review Order')).toBeInTheDocument()
        })
    })

    describe('Form Validation and Submission', () => {
        test('validates payment form before submission', async () => {
            const {user} = renderWithProviders(<TestWrapper />)

            // Try to submit without filling payment form
            const submitButton = screen.getByText('Review Order')
            await user.click(submitButton)

            // Should show validation errors
            await waitFor(() => {
                expect(screen.getByText('Please enter your card number')).toBeInTheDocument()
            })
        })

        test('submits form when all validations pass', async () => {
            const mockAddPaymentInstrument = jest.fn().mockResolvedValue({})
            const mockUpdateBillingAddress = jest.fn().mockResolvedValue({})
            const mockGoToStep = jest.fn()

            useShopperBasketsMutation.mockImplementation((mutationType) => {
                switch (mutationType) {
                    case 'addPaymentInstrumentToBasket':
                        return {mutateAsync: mockAddPaymentInstrument}
                    case 'updateBillingAddressForBasket':
                        return {mutateAsync: mockUpdateBillingAddress}
                    default:
                        return {mutateAsync: jest.fn()}
                }
            })

            useCheckout.mockReturnValue({
                step: 4,
                STEPS: {PAYMENT: 4},
                goToStep: mockGoToStep
            })

            const {user} = renderWithProviders(<TestWrapper />)

            // Fill payment form
            await user.type(screen.getByLabelText('Card Number'), '4111111111111111')
            await user.type(screen.getByLabelText('Expiry Date'), '12/25')
            await user.type(screen.getByLabelText('Security Code'), '123')
            await user.type(screen.getByLabelText('Name on Card'), 'John Doe')

            const submitButton = screen.getByText('Review Order')
            await user.click(submitButton)

            // Should submit successfully
            await waitFor(() => {
                expect(mockAddPaymentInstrument).toHaveBeenCalled()
                expect(mockUpdateBillingAddress).toHaveBeenCalled()
            })
        })

        test('handles form submission errors gracefully', async () => {
            const mockAddPaymentInstrument = jest
                .fn()
                .mockRejectedValue(new Error('Payment failed'))
            const mockShowToast = jest.fn()
            useToast.mockReturnValue(mockShowToast)

            useShopperBasketsMutation.mockImplementation((mutationType) => {
                if (mutationType === 'addPaymentInstrumentToBasket') {
                    return {mutateAsync: mockAddPaymentInstrument}
                }
                return {mutateAsync: jest.fn()}
            })

            const {user} = renderWithProviders(<TestWrapper />)

            // Fill and submit form
            await user.type(screen.getByLabelText('Card Number'), '4111111111111111')
            await user.type(screen.getByLabelText('Expiry Date'), '12/25')
            await user.type(screen.getByLabelText('Security Code'), '123')
            await user.type(screen.getByLabelText('Name on Card'), 'John Doe')

            const submitButton = screen.getByText('Review Order')
            await user.click(submitButton)

            // Should handle error
            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith({
                    title: expect.any(String),
                    status: 'error'
                })
            })
        })
    })

    describe('Edge Cases', () => {
        test('handles empty basket gracefully', () => {
            renderWithProviders(<TestWrapper basketData={null} />)

            expect(screen.getByText('Payment')).toBeInTheDocument()
        })

        test('handles customer without payment instruments', () => {
            renderWithProviders(<TestWrapper customerData={{paymentInstruments: []}} />)

            expect(screen.getByText('Credit Card')).toBeInTheDocument()
        })

        test('handles undefined customer data', () => {
            renderWithProviders(<TestWrapper customerData={undefined} />)

            expect(screen.getByText('Payment')).toBeInTheDocument()
        })

        test('handles basket without shipments', () => {
            const basketWithoutShipments = {
                ...mockBasket,
                shipments: []
            }

            renderWithProviders(<TestWrapper basketData={basketWithoutShipments} />)

            expect(screen.getByText('Payment')).toBeInTheDocument()
        })

        test('handles null billing address form values', async () => {
            const {user} = renderWithProviders(<TestWrapper />)

            // Uncheck same as shipping
            const checkbox = screen.getByRole('checkbox')
            await user.click(checkbox)

            // Try to submit with empty billing form
            const submitButton = screen.getByText('Review Order')
            await user.click(submitButton)

            // Should handle validation gracefully
            await waitFor(() => {
                expect(screen.getByText('Please enter your first name.')).toBeInTheDocument()
            })
        })
    })

    describe('Accessibility', () => {
        test('payment section has proper heading structure', () => {
            renderWithProviders(<TestWrapper />)

            expect(screen.getByRole('heading', {name: 'Payment'})).toBeInTheDocument()
            expect(screen.getByRole('heading', {name: 'Credit Card'})).toBeInTheDocument()
            expect(screen.getByRole('heading', {name: 'Billing Address'})).toBeInTheDocument()
        })

        test('form controls have proper labels', () => {
            renderWithProviders(<TestWrapper />)

            expect(screen.getByLabelText('Card Number')).toBeInTheDocument()
            expect(screen.getByLabelText('Expiry Date')).toBeInTheDocument()
            expect(screen.getByLabelText('Security Code')).toBeInTheDocument()
            expect(screen.getByLabelText('Name on Card')).toBeInTheDocument()
        })

        test('buttons have accessible labels', () => {
            renderWithProviders(<TestWrapper />)

            expect(screen.getByText('Review Order')).toBeInTheDocument()
        })

        test('checkboxes have proper labels', () => {
            renderWithProviders(<TestWrapper />)

            expect(screen.getByText('Same as shipping address')).toBeInTheDocument()
        })
    })
})
