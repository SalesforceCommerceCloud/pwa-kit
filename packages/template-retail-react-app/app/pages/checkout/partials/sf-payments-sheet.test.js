/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
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

jest.mock('@salesforce/commerce-sdk-react', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...actual,
        useShopperBasketsMutation: (mutationKey) => {
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
            return {mutateAsync: jest.fn()}
        },
        usePaymentConfiguration: () => ({
            data: {
                paymentMethods: [
                    {id: 'card', name: 'Card'},
                    {id: 'paypal', name: 'PayPal'}
                ],
                paymentMethodSetAccounts: []
            }
        }),
        useShippingMethodsForShipment: () => ({
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
        })
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

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => ({
        data: {
            customerId: 'customer123',
            isGuest: false,
            email: 'test@example.com'
        }
    })
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

jest.mock('@salesforce/retail-react-app/app/hooks/use-sf-payments', () => {
    const actual = jest.requireActual('@salesforce/retail-react-app/app/hooks/use-sf-payments')
    return {
        ...actual,
        useSFPayments: () => ({
            sfp: {
                checkout: jest.fn(() => ({
                    confirm: mockCheckoutConfirm,
                    destroy: mockCheckoutDestroy
                }))
            },
            metadata: {key: 'value'},
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
    const ToggleCard = ({children, title}) => (
        <div data-testid="toggle-card">
            <h2>{title}</h2>
            {children}
        </div>
    )
    ToggleCard.propTypes = {
        children: () => null,
        title: () => null
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

describe('SFPaymentsSheet', () => {
    const mockRef = {current: null}

    beforeEach(() => {
        jest.clearAllMocks()

        // Mock product-lists endpoint to avoid console warnings
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
        // Reset mockBasket to default state
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

        // Reset the mock implementation to default
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

            // Mock form trigger to return false (invalid)
            mockUpdateBillingAddress.mockResolvedValue(undefined)

            await expect(ref.current.confirmPayment()).rejects.toThrow('Billing form errors')
        })

        test('confirmPayment updates billing address when billing same as shipping', async () => {
            const ref = React.createRef()

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

        test('confirmPayment creates payment instrument and processes payment', async () => {
            const ref = React.createRef()

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

            mockUpdateBillingAddress.mockResolvedValue({
                ...mockBasket,
                billingAddress: mockBasket.shipments[0].shippingAddress,
                paymentInstruments: []
            })

            mockAddPaymentInstrument.mockResolvedValue({
                ...mockBasket,
                paymentInstruments: mockOrder.paymentInstruments
            })

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

        test('confirmPayment handles payment failure', async () => {
            const ref = React.createRef()

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

            const mockOrder = {
                orderNo: 'ORDER123',
                orderTotal: 629.98,
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
    })

    describe('lifecycle', () => {
        test('cleans up checkout component on unmount', () => {
            const {unmount} = renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={mockRef}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                />
            )

            unmount()

            expect(mockCheckoutDestroy).toHaveBeenCalled()
        })
    })

    describe('onRequiresPayButtonChange callback', () => {
        test('renders successfully with callback provided', () => {
            const mockOnRequiresPayButtonChange = jest.fn()

            renderWithCheckoutContext(
                <SFPaymentsSheet
                    ref={mockRef}
                    onCreateOrder={mockOnCreateOrder}
                    onError={mockOnError}
                    onRequiresPayButtonChange={mockOnRequiresPayButtonChange}
                />
            )

            expect(screen.getByTestId('toggle-card')).toBeInTheDocument()
            expect(mockOnRequiresPayButtonChange).toBeDefined()
            expect(mockOnRequiresPayButtonChange).not.toHaveBeenCalled()
        })
    })
})
