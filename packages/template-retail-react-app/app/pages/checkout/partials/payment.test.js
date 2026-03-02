/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import Payment from '@salesforce/retail-react-app/app/pages/checkout/partials/payment'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

const STEPS = {
    CONTACT_INFO: 0,
    PICKUP_ADDRESS: 1,
    SHIPPING_ADDRESS: 2,
    SHIPPING_OPTIONS: 3,
    PAYMENT: 4,
    REVIEW_ORDER: 5
}

const mockGoToStep = jest.fn()
const mockGoToNextStep = jest.fn()
const mockAddPaymentInstrument = jest.fn()
const mockUpdateBillingAddress = jest.fn()
const mockRemovePaymentInstrument = jest.fn()
const mockShowToast = jest.fn()

const mockUseCheckout = jest.fn(() => ({
    step: STEPS.PAYMENT,
    STEPS,
    goToStep: mockGoToStep,
    goToNextStep: mockGoToNextStep
}))
jest.mock('@salesforce/retail-react-app/app/pages/checkout/util/checkout-context', () => ({
    useCheckout: (...args) => mockUseCheckout(...args)
}))

const defaultBasketReturn = {data: null, derivedData: {totalItems: 0}}
const mockUseCurrentBasket = jest.fn(() => defaultBasketReturn)
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: () => mockUseCurrentBasket()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({
    useToast: () => mockShowToast
}))

jest.mock('@salesforce/commerce-sdk-react', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...actual,
        useShopperBasketsV2Mutation: (method) => {
            const mocks = {
                addPaymentInstrumentToBasket: mockAddPaymentInstrument,
                updateBillingAddressForBasket: mockUpdateBillingAddress,
                removePaymentInstrumentFromBasket: mockRemovePaymentInstrument
            }
            return {mutateAsync: mocks[method] || jest.fn().mockResolvedValue({})}
        }
    }
})

jest.mock('@salesforce/retail-react-app/app/components/promo-code', () => ({
    usePromoCode: () => ({}),
    PromoCode: () => null
}))

jest.mock('@salesforce/retail-react-app/app/pages/checkout/partials/payment-form', () => {
    // eslint-disable-next-line react/prop-types
    function MockPaymentForm({onSubmit}) {
        return (
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    onSubmit({
                        holder: 'Test Holder',
                        number: '4111111111111111',
                        expiry: '12/28',
                        cardType: 'visa'
                    })
                }}
            >
                <button type="submit">Submit payment</button>
            </form>
        )
    }
    return {__esModule: true, default: MockPaymentForm}
})

jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address-selection',
    () => {
        /* eslint-disable react/prop-types -- form is react-hook-form instance in test mock */
        function MockShippingAddressSelection({form}) {
            return (
                <div>
                    <button
                        type="button"
                        onClick={() => {
                            form.setValue('address1', '123 Test St')
                            form.setValue('city', 'Test City')
                            form.setValue('countryCode', 'US')
                            form.setValue('firstName', 'Test')
                            form.setValue('lastName', 'User')
                            form.setValue('postalCode', '12345')
                            form.setValue('stateCode', 'CA')
                        }}
                    >
                        Fill billing address
                    </button>
                </div>
            )
        }
        /* eslint-enable react/prop-types */
        return {__esModule: true, default: MockShippingAddressSelection}
    }
)

jest.mock('@salesforce/retail-react-app/app/components/address-display', () => ({
    __esModule: true,
    default: ({address}) => (
        <div>
            {address?.address1}, {address?.city}, {address?.postalCode}
        </div>
    )
}))

const setUseCurrentBasketData = (basket) => {
    mockUseCurrentBasket.mockReturnValue({
        data: basket,
        derivedData: {totalItems: basket?.productItems?.length ?? 0}
    })
}

