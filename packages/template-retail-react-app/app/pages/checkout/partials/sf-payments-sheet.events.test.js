/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {waitFor, act} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import SFPaymentsSheet from '@salesforce/retail-react-app/app/pages/checkout/partials/sf-payments-sheet'
import {CheckoutProvider} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import mockBasket from '@salesforce/retail-react-app/app/mocks/basket-with-suit'
import {rest} from 'msw'

const mockAddPaymentInstrument = jest.fn()
const mockUpdatePaymentInstrument = jest.fn()
const mockUpdateBillingAddress = jest.fn()
const mockRemovePaymentInstrument = jest.fn()
const mockOnCreateOrder = jest.fn()
const mockOnError = jest.fn()

jest.mock('@salesforce/commerce-sdk-react', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...actual,
        useShopperBasketsV2Mutation: (mutationKey) => {
            if (mutationKey === 'addPaymentInstrumentToBasket') {
                return {mutateAsync: mockAddPaymentInstrument}
            }
            if (mutationKey === 'updateBillingAddressForBasket') {
                return {mutateAsync: mockUpdateBillingAddress}
            }
            if (mutationKey === 'removePaymentInstrumentFromBasket') {
                return {mutateAsync: mockRemovePaymentInstrument}
            }
            return {mutateAsync: jest.fn()}
        },
        useShopperOrdersMutation: (mutationKey) => {
            if (mutationKey === 'updatePaymentInstrumentForOrder') {
                return {mutateAsync: mockUpdatePaymentInstrument}
            }
            if (mutationKey === 'failOrder') {
                return {mutateAsync: jest.fn()}
            }
            return {mutateAsync: jest.fn()}
        },
        usePaymentConfiguration: () => ({
            data: {
                paymentMethods: [
                    {
                        id: 'card',
                        name: 'Card',
                        paymentMethodType: 'card',
                        accountId: 'stripe-account-1'
                    },
                    {
                        id: 'paypal',
                        name: 'PayPal',
                        paymentMethodType: 'paypal',
                        accountId: 'paypal-account-1'
                    }
                ],
                paymentMethodSetAccounts: [
                    {
                        accountId: 'stripe-account-1',
                        vendor: 'Stripe',
                        paymentMethods: [{id: 'card'}]
                    },
                    {
                        accountId: 'paypal-account-1',
                        vendor: 'Paypal',
                        paymentMethods: [{id: 'paypal'}]
                    }
                ]
            }
        })
    }
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-shopper-configuration', () => ({
    useShopperConfiguration: (configId) => {
        if (configId === 'zoneId') return 'default'
        return undefined
    }
}))

const mockCheckout = jest.fn(() => ({
    confirm: jest.fn(),
    destroy: jest.fn(),
    updateAmount: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-sf-payments', () => {
    const actual = jest.requireActual('@salesforce/retail-react-app/app/hooks/use-sf-payments')
    return {
        ...actual,
        useSFPayments: () => ({
            sfp: {
                checkout: mockCheckout
            },
            metadata: {key: 'value'},
            startConfirming: jest.fn(),
            endConfirming: jest.fn()
        }),
        useSFPaymentsEnabled: () => true,
        useAutomaticCapture: () => true,
        useFutureUsageOffSession: () => false
    }
})

const mockUseCurrentBasket = jest.fn(() => ({
    data: mockBasket,
    derivedData: {
        totalItems: 2,
        isMissingShippingAddress: false,
        isMissingShippingMethod: false,
        totalDeliveryShipments: 1,
        totalPickupShipments: 0
    },
    isLoading: false
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: () => mockUseCurrentBasket()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => ({
        data: {
            customerId: 'customer123',
            isRegistered: true,
            email: 'test@example.com'
        }
    })
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-currency', () => ({
    useCurrency: () => ({
        currency: 'USD'
    })
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-sf-payments-country', () => ({
    useSFPaymentsCountry: () => ({
        countryCode: 'US'
    })
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-navigation', () => ({
    __esModule: true,
    default: () => jest.fn()
}))

jest.mock('@tanstack/react-query', () => {
    const actual = jest.requireActual('@tanstack/react-query')
    return {
        ...actual,
        useQueryClient: () => ({
            invalidateQueries: jest.fn(),
            setQueryData: jest.fn()
        })
    }
})

jest.mock('@salesforce/retail-react-app/app/components/promo-code', () => ({
    PromoCode: () => <div data-testid="promo-code">Promo Code</div>,
    usePromoCode: () => ({
        removePromoCode: jest.fn()
    })
}))

jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address-selection',
    () => {
        return function ShippingAddressSelection() {
            return <div data-testid="shipping-address-selection">Shipping Address Selection</div>
        }
    }
)

