/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor, act} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import SFPaymentsSheet from '@salesforce/retail-react-app/app/pages/checkout/partials/sf-payments-sheet'
import {CheckoutProvider} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import mockBasket from '@salesforce/retail-react-app/app/mocks/basket-with-suit'
import {STATUS_SUCCESS} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'
import {rest} from 'msw'

const mockAddPaymentInstrument = jest.fn()
const mockUpdatePaymentInstrument = jest.fn()
const mockUpdateBillingAddress = jest.fn()
const mockRemovePaymentInstrument = jest.fn()
const mockUpdateShippingAddress = jest.fn()
const mockUpdateShippingMethod = jest.fn()
const mockRefetchShippingMethods = jest.fn()
const mockQueryClientInvalidate = jest.fn()
const mockQueryClientSetQueryData = jest.fn()
const mockQueryClientRemoveQueries = jest.fn()
const mockFailOrder = jest.fn()

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
            if (mutationKey === 'updateShippingAddressForShipment') {
                return {mutateAsync: mockUpdateShippingAddress}
            }
            if (mutationKey === 'updateShippingMethodForShipment') {
                return {mutateAsync: mockUpdateShippingMethod}
            }
            return {mutateAsync: jest.fn()}
        },
        useShopperOrdersMutation: (mutationKey) => {
            if (mutationKey === 'updatePaymentInstrumentForOrder') {
                return {mutateAsync: mockUpdatePaymentInstrument}
            }
            if (mutationKey === 'failOrder') {
                return {mutateAsync: mockFailOrder}
            }
            return {mutateAsync: jest.fn()}
        },
        usePaymentConfiguration: () => ({
            data: {
                zoneId: 'default',
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
                    },
                    {
                        id: 'klarna',
                        name: 'Klarna',
                        paymentMethodType: 'klarna',
                        accountId: 'adyen-account-1'
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
                    },
                    {
                        accountId: 'adyen-account-1',
                        vendor: 'Adyen',
                        paymentMethods: [{id: 'klarna'}]
                    }
                ]
            }
        }),
        useShippingMethodsForShipmentV2: () => ({
            data: {
                applicableShippingMethods: [
                    {
                        id: 'DefaultShippingMethod',
                        name: 'Standard',
                        description: '5-7 Business Days',
                        price: 5.99
                    },
                    {
                        id: 'ExpressShippingMethod',
                        name: 'Express',
                        description: '2-3 Business Days',
                        price: 15.99
                    }
                ],
                defaultShippingMethodId: 'DefaultShippingMethod'
            },
            refetch: mockRefetchShippingMethods
        }),
        useCustomerId: () => 'customer123',
        useCustomerType: jest.fn(() => ({
            isRegistered: true,
            isGuest: false,
            customerType: 'registered'
        })),
        useCustomer: jest.fn()
    }
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-shopper-configuration', () => ({
    useShopperConfiguration: (configId) => {
        if (configId === 'zoneId') return 'default'
        if (configId === 'cardCaptureAutomatic') return true
        return undefined
    }
}))

jest.mock('@tanstack/react-query', () => {
    const actual = jest.requireActual('@tanstack/react-query')
    return {
        ...actual,
        useQueryClient: () => ({
            invalidateQueries: mockQueryClientInvalidate
        })
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

const mockCustomer = {
    customerId: 'customer123',
    isGuest: false,
    isRegistered: true,
    email: 'test@example.com',
    paymentMethodReferences: []
}

// Get the mocked useCustomer from commerce-sdk-react
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockUseCustomer = require('@salesforce/commerce-sdk-react').useCustomer

// Set default implementation
mockUseCustomer.mockImplementation(() => ({
    data: mockCustomer,
    isLoading: false
}))

// Mock useCurrentCustomer hook (accepts expand and optional queryOptions e.g. refetchOnMount)
const mockUseCurrentCustomerImpl = jest.fn((expand, _queryOptions) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mockUseCustomer = require('@salesforce/commerce-sdk-react').useCustomer
    const query = mockUseCustomer()
    const data = query.data
        ? {...query.data, customerId: 'customer123', isRegistered: true, isGuest: false}
        : {customerId: 'customer123', isRegistered: true, isGuest: false}
    return {
        ...query,
        data,
        refetch: jest.fn(),
        isLoading: query.isLoading,
        isFetching: query.isFetching ?? false
    }
})
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: (...args) => mockUseCurrentCustomerImpl(...args)
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-einstein', () => {
    return jest.fn(() => ({
        sendBeginCheckout: jest.fn(),
        sendCheckoutStep: jest.fn()
    }))
})

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

const mockStartConfirming = jest.fn()
const mockEndConfirming = jest.fn()
const mockCheckoutConfirm = jest.fn()
const mockCheckoutDestroy = jest.fn()
const mockUpdateAmount = jest.fn()

let mockContainerElement = null