describe('Payment', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseCheckout.mockReturnValue({
            step: STEPS.PAYMENT,
            STEPS,
            goToStep: mockGoToStep,
            goToNextStep: mockGoToNextStep
        })
        mockUseCurrentBasket.mockReturnValue(defaultBasketReturn)
        mockAddPaymentInstrument.mockResolvedValue({})
        mockUpdateBillingAddress.mockResolvedValue({basketId: 'basket-1'})
        mockRemovePaymentInstrument.mockResolvedValue({})
    })

    describe('rendering', () => {
        test('renders Payment heading and Edit Payment Info when step is not PAYMENT', () => {
            mockUseCheckout.mockReturnValue({
                step: STEPS.REVIEW_ORDER,
                STEPS,
                goToStep: mockGoToStep,
                goToNextStep: mockGoToNextStep
            })

            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [{shipmentId: 'me', shippingMethod: {c_storePickupEnabled: false}}],
                billingAddress: {},
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'pi1',
                        paymentCard: {cardType: 'Visa', numberLastDigits: '1111'}
                    }
                ]
            })

            renderWithProviders(<Payment />)
            expect(screen.getByRole('heading', {name: 'Payment'})).toBeInTheDocument()
            expect(screen.getByRole('button', {name: 'Edit Payment Info'})).toBeInTheDocument()
        })

        test('renders PaymentForm when no payment instrument applied', () => {
            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {c_storePickupEnabled: false},
                        shippingAddress: {
                            address1: '123 Main St',
                            city: 'Tampa',
                            countryCode: 'US',
                            firstName: 'Test',
                            lastName: 'User',
                            postalCode: '33712',
                            stateCode: 'FL'
                        }
                    }
                ],
                billingAddress: null,
                paymentInstruments: []
            })

            renderWithProviders(<Payment />)
            expect(screen.getByRole('button', {name: 'Review Order'})).toBeInTheDocument()
        })

        test('renders Credit Card summary and Remove button when payment instrument applied', () => {
            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {c_storePickupEnabled: false},
                        shippingAddress: {address1: '123 Main St', city: 'Tampa', countryCode: 'US'}
                    }
                ],
                billingAddress: {address1: '123 Main St', city: 'Tampa', countryCode: 'US'},
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'pi1',
                        paymentCard: {
                            cardType: 'Visa',
                            numberLastDigits: '1111',
                            expirationMonth: 12,
                            expirationYear: 2028
                        }
                    }
                ]
            })

            renderWithProviders(<Payment />)
            expect(screen.getByText('Credit Card')).toBeInTheDocument()
            expect(screen.getByText('Visa')).toBeInTheDocument()
            expect(screen.getByText(/1111/)).toBeInTheDocument()
            expect(screen.getByRole('button', {name: 'Remove'})).toBeInTheDocument()
        })

        test('renders Billing Address section', () => {
            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [{shipmentId: 'me', shippingMethod: {c_storePickupEnabled: false}}],
                billingAddress: null,
                paymentInstruments: []
            })

            renderWithProviders(<Payment />)
            expect(screen.getByText('Billing Address')).toBeInTheDocument()
        })

        test('renders Same as shipping address checkbox when not pickup only', () => {
            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {c_storePickupEnabled: false},
                        shippingAddress: {address1: '123 Main St', city: 'Tampa', countryCode: 'US'}
                    }
                ],
                billingAddress: null,
                paymentInstruments: []
            })

            renderWithProviders(<Payment />)
            expect(screen.getByText('Same as shipping address')).toBeInTheDocument()
        })

        test('does not render Same as shipping address checkbox when pickup only', () => {
            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {c_storePickupEnabled: true},
                        shippingAddress: null
                    }
                ],
                billingAddress: null,
                paymentInstruments: []
            })

            renderWithProviders(<Payment />)
            expect(screen.queryByText('Same as shipping address')).not.toBeInTheDocument()
        })

        test('renders Review Order button when editing', () => {
            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [{shipmentId: 'me', shippingMethod: {c_storePickupEnabled: false}}],
                billingAddress: null,
                paymentInstruments: []
            })

            renderWithProviders(<Payment />)
            expect(screen.getByRole('button', {name: 'Review Order'})).toBeInTheDocument()
        })

        test('renders shipping address when billing same as shipping', () => {
            const shippingAddress = {
                address1: '123 Main St',
                city: 'Tampa',
                countryCode: 'US',
                firstName: 'Test',
                lastName: 'User',
                postalCode: '33712',
                stateCode: 'FL'
            }
            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {c_storePickupEnabled: false},
                        shippingAddress
                    }
                ],
                billingAddress: null,
                paymentInstruments: []
            })

            renderWithProviders(<Payment />)
            expect(screen.getByText(/123 Main St/)).toBeInTheDocument()
            expect(screen.getByText(/Tampa/)).toBeInTheDocument()
        })
    })

    describe('Edit Payment Info', () => {
        test('calls goToStep with STEPS.PAYMENT when Edit Payment Info is clicked', async () => {
            mockUseCheckout.mockReturnValue({
                step: STEPS.REVIEW_ORDER,
                STEPS,
                goToStep: mockGoToStep,
                goToNextStep: mockGoToNextStep
            })

            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [{shipmentId: 'me', shippingMethod: {c_storePickupEnabled: false}}],
                billingAddress: {},
                paymentInstruments: [{paymentInstrumentId: 'pi1', paymentCard: {}}]
            })

            const {user} = renderWithProviders(<Payment />)
            await user.click(screen.getByRole('button', {name: 'Edit Payment Info'}))

            expect(mockGoToStep).toHaveBeenCalledWith(STEPS.PAYMENT)
        })
    })

    describe('payment submission', () => {
        test('calls addPaymentInstrumentToBasket when submitting payment form and no applied payment', async () => {
            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {c_storePickupEnabled: false},
                        shippingAddress: {
                            address1: '123 Main St',
                            city: 'Tampa',
                            countryCode: 'US',
                            firstName: 'Test',
                            lastName: 'User',
                            postalCode: '33712',
                            stateCode: 'FL'
                        }
                    }
                ],
                billingAddress: {
                    address1: '123 Main St',
                    city: 'Tampa',
                    countryCode: 'US',
                    firstName: 'Test',
                    lastName: 'User',
                    postalCode: '33712',
                    stateCode: 'FL'
                },
                paymentInstruments: []
            })

            const {user} = renderWithProviders(<Payment />)
            await user.click(screen.getByRole('button', {name: 'Submit payment'}))

            await waitFor(() => {
                expect(mockAddPaymentInstrument).toHaveBeenCalledWith({
                    parameters: {basketId: 'basket-1'},
                    body: expect.objectContaining({
                        paymentMethodId: 'CREDIT_CARD',
                        paymentCard: expect.objectContaining({
                            holder: 'Test Holder',
                            cardType: 'Visa',
                            expirationMonth: 12,
                            expirationYear: 2028
                        })
                    })
                })
            })
        })
    })

    describe('Review Order', () => {
        test('calls goToNextStep when Review Order clicked and billing form valid', async () => {
            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {c_storePickupEnabled: false},
                        shippingAddress: {
                            address1: '123 Main St',
                            city: 'Tampa',
                            countryCode: 'US',
                            firstName: 'Test',
                            lastName: 'User',
                            postalCode: '33712',
                            stateCode: 'FL'
                        }
                    }
                ],
                billingAddress: {
                    address1: '123 Main St',
                    city: 'Tampa',
                    countryCode: 'US',
                    firstName: 'Test',
                    lastName: 'User',
                    postalCode: '33712',
                    stateCode: 'FL'
                },
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'pi1',
                        paymentCard: {
                            cardType: 'Visa',
                            numberLastDigits: '1111',
                            expirationMonth: 12,
                            expirationYear: 2028
                        }
                    }
                ]
            })

            const {user} = renderWithProviders(<Payment />)
            await user.click(screen.getByRole('button', {name: 'Review Order'}))

            await waitFor(() => {
                expect(mockUpdateBillingAddress).toHaveBeenCalled()
                expect(mockGoToNextStep).toHaveBeenCalled()
            })
        })
    })

    describe('Remove payment', () => {
        test('calls removePaymentInstrumentFromBasket when Remove is clicked', async () => {
            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [{shipmentId: 'me', shippingMethod: {c_storePickupEnabled: false}}],
                billingAddress: {},
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'pi1',
                        paymentCard: {
                            cardType: 'Visa',
                            numberLastDigits: '1111',
                            expirationMonth: 12,
                            expirationYear: 2028
                        }
                    }
                ]
            })

            const {user} = renderWithProviders(<Payment />)
            await user.click(screen.getByRole('button', {name: 'Remove'}))

            await waitFor(() => {
                expect(mockRemovePaymentInstrument).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'basket-1',
                        paymentInstrumentId: 'pi1'
                    }
                })
            })
        })

        test('calls showToast on error when remove payment fails', async () => {
            mockRemovePaymentInstrument.mockRejectedValueOnce(new Error('Network error'))

            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [{shipmentId: 'me', shippingMethod: {c_storePickupEnabled: false}}],
                billingAddress: {},
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'pi1',
                        paymentCard: {
                            cardType: 'Visa',
                            numberLastDigits: '1111',
                            expirationMonth: 12,
                            expirationYear: 2028
                        }
                    }
                ]
            })

            const {user} = renderWithProviders(<Payment />)
            await user.click(screen.getByRole('button', {name: 'Remove'}))

            await waitFor(() => {
                expect(mockShowToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status: 'error',
                        title: expect.any(String)
                    })
                )
            })
        })
    })

    describe('billing same as shipping', () => {
        test('uses shipping address for billing when checkbox checked', async () => {
            const shippingAddress = {
                address1: '123 Main St',
                city: 'Tampa',
                countryCode: 'US',
                firstName: 'Test',
                lastName: 'User',
                postalCode: '33712',
                stateCode: 'FL'
            }
            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {c_storePickupEnabled: false},
                        shippingAddress
                    }
                ],
                billingAddress: null,
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'pi1',
                        paymentCard: {
                            cardType: 'Visa',
                            numberLastDigits: '1111',
                            expirationMonth: 12,
                            expirationYear: 2028
                        }
                    }
                ]
            })

            const {user} = renderWithProviders(<Payment />)
            await user.click(screen.getByRole('button', {name: 'Review Order'}))

            await waitFor(() => {
                expect(mockUpdateBillingAddress).toHaveBeenCalledWith({
                    parameters: {basketId: 'basket-1'},
                    body: expect.objectContaining({
                        address1: '123 Main St',
                        city: 'Tampa',
                        countryCode: 'US',
                        postalCode: '33712',
                        stateCode: 'FL'
                    })
                })
            })
        })
    })

    describe('PaymentCardSummary', () => {
        test('displays card type, masked number and expiration', () => {
            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [{shipmentId: 'me', shippingMethod: {c_storePickupEnabled: false}}],
                billingAddress: {},
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'pi1',
                        paymentCard: {
                            cardType: 'Master Card',
                            numberLastDigits: '9999',
                            expirationMonth: 1,
                            expirationYear: 2026
                        }
                    }
                ]
            })

            renderWithProviders(<Payment />)
            expect(screen.getByText('Master Card')).toBeInTheDocument()
            expect(screen.getByText(/9999/)).toBeInTheDocument()
            expect(screen.getByText('1/2026')).toBeInTheDocument()
        })
    })

    describe('empty basket', () => {
        test('renders without crashing when basket is null', () => {
            setUseCurrentBasketData(null)
            expect(() => renderWithProviders(<Payment />)).not.toThrow()
        })

        test('renders without crashing when basket has no shipments', () => {
            setUseCurrentBasketData({
                basketId: 'basket-1',
                shipments: [],
                billingAddress: null,
                paymentInstruments: []
            })
            expect(() => renderWithProviders(<Payment />)).not.toThrow()
        })
    })
})