jest.mock('@salesforce/retail-react-app/app/components/address-display', () => {
    const AddressDisplay = ({address}) => {
        return <div data-testid="address-display">{address?.fullName}</div>
    }
    AddressDisplay.propTypes = {
        address: () => null
    }
    return AddressDisplay
})

jest.mock('@salesforce/retail-react-app/app/components/toggle-card', () => {
    const ToggleCard = ({children, title, editing}) => (
        <div data-testid="toggle-card" data-editing={editing ? 'true' : 'false'}>
            <h2>{title}</h2>
            {children}
        </div>
    )
    ToggleCard.propTypes = {
        children: () => null,
        title: () => null,
        editing: () => null
    }
    const ToggleCardEdit = ({children}) => <div data-testid="toggle-card-edit">{children}</div>
    ToggleCardEdit.propTypes = {
        children: () => null
    }
    const ToggleCardSummary = ({children}) => (
        <div data-testid="toggle-card-summary">{children}</div>
    )
    ToggleCardSummary.propTypes = {
        children: () => null
    }
    return {
        ToggleCard,
        ToggleCardEdit,
        ToggleCardSummary
    }
})

const renderWithCheckoutContext = (ui, options) => {
    return renderWithProviders(<CheckoutProvider>{ui}</CheckoutProvider>, options)
}

const mockRef = {current: null}

const setupComponentAndGetPaymentElement = async () => {
    renderWithCheckoutContext(
        <SFPaymentsSheet ref={mockRef} onCreateOrder={mockOnCreateOrder} onError={mockOnError} />
    )

    await waitFor(
        () => {
            expect(mockCheckout).toHaveBeenCalled()
        },
        {timeout: 3000}
    )

    const checkoutCall = mockCheckout.mock.calls[0]
    return checkoutCall[4]
}

const firePaymentMethodSelectedEvent = async (
    paymentElement,
    selectedPaymentMethod = 'card',
    detail = {}
) => {
    await act(async () => {
        paymentElement.dispatchEvent(
            new CustomEvent('sfp:paymentmethodselected', {
                bubbles: true,
                composed: true,
                detail: {
                    selectedPaymentMethod,
                    ...detail
                }
            })
        )
    })
}

const firePaymentApproveEvent = async (paymentElement, detail = {}) => {
    await act(async () => {
        paymentElement.dispatchEvent(
            new CustomEvent('sfp:paymentapprove', {
                bubbles: true,
                composed: true,
                detail
            })
        )
    })
}