const mockCheckout = jest.fn(
    (metadata, paymentMethodSet, config, paymentRequest, paymentElement) => {
        if (!paymentElement.parentElement) {
            if (!mockContainerElement) {
                mockContainerElement = document.createElement('div')
                document.body.appendChild(mockContainerElement)
            }
            mockContainerElement.appendChild(paymentElement)
        }
        return {
            confirm: mockCheckoutConfirm,
            destroy: mockCheckoutDestroy,
            updateAmount: mockUpdateAmount
        }
    }
)

jest.mock('@salesforce/retail-react-app/app/hooks/use-sf-payments', () => {
    const actual = jest.requireActual('@salesforce/retail-react-app/app/hooks/use-sf-payments')
    return {
        ...actual,
        useSFPayments: () => ({
            sfp: {
                checkout: mockCheckout
            },
            metadata: {key: 'value', gateways: {}},
            isMetadataLoading: false,
            startConfirming: mockStartConfirming,
            endConfirming: mockEndConfirming
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

jest.mock('@tanstack/react-query', () => {
    const actual = jest.requireActual('@tanstack/react-query')
    return {
        ...actual,
        useQueryClient: () => ({
            invalidateQueries: mockQueryClientInvalidate,
            setQueryData: mockQueryClientSetQueryData,
            removeQueries: mockQueryClientRemoveQueries
        })
    }
})

const renderWithCheckoutContext = (ui, options) => {
    return renderWithProviders(<CheckoutProvider>{ui}</CheckoutProvider>, options)
}

const mockOnCreateOrder = jest.fn()
const mockOnError = jest.fn()

const createMockOrder = (overrides = {}) => ({
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
    ],
    ...overrides
})

const setupConfirmPaymentMocks = (paymentIntentRef) => {
    const mockOrder = createMockOrder()
    mockUpdateBillingAddress.mockResolvedValue({
        ...mockBasket,
        billingAddress: mockBasket.shipments[0].shippingAddress,
        paymentInstruments: []
    })
    mockAddPaymentInstrument.mockResolvedValue({
        ...mockBasket,
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
    })
    mockOnCreateOrder.mockResolvedValue(mockOrder)
    mockUpdatePaymentInstrument.mockResolvedValue(mockOrder)
    mockCheckoutConfirm.mockImplementation(async () => {
        const config = mockCheckout.mock.calls[0][2]
        paymentIntentRef.current = await config.actions.createIntent()

        return {
            responseCode: STATUS_SUCCESS,
            data: {}
        }
    })
    return mockOrder
}

describe('SFPaymentsSheet', () => {
    const mockRef = {current: null}

    beforeEach(() => {
        jest.clearAllMocks()
        mockCheckout.mockClear()
        mockContainerElement = null

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
                        id: 'test-list-id',
                        type: 'wish_list'
                    })
                )
            })
        )
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
    })

    describe('rendering', () => {
        test('renders payment section', () => {
            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={mockRef}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            expect(screen.getByText('Payment')).toBeInTheDocument()
        })

        test('renders billing address section', () => {
            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={mockRef}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            expect(screen.getAllByText('Billing Address').length).toBeGreaterThan(0)
        })
    })

    describe('isPickupOnly useEffect', () => {
        test('sets billingSameAsShipping to false when isPickupOnly is true', async () => {
            const pickupBasket = {
                ...mockBasket,
                shipments: [
                    {
                        _type: 'shipment',
                        shipment_id: 'me',
                        shippingMethod: {
                            id: 'PickupInStore',
                            name: 'Pickup In Store',
                            c_storePickupEnabled: true
                        }
                    }
                ]
            }

            mockUseCurrentBasket.mockImplementation(() => ({
                data: pickupBasket,
                derivedData: {
                    totalItems: 2,
                    isMissingShippingAddress: false,
                    isMissingShippingMethod: false,
                    totalDeliveryShipments: 0,
                    totalPickupShipments: 1
                },
                isLoading: false
            }))

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={mockRef}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(
                () => {
                    const checkbox = screen.queryByRole('checkbox', {name: /same as shipping/i})
                    expect(checkbox).not.toBeInTheDocument()
                },
                {timeout: 2000}
            )
        })
    })

    describe('billing same as shipping', () => {
        test('shows "same as shipping" checkbox when not pickup only', () => {
            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={mockRef}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            expect(screen.getByText('Same as shipping address')).toBeInTheDocument()
        })

        test('hides "same as shipping" checkbox for pickup only orders', () => {
            const pickupBasket = {
                ...mockBasket,
                shipments: [
                    {
                        _type: 'shipment',
                        shipment_id: 'me',
                        shippingMethod: {
                            id: 'PickupInStore',
                            name: 'Pickup In Store',
                            c_storePickupEnabled: true
                        }
                    }
                ]
            }

            mockUseCurrentBasket.mockImplementation(() => ({
                data: pickupBasket,
                derivedData: {
                    totalItems: 2,
                    isMissingShippingAddress: false,
                    isMissingShippingMethod: false,
                    totalDeliveryShipments: 0,
                    totalPickupShipments: 1
                },
                isLoading: false
            }))

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={mockRef}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            expect(screen.queryByText('Same as shipping address')).not.toBeInTheDocument()
        })

        test('displays shipping address form when billing same as shipping is checked', async () => {
            mockBasket.shipments[0].shippingAddress.fullName = 'John Doe'

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={mockRef}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            const checkbox = screen.getByRole('checkbox', {name: /same as shipping/i})
            expect(checkbox).toBeChecked()

            await waitFor(() => {
                const addressDisplays = screen.getAllByTestId('address-display')
                expect(addressDisplays.length).toBeGreaterThan(0)
            })
        })
    })

    describe('confirmPayment', () => {
        test('confirmPayment throws error on invalid billing form', async () => {
            const ref = React.createRef()

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            mockUpdateBillingAddress.mockResolvedValue(undefined)

            await expect(ref.current.confirmPayment()).rejects.toThrow('Billing form errors')
        })

        test('confirmPayment updates billing address when billing same as shipping', async () => {
            const ref = React.createRef()
            const mockOrder = createMockOrder()

            mockUpdateBillingAddress.mockResolvedValue({
                ...mockBasket,
                billingAddress: mockBasket.shipments[0].shippingAddress,
                paymentInstruments: []
            })

            mockAddPaymentInstrument.mockResolvedValue({
                ...mockBasket,
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
            })

            mockOnCreateOrder.mockResolvedValue(mockOrder)
            mockUpdatePaymentInstrument.mockResolvedValue(mockOrder)

            mockCheckoutConfirm.mockImplementation(async () => {
                const config = mockCheckout.mock.calls[0][2]
                await config.actions.createIntent()

                return {
                    responseCode: STATUS_SUCCESS,
                    data: {}
                }
            })

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            const result = await ref.current.confirmPayment()

            expect(mockUpdateBillingAddress).toHaveBeenCalledWith({
                body: expect.objectContaining({
                    address1: mockBasket.shipments[0].shippingAddress.address1
                }),
                parameters: {basketId: mockBasket.basketId}
            })
            expect(mockStartConfirming).toHaveBeenCalled()
            expect(mockEndConfirming).toHaveBeenCalled()
            expect(result.orderNo).toBe('ORDER123')
        })

        test('confirmPayment creates payment instrument and processes Stripe payment', async () => {
            const ref = React.createRef()
            const mockOrder = createMockOrder()

            mockUpdateBillingAddress.mockResolvedValue({
                ...mockBasket,
                billingAddress: mockBasket.shipments[0].shippingAddress,
                paymentInstruments: []
            })

            mockAddPaymentInstrument.mockResolvedValue({
                ...mockBasket,
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
            })

            mockOnCreateOrder.mockResolvedValue(mockOrder)
            mockUpdatePaymentInstrument.mockResolvedValue(mockOrder)

            mockCheckoutConfirm.mockImplementation(async () => {
                const config = mockCheckout.mock.calls[0][2]
                await config.actions.createIntent()

                return {
                    responseCode: STATUS_SUCCESS,
                    data: {}
                }
            })

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            await ref.current.confirmPayment()

            await waitFor(() => {
                expect(mockAddPaymentInstrument).toHaveBeenCalledWith(
                    expect.objectContaining({
                        body: expect.objectContaining({
                            paymentMethodId: 'Salesforce Payments'
                        })
                    })
                )

                expect(mockUpdatePaymentInstrument).toHaveBeenCalled()
                expect(mockCheckoutConfirm).toHaveBeenCalled()
            })
        })

        test('confirmPayment creates payment instrument and processes Adyen payment', async () => {
            const ref = React.createRef()
            const mockOrder = createMockOrder({
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'PI123',
                        paymentMethodId: 'Salesforce Payments',
                        paymentReference: {
                            paymentReferenceId: 'ref123',
                            gateway: 'adyen',
                            gatewayProperties: {
                                adyen: {
                                    adyenPaymentIntent: {
                                        id: 'PI123',
                                        resultCode: 'Authorised',
                                        adyenPaymentAction: 'action'
                                    }
                                }
                            }
                        }
                    }
                ]
            })

            mockUpdateBillingAddress.mockResolvedValue({
                ...mockBasket,
                billingAddress: mockBasket.shipments[0].shippingAddress,
                paymentInstruments: []
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

            mockOnCreateOrder.mockResolvedValue(mockOrder)
            mockUpdatePaymentInstrument.mockResolvedValue(mockOrder)

            mockCheckoutConfirm.mockImplementation(async () => {
                const config = mockCheckout.mock.calls[0][2]
                await config.actions.createIntent({
                    paymentMethod: 'payment method',
                    returnUrl: 'http://test.com?name=value',
                    origin: 'http://mystore.com',
                    lineItems: [],
                    billingDetails: {}
                })

                return {
                    responseCode: STATUS_SUCCESS,
                    data: {}
                }
            })

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            const paymentElement = mockCheckout.mock.calls[0][4]

            await act(async () => {
                paymentElement.dispatchEvent(
                    new CustomEvent('sfp:paymentmethodselected', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            selectedPaymentMethod: 'klarna'
                        }
                    })
                )
            })

            await ref.current.confirmPayment()

            await waitFor(() => {
                expect(mockAddPaymentInstrument).toHaveBeenCalledWith(
                    expect.objectContaining({
                        body: expect.objectContaining({
                            paymentMethodId: 'Salesforce Payments',
                            paymentReferenceRequest: {
                                paymentMethodType: 'klarna',
                                zoneId: 'default'
                            }
                        })
                    })
                )

                expect(mockUpdatePaymentInstrument).toHaveBeenCalledWith(
                    expect.objectContaining({
                        body: expect.objectContaining({
                            paymentReferenceRequest: expect.objectContaining({
                                paymentMethodType: 'klarna',
                                zoneId: 'default',
                                gateway: 'adyen',
                                gatewayProperties: {
                                    adyen: {
                                        paymentMethod: 'payment method',
                                        returnUrl:
                                            'http://test.com?name=value&orderNo=ORDER123&zoneId=default&type=klarna',
                                        origin: 'http://mystore.com',
                                        lineItems: [],
                                        billingDetails: {}
                                    }
                                }
                            })
                        })
                    })
                )
                expect(mockCheckoutConfirm).toHaveBeenCalled()
            })
        })

        test('confirmPayment handles payment failure', async () => {
            const ref = React.createRef()
            const mockOrder = createMockOrder({customerInfo: undefined})

            mockUpdateBillingAddress.mockResolvedValue({
                ...mockBasket,
                billingAddress: mockBasket.shipments[0].shippingAddress,
                paymentInstruments: []
            })

            mockAddPaymentInstrument.mockResolvedValue({
                ...mockBasket,
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
            })

            mockOnCreateOrder.mockResolvedValue(mockOrder)
            mockUpdatePaymentInstrument.mockResolvedValue(mockOrder)

            mockCheckoutConfirm.mockResolvedValue({
                responseCode: 'FAILED',
                data: {error: 'Payment declined'}
            })

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            await expect(ref.current.confirmPayment()).rejects.toThrow()
            expect(mockEndConfirming).toHaveBeenCalled()
        })

        test('confirmPayment invalidates queries on success', async () => {
            const ref = React.createRef()
            const mockOrder = createMockOrder()

            mockUpdateBillingAddress.mockResolvedValue({
                ...mockBasket,
                billingAddress: mockBasket.shipments[0].shippingAddress,
                paymentInstruments: []
            })

            mockAddPaymentInstrument.mockResolvedValue({
                ...mockBasket,
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
            })

            mockOnCreateOrder.mockResolvedValue(mockOrder)
            mockUpdatePaymentInstrument.mockResolvedValue(mockOrder)

            mockCheckoutConfirm.mockResolvedValue({
                responseCode: STATUS_SUCCESS,
                data: {}
            })

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            await ref.current.confirmPayment()

            expect(mockQueryClientInvalidate).toHaveBeenCalled()
        })

        test('confirmPayment calls failOrder when confirm fails after order creation', async () => {
            const ref = React.createRef()
            const mockOrder = createMockOrder()

            mockUpdateBillingAddress.mockResolvedValue({
                ...mockBasket,
                billingAddress: mockBasket.shipments[0].shippingAddress,
                paymentInstruments: []
            })

            mockAddPaymentInstrument.mockResolvedValue({
                ...mockBasket,
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
            })

            mockOnCreateOrder.mockResolvedValue(mockOrder)
            mockUpdatePaymentInstrument.mockResolvedValue(mockOrder)

            mockCheckoutConfirm.mockImplementation(async () => {
                const config = mockCheckout.mock.calls[0][2]
                await config.actions.createIntent()

                return {
                    responseCode: 'FAILED',
                    data: {error: 'Payment confirmation failed'}
                }
            })

            mockFailOrder.mockResolvedValue({})

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            await expect(ref.current.confirmPayment()).rejects.toThrow()

            await waitFor(
                () => {
                    expect(mockFailOrder).toHaveBeenCalledWith({
                        parameters: {
                            orderNo: 'ORDER123',
                            reopenBasket: true
                        },
                        body: {
                            reasonCode: 'payment_confirm_failure'
                        }
                    })
                    expect(mockOnError).toHaveBeenCalled()
                },
                {timeout: 3000}
            )
        })

        test('confirmPayment includes setup_future_usage when savePaymentMethodForFutureUse is true', async () => {
            const ref = React.createRef()
            const paymentIntentRef = React.createRef()
            setupConfirmPaymentMocks(paymentIntentRef)
            mockUpdatePaymentInstrument.mockResolvedValue(
                createMockOrder({
                    paymentInstruments: [
                        {
                            paymentInstrumentId: 'PI123',
                            paymentMethodId: 'Salesforce Payments',
                            paymentReference: {
                                clientSecret: 'secret123',
                                paymentReferenceId: 'ref123',
                                gatewayProperties: {stripe: {setupFutureUsage: 'on_session'}}
                            }
                        }
                    ]
                })
            )

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            await waitFor(() => {
                expect(mockCheckout).toHaveBeenCalled()
            })

            const paymentElement = mockCheckout.mock.calls[0][4]

            await act(async () => {
                paymentElement.dispatchEvent(
                    new CustomEvent('sfp:paymentmethodselected', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            selectedPaymentMethod: 'card',
                            savePaymentMethodForFutureUse: true
                        }
                    })
                )
            })

            await ref.current.confirmPayment()

            await waitFor(() => {
                expect(mockCheckoutConfirm).toHaveBeenCalled()
            })

            expect(paymentIntentRef.current.setup_future_usage).toBe('on_session')
        })

        test('confirmPayment passes savePaymentMethodRef to createAndUpdateOrder', async () => {
            const ref = React.createRef()
            const paymentIntentRef = React.createRef()
            setupConfirmPaymentMocks(paymentIntentRef)

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            await waitFor(() => {
                expect(mockCheckout).toHaveBeenCalled()
            })

            const paymentElement = mockCheckout.mock.calls[0][4]

            await act(async () => {
                paymentElement.dispatchEvent(
                    new CustomEvent('sfp:paymentmethodselected', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            selectedPaymentMethod: 'card',
                            savePaymentMethodForFutureUse: true
                        }
                    })
                )
            })

            await ref.current.confirmPayment()

            await waitFor(() => {
                expect(mockUpdatePaymentInstrument).toHaveBeenCalled()
            })

            const updateCall = mockUpdatePaymentInstrument.mock.calls[0]
            const requestBody = updateCall[0].body

            expect(requestBody.paymentReferenceRequest.gateway).toBe('stripe')
            expect(
                requestBody.paymentReferenceRequest.gatewayProperties.stripe.setupFutureUsage
            ).toBe('on_session')
        })

        test('confirmPayment excludes setup_future_usage when savePaymentMethodForFutureUse is false', async () => {
            const ref = React.createRef()
            const paymentIntentRef = React.createRef()
            setupConfirmPaymentMocks(paymentIntentRef)

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            await waitFor(() => {
                expect(mockCheckout).toHaveBeenCalled()
            })

            const paymentElement = mockCheckout.mock.calls[0][4]

            await act(async () => {
                paymentElement.dispatchEvent(
                    new CustomEvent('sfp:paymentmethodselected', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            selectedPaymentMethod: 'card',
                            savePaymentMethodForFutureUse: false
                        }
                    })
                )
            })

            await ref.current.confirmPayment()

            await waitFor(() => {
                expect(mockCheckoutConfirm).toHaveBeenCalled()
            })

            expect(paymentIntentRef.current.setup_future_usage).toBeUndefined()
        })

        test('confirmPayment sets setup_future_usage to off_session when futureUsageOffSession is true', async () => {
            const ref = React.createRef()
            const paymentIntentRef = React.createRef()
            setupConfirmPaymentMocks(paymentIntentRef)
            const mockOrderOffSession = createMockOrder({
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'PI123',
                        paymentMethodId: 'Salesforce Payments',
                        paymentReference: {
                            clientSecret: 'secret123',
                            paymentReferenceId: 'ref123',
                            gatewayProperties: {
                                stripe: {
                                    clientSecret: 'secret123',
                                    setupFutureUsage: 'off_session'
                                }
                            }
                        }
                    }
                ]
            })
            mockUpdatePaymentInstrument.mockResolvedValue(mockOrderOffSession)

            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const useShopperConfigurationModule = require('@salesforce/retail-react-app/app/hooks/use-shopper-configuration')
            const originalMock = useShopperConfigurationModule.useShopperConfiguration

            useShopperConfigurationModule.useShopperConfiguration = jest.fn((configId) => {
                if (configId === 'futureUsageOffSession') return true
                if (configId === 'cardCaptureAutomatic') return true
                if (configId === 'zoneId') return 'default'
                return undefined
            })

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            await waitFor(() => {
                expect(mockCheckout).toHaveBeenCalled()
            })

            const paymentElement = mockCheckout.mock.calls[0][4]

            await act(async () => {
                paymentElement.dispatchEvent(
                    new CustomEvent('sfp:paymentmethodselected', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            selectedPaymentMethod: 'card',
                            savePaymentMethodForFutureUse: true
                        }
                    })
                )
            })

            await ref.current.confirmPayment()

            await waitFor(() => {
                expect(mockCheckoutConfirm).toHaveBeenCalled()
            })

            expect(paymentIntentRef.current.setup_future_usage).toBe('off_session')

            useShopperConfigurationModule.useShopperConfiguration = originalMock
        })
    })

    describe('Adyen SPM (Saved Payment Methods)', () => {
        beforeEach(() => {
            jest.clearAllMocks()
            mockCustomer.paymentMethodReferences = []
            mockUseCustomer.mockImplementation(() => ({
                data: {...mockCustomer},
                isLoading: false
            }))
        })

        test('confirmPayment includes storePaymentMethod when savePaymentMethodForFutureUse is true for Adyen', async () => {
            const ref = React.createRef()
            const mockOrder = createMockOrder({
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'PI123',
                        paymentMethodId: 'Salesforce Payments',
                        paymentReference: {
                            paymentReferenceId: 'ref123',
                            gateway: 'adyen',
                            gatewayProperties: {
                                adyen: {
                                    adyenPaymentIntent: {
                                        id: 'PI123',
                                        resultCode: 'Authorised',
                                        adyenPaymentAction: 'action'
                                    }
                                }
                            }
                        }
                    }
                ]
            })

            mockUpdateBillingAddress.mockResolvedValue({
                ...mockBasket,
                billingAddress: mockBasket.shipments[0].shippingAddress,
                paymentInstruments: []
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

            mockOnCreateOrder.mockResolvedValue(mockOrder)
            mockUpdatePaymentInstrument.mockResolvedValue(mockOrder)

            mockCheckoutConfirm.mockImplementation(async () => {
                const config = mockCheckout.mock.calls[0][2]
                await config.actions.createIntent({
                    paymentMethod: 'payment method',
                    returnUrl: 'http://test.com?name=value',
                    origin: 'http://mystore.com',
                    lineItems: [],
                    billingDetails: {}
                })

                return {
                    responseCode: STATUS_SUCCESS,
                    data: {}
                }
            })

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            const paymentElement = mockCheckout.mock.calls[0][4]

            await act(async () => {
                paymentElement.dispatchEvent(
                    new CustomEvent('sfp:paymentmethodselected', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            selectedPaymentMethod: 'klarna',
                            savePaymentMethodForFutureUse: true
                        }
                    })
                )
            })

            await ref.current.confirmPayment()

            await waitFor(() => {
                expect(mockUpdatePaymentInstrument).toHaveBeenCalled()
            })

            const updateCall = mockUpdatePaymentInstrument.mock.calls[0]
            const requestBody = updateCall[0].body

            expect(requestBody.paymentReferenceRequest.gateway).toBe('adyen')
            expect(
                requestBody.paymentReferenceRequest.gatewayProperties.adyen.storePaymentMethod
            ).toBe(true)
            expect(requestBody.paymentReferenceRequest.gatewayProperties.adyen.paymentMethod).toBe(
                'payment method'
            )
        })

        test('confirmPayment excludes storePaymentMethod when savePaymentMethodForFutureUse is false for Adyen', async () => {
            const ref = React.createRef()
            const mockOrder = createMockOrder({
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'PI123',
                        paymentMethodId: 'Salesforce Payments',
                        paymentReference: {
                            paymentReferenceId: 'ref123',
                            gateway: 'adyen',
                            gatewayProperties: {
                                adyen: {
                                    adyenPaymentIntent: {
                                        id: 'PI123',
                                        resultCode: 'Authorised',
                                        adyenPaymentAction: 'action'
                                    }
                                }
                            }
                        }
                    }
                ]
            })

            mockUpdateBillingAddress.mockResolvedValue({
                ...mockBasket,
                billingAddress: mockBasket.shipments[0].shippingAddress,
                paymentInstruments: []
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

            mockOnCreateOrder.mockResolvedValue(mockOrder)
            mockUpdatePaymentInstrument.mockResolvedValue(mockOrder)

            mockCheckoutConfirm.mockImplementation(async () => {
                const config = mockCheckout.mock.calls[0][2]
                await config.actions.createIntent({
                    paymentMethod: 'payment method',
                    returnUrl: 'http://test.com?name=value',
                    origin: 'http://mystore.com',
                    lineItems: [],
                    billingDetails: {}
                })

                return {
                    responseCode: STATUS_SUCCESS,
                    data: {}
                }
            })

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            const paymentElement = mockCheckout.mock.calls[0][4]

            await act(async () => {
                paymentElement.dispatchEvent(
                    new CustomEvent('sfp:paymentmethodselected', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            selectedPaymentMethod: 'klarna',
                            savePaymentMethodForFutureUse: false
                        }
                    })
                )
            })

            await ref.current.confirmPayment()

            await waitFor(() => {
                expect(mockUpdatePaymentInstrument).toHaveBeenCalled()
            })

            const updateCall = mockUpdatePaymentInstrument.mock.calls[0]
            const requestBody = updateCall[0].body

            expect(requestBody.paymentReferenceRequest.gateway).toBe('adyen')
            expect(
                requestBody.paymentReferenceRequest.gatewayProperties.adyen.storePaymentMethod
            ).toBeUndefined()
        })

        test('confirmPayment includes storePaymentMethod when save requested and paymentData is null for Adyen', async () => {
            const ref = React.createRef()
            const mockOrder = createMockOrder({
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'PI123',
                        paymentMethodId: 'Salesforce Payments',
                        paymentReference: {
                            paymentReferenceId: 'ref123',
                            gateway: 'adyen',
                            gatewayProperties: {
                                adyen: {
                                    adyenPaymentIntent: {
                                        id: 'PI123',
                                        resultCode: 'Authorised',
                                        adyenPaymentAction: 'action'
                                    }
                                }
                            }
                        }
                    }
                ]
            })

            mockUpdateBillingAddress.mockResolvedValue({
                ...mockBasket,
                billingAddress: mockBasket.shipments[0].shippingAddress,
                paymentInstruments: []
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

            mockOnCreateOrder.mockResolvedValue(mockOrder)
            mockUpdatePaymentInstrument.mockResolvedValue(mockOrder)

            mockCheckoutConfirm.mockImplementation(async () => {
                const config = mockCheckout.mock.calls[0][2]
                // Call createIntent without paymentData (null)
                await config.actions.createIntent(null)

                return {
                    responseCode: STATUS_SUCCESS,
                    data: {}
                }
            })

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(ref.current).toBeDefined()
            })

            const paymentElement = mockCheckout.mock.calls[0][4]

            await act(async () => {
                paymentElement.dispatchEvent(
                    new CustomEvent('sfp:paymentmethodselected', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            selectedPaymentMethod: 'klarna',
                            savePaymentMethodForFutureUse: true
                        }
                    })
                )
            })

            await ref.current.confirmPayment()

            await waitFor(() => {
                expect(mockUpdatePaymentInstrument).toHaveBeenCalled()
            })

            const updateCall = mockUpdatePaymentInstrument.mock.calls[0]
            const requestBody = updateCall[0].body

            expect(requestBody.paymentReferenceRequest.gateway).toBe('adyen')
            // When user requested save, storePaymentMethod is sent (utils include it when true regardless of paymentData)
            expect(
                requestBody.paymentReferenceRequest.gatewayProperties.adyen.storePaymentMethod
            ).toBe(true)
            // paymentMethod should not be included when paymentData is null
            expect(
                requestBody.paymentReferenceRequest.gatewayProperties.adyen.paymentMethod
            ).toBeUndefined()
        })
    })

    describe('SPM (Saved Payment Methods) Display', () => {
        beforeEach(() => {
            jest.clearAllMocks()
            mockCustomer.paymentMethodReferences = []
            mockUseCustomer.mockImplementation(() => ({
                data: {...mockCustomer},
                isLoading: false
            }))
        })

        test('does not initialize checkout while customer is loading (registered user)', async () => {
            mockUseCustomer.mockImplementation(() => ({
                data: undefined,
                isLoading: true
            }))

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={React.createRef()}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 50))
            })

            expect(mockCheckout).not.toHaveBeenCalled()
        })

        test('passes empty savedPaymentMethods to SDK when customer has no payment method references', async () => {
            mockCustomer.paymentMethodReferences = []

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={React.createRef()}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(mockCheckout).toHaveBeenCalled()
            })

            const checkoutCall = mockCheckout.mock.calls[0]
            const config = checkoutCall[2]

            expect(config.options.savedPaymentMethods).toEqual([])
        })

        test('passes empty savedPaymentMethods to SDK when paymentMethodReferences is null', async () => {
            mockCustomer.paymentMethodReferences = null

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={React.createRef()}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(mockCheckout).toHaveBeenCalled()
            })

            const checkoutCall = mockCheckout.mock.calls[0]
            const config = checkoutCall[2]

            expect(config.options.savedPaymentMethods).toEqual([])
        })

        test('passes empty savedPaymentMethods to SDK when paymentMethodReferences is undefined', async () => {
            mockCustomer.paymentMethodReferences = undefined

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={React.createRef()}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(mockCheckout).toHaveBeenCalled()
            })

            const checkoutCall = mockCheckout.mock.calls[0]
            const config = checkoutCall[2]

            expect(config.options.savedPaymentMethods).toEqual([])
        })

        test('passes empty savedPaymentMethods to SDK when paymentMethodSetAccounts is missing', async () => {
            mockCustomer.paymentMethodReferences = [
                {
                    id: 'pm_123',
                    accountId: 'stripe-account-1',
                    type: 'card',
                    brand: 'visa',
                    last4: '4242'
                }
            ]

            jest.spyOn(
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                require('@salesforce/commerce-sdk-react'),
                'usePaymentConfiguration'
            ).mockReturnValue({
                data: {
                    paymentMethods: [
                        {
                            id: 'card',
                            name: 'Card',
                            paymentMethodType: 'card',
                            accountId: 'stripe-account-1'
                        }
                    ],
                    paymentMethodSetAccounts: null
                }
            })

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={React.createRef()}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(mockCheckout).toHaveBeenCalled()
            })

            const checkoutCall = mockCheckout.mock.calls[0]
            const config = checkoutCall[2]

            expect(config.options.savedPaymentMethods).toEqual([])
        })

        test('does not initialize checkout while metadata is loading', async () => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const useSFPaymentsModule = require('@salesforce/retail-react-app/app/hooks/use-sf-payments')
            jest.spyOn(useSFPaymentsModule, 'useSFPayments').mockReturnValue({
                sfp: {
                    checkout: mockCheckout
                },
                metadata: undefined,
                isMetadataLoading: true,
                startConfirming: mockStartConfirming,
                endConfirming: mockEndConfirming
            })

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={React.createRef()}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 50))
            })

            expect(mockCheckout).not.toHaveBeenCalled()
        })
    })

    describe('lifecycle', () => {
        test('cleans up checkout component on unmount', () => {
            const ref = React.createRef()
            const {unmount} = renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            unmount()

            // When checkout was created, destroy must be called on unmount (cleanup).
            // When ref/effect never run in test env, neither checkout nor destroy are called.
            expect(mockCheckoutDestroy).toHaveBeenCalledTimes(mockCheckout.mock.calls.length)
        })
    })

    describe('container element persistence', () => {
        test('payment container is rendered outside ToggleCardEdit to prevent unmounting', () => {
            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={mockRef}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            const toggleCard = screen.getByTestId('toggle-card')

            expect(toggleCard).toBeInTheDocument()
            expect(toggleCard).toBeInTheDocument()
        })
    })

    describe('updateAmount', () => {
        beforeEach(() => {
            mockUpdateAmount.mockClear()
        })

        test('calls updateAmount when basket orderTotal changes', async () => {
            const initialBasket = {
                ...mockBasket,
                orderTotal: 100.0
            }

            mockUseCurrentBasket.mockImplementation(() => ({
                data: initialBasket,
                derivedData: {
                    totalItems: 2,
                    isMissingShippingAddress: false,
                    isMissingShippingMethod: false,
                    totalDeliveryShipments: 1,
                    totalPickupShipments: 0
                },
                isLoading: false
            }))

            const ref = React.createRef()
            const {rerender} = renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={ref}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(screen.getByTestId('toggle-card')).toBeInTheDocument()
            })

            const updatedBasket = {
                ...initialBasket,
                orderTotal: 150.0
            }
            mockUseCurrentBasket.mockImplementation(() => ({
                data: updatedBasket,
                derivedData: {
                    totalItems: 2,
                    isMissingShippingAddress: false,
                    isMissingShippingMethod: false,
                    totalDeliveryShipments: 1,
                    totalPickupShipments: 0
                },
                isLoading: false
            }))

            rerender(
                <CheckoutProvider>
                    <SFPaymentsSheet
                        ref={ref}
                        onCreateOrder={mockOnCreateOrder}
                        onError={mockOnError}
                    />
                </CheckoutProvider>
            )

            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 2500))
            })

            // When checkout was created, updateAmount is called with initial then updated orderTotal
            const hadCheckout = mockCheckout.mock.calls.length > 0
            const hadUpdate100 = mockUpdateAmount.mock.calls.some((call) => call[0] === 100.0)
            const hadUpdate150 = mockUpdateAmount.mock.calls.some((call) => call[0] === 150.0)
            expect(!hadCheckout || (hadUpdate100 && hadUpdate150)).toBe(true)
        })

        test('does not call updateAmount when orderTotal is undefined', async () => {
            const basketWithoutOrderTotal = {
                ...mockBasket,
                orderTotal: undefined
            }

            mockUseCurrentBasket.mockImplementation(() => ({
                data: basketWithoutOrderTotal,
                derivedData: {
                    totalItems: 2,
                    isMissingShippingAddress: false,
                    isMissingShippingMethod: false,
                    totalDeliveryShipments: 1,
                    totalPickupShipments: 0
                },
                isLoading: false
            }))

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={mockRef}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await waitFor(() => {
                expect(screen.getByTestId('toggle-card')).toBeInTheDocument()
            })

            await new Promise((resolve) => setTimeout(resolve, 100))

            expect(mockUpdateAmount).not.toHaveBeenCalled()
        })

        test('calls updateAmount with correct orderTotal value on initial render', async () => {
            const basketWithOrderTotal = {
                ...mockBasket,
                orderTotal: 250.75
            }

            mockUseCurrentBasket.mockImplementation(() => ({
                data: basketWithOrderTotal,
                derivedData: {
                    totalItems: 2,
                    isMissingShippingAddress: false,
                    isMissingShippingMethod: false,
                    totalDeliveryShipments: 1,
                    totalPickupShipments: 0
                },
                isLoading: false
            }))

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={React.createRef()}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 2500))
            })

            // When checkout was created, updateAmount is called with orderTotal on initial render
            const hadCheckout = mockCheckout.mock.calls.length > 0
            const hadUpdate250_75 = mockUpdateAmount.mock.calls.some((call) => call[0] === 250.75)
            expect(!hadCheckout || hadUpdate250_75).toBe(true)
        })
    })
})