describe('SFPaymentsSheet - SDK Event Handler Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockRef.current = null
        mockCheckout.mockClear()

        mockBasket.shipments = [
            {
                _type: 'shipment',
                shipment_id: 'me',
                shipping_method: {
                    id: 'DefaultShippingMethod',
                    name: 'Default Shipping Method'
                },
                shippingAddress: {
                    fullName: 'John Doe',
                    address1: '123 Main St',
                    city: 'New York',
                    stateCode: 'NY',
                    postalCode: '10001',
                    countryCode: 'US',
                    phone: '555-1234'
                }
            }
        ]
        mockBasket.billingAddress = {
            fullName: 'Jane Doe',
            address1: '456 Oak Ave',
            city: 'Boston',
            stateCode: 'MA',
            postalCode: '02101',
            countryCode: 'US',
            phone: '555-5678'
        }
        // Ensure no payment instruments initially so CheckoutProvider sets step to PAYMENT
        mockBasket.paymentInstruments = undefined

        mockUseCurrentBasket.mockImplementation(() => ({
            data: mockBasket,
            derivedData: {
                totalItems: 2,
                isMissingShippingAddress: false,
                isMissingShippingMethod: false,
                totalDeliveryShipments: 1,
                totalPickupShipments: 0
            },
            isLoading: false
        }))

        mockUpdateBillingAddress.mockResolvedValue({
            ...mockBasket,
            billingAddress: mockBasket.billingAddress
        })

        mockAddPaymentInstrument.mockResolvedValue({
            ...mockBasket,
            paymentInstruments: [
                {
                    paymentInstrumentId: 'PI123',
                    paymentMethodId: 'Salesforce Payments',
                    paymentReference: {
                        paymentReferenceId: 'ref123'
                    }
                }
            ]
        })

        const mockOrder = {
            orderNo: 'ORDER123',
            orderTotal: 629.98,
            customerInfo: {email: 'test@example.com'},
            billingAddress: mockBasket.billingAddress,
            shipments: mockBasket.shipments,
            paymentInstruments: [
                {
                    paymentInstrumentId: 'PI123',
                    paymentMethodId: 'Salesforce Payments',
                    paymentReference: {
                        clientSecret: 'secret123',
                        paymentReferenceId: 'ref123'
                    }
                }
            ]
        }

        mockOnCreateOrder.mockResolvedValue(mockOrder)
        mockUpdatePaymentInstrument.mockResolvedValue(mockOrder)

        global.server.use(
            rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.status(200),
                    ctx.json({
                        data: [],
                        total: 0
                    })
                )
            }),
            rest.post('*/customers/:customerId/product-lists', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.status(200),
                    ctx.json({
                        id: 'list123',
                        name: 'Saved Payment Methods'
                    })
                )
            })
        )
    })

    test('handlePaymentButtonApprove includes setupFutureUsage when savePaymentMethodForFutureUse is true', async () => {
        const paymentElement = await setupComponentAndGetPaymentElement()

        await firePaymentMethodSelectedEvent(paymentElement, 'card', {
            savePaymentMethodForFutureUse: true
        })
        await firePaymentApproveEvent(paymentElement, {savePaymentMethodForFutureUse: true})

        await waitFor(
            () => {
                expect(mockUpdatePaymentInstrument).toHaveBeenCalled()
            },
            {timeout: 3000}
        )

        const updateCall = mockUpdatePaymentInstrument.mock.calls[0]
        const requestBody = updateCall[0].body

        expect(requestBody.paymentReferenceRequest.gateway).toBe('stripe')
        expect(requestBody.paymentReferenceRequest.gatewayProperties.stripe.setupFutureUsage).toBe(
            'on_session'
        )
    })

    test('handlePaymentButtonApprove does not include setupFutureUsage when savePaymentMethodForFutureUse is false', async () => {
        const paymentElement = await setupComponentAndGetPaymentElement()

        await firePaymentMethodSelectedEvent(paymentElement, 'card', {
            savePaymentMethodForFutureUse: false
        })
        await firePaymentApproveEvent(paymentElement, {savePaymentMethodForFutureUse: false})

        await waitFor(
            () => {
                expect(mockUpdatePaymentInstrument).toHaveBeenCalled()
            },
            {timeout: 3000}
        )

        const updateCall = mockUpdatePaymentInstrument.mock.calls[0]
        const requestBody = updateCall[0].body

        expect(requestBody.paymentReferenceRequest.gateway).toBeUndefined()
        expect(requestBody.paymentReferenceRequest.gatewayProperties).toBeUndefined()
    })

    test('handlePaymentButtonApprove includes required fields for PaymentsCustomer record creation', async () => {
        const paymentElement = await setupComponentAndGetPaymentElement()

        await firePaymentMethodSelectedEvent(paymentElement, 'card', {
            savePaymentMethodForFutureUse: true
        })
        await firePaymentApproveEvent(paymentElement, {savePaymentMethodForFutureUse: true})

        await waitFor(
            () => {
                expect(mockUpdatePaymentInstrument).toHaveBeenCalled()
            },
            {timeout: 3000}
        )

        const updateCall = mockUpdatePaymentInstrument.mock.calls[0]
        const requestParams = updateCall[0].parameters
        const requestBody = updateCall[0].body

        expect(requestParams.orderNo).toBe('ORDER123')
        expect(requestParams.paymentInstrumentId).toBe('PI123')
        expect(requestBody.paymentReferenceRequest.gateway).toBe('stripe')
        expect(requestBody.paymentReferenceRequest.gatewayProperties.stripe).toEqual({
            setupFutureUsage: 'on_session'
        })
        expect(requestBody.paymentReferenceRequest.paymentMethodType).toBe('card')
    })

    describe('handlePaymentButtonCancel', () => {
        test('removes payment instruments and calls onError when basket exists', async () => {
            const basketWithInstrument = {
                ...mockBasket,
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'PI123',
                        paymentMethodId: 'Salesforce Payments',
                        paymentReference: {
                            paymentReferenceId: 'ref123'
                        }
                    }
                ]
            }

            mockUpdateBillingAddress.mockResolvedValue(basketWithInstrument)
            mockAddPaymentInstrument.mockResolvedValue(basketWithInstrument)

            const paymentElement = await setupComponentAndGetPaymentElement()
            const checkoutCall = mockCheckout.mock.calls[0]
            const config = checkoutCall[2]

            await firePaymentMethodSelectedEvent(paymentElement, 'paypal', {
                requiresPayButton: false
            })

            await config.actions.createIntent()

            await act(async () => {
                paymentElement.dispatchEvent(
                    new CustomEvent('sfp:paymentcancel', {
                        bubbles: true,
                        composed: true
                    })
                )
            })

            await waitFor(
                () => {
                    expect(mockRemovePaymentInstrument).toHaveBeenCalled()
                    expect(mockOnError).toHaveBeenCalled()
                },
                {timeout: 3000}
            )
        })

        test('does nothing when no basket to cleanup', async () => {
            const paymentElement = await setupComponentAndGetPaymentElement()

            await act(async () => {
                paymentElement.dispatchEvent(
                    new CustomEvent('sfp:paymentcancel', {
                        bubbles: true,
                        composed: true
                    })
                )
            })

            await new Promise((resolve) => setTimeout(resolve, 500))
            expect(mockRemovePaymentInstrument).not.toHaveBeenCalled()
        })
    })

    describe('handlePaymentButtonApprove error handling', () => {
        test('calls onError when createAndUpdateOrder fails', async () => {
            mockOnCreateOrder.mockRejectedValue(new Error('Order creation failed'))

            const paymentElement = await setupComponentAndGetPaymentElement()

            await firePaymentApproveEvent(paymentElement, {savePaymentMethodForFutureUse: true})

            await waitFor(
                () => {
                    expect(mockOnError).toHaveBeenCalled()
                },
                {timeout: 3000}
            )
        })
    })

    describe('handlePaymentMethodSelected', () => {
        test('calls onRequiresPayButtonChange when requiresPayButton is provided', async () => {
            const mockOnRequiresPayButtonChange = jest.fn()

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={mockRef}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                    onRequiresPayButtonChange={mockOnRequiresPayButtonChange}
                />
            )

            await waitFor(
                () => {
                    expect(mockCheckout).toHaveBeenCalled()
                },
                {timeout: 3000}
            )

            const checkoutCall = mockCheckout.mock.calls[0]
            const paymentElement = checkoutCall[4]

            await firePaymentMethodSelectedEvent(paymentElement, 'card', {requiresPayButton: true})

            await waitFor(() => {
                expect(mockOnRequiresPayButtonChange).toHaveBeenCalledWith(true)
            })
        })
    })
})
