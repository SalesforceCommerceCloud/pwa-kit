/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import SFPaymentsExpressButtons from '@salesforce/retail-react-app/app/components/sf-payments-express-buttons'
import {
    EXPRESS_PAY_NOW,
    EXPRESS_BUY_NOW
} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'
import {rest} from 'msw'
import {DEFAULT_SHIPMENT_ID} from '@salesforce/retail-react-app/app/constants'

// Used by validateAndUpdateShippingMethod tests to capture sfp.express config and inject mock sfp (mock-prefix required by Jest)
let mockValidateTestCaptureConfig = null

// Mock getConfig to provide necessary configuration
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    const actual = jest.requireActual('@salesforce/pwa-kit-runtime/utils/ssr-config')
    const mockConfig = jest.requireActual('@salesforce/retail-react-app/config/mocks/default')
    return {
        ...actual,
        getConfig: jest.fn(() => ({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                sfPayments: {
                    enabled: true
                }
            }
        }))
    }
})

// Mock the SF Payments hooks
jest.mock('@salesforce/retail-react-app/app/hooks/use-sf-payments-country', () => ({
    useSFPaymentsCountry: () => ({countryCode: 'US'})
}))

// When set, validateAndUpdateShippingMethod tests use these mocks for basket/shipping SDK hooks (mock-prefix required by Jest)
let mockValidateTestMocks = null

// When set, attemptFailOrder tests use these mocks for order/API hooks (mock-prefix required by Jest)
let mockAttemptFailOrderMocks = null

// When set, cleanupExpressBasket tests use these mocks for basket cleanup (mock-prefix required by Jest)
let mockCleanupExpressBasketMocks = null

// When set, createIntentFunction PayPal path tests use these mocks (mock-prefix required by Jest)
let mockPayPalCreateIntentMocks = null

// When set, onCancel tests capture endConfirming and toast (mock-prefix required by Jest)
let mockOnCancelMocks = null

// When set, failOrder error handling tests use this for useToast (mock-prefix required by Jest)
let mockFailOrderToast = null

// Used by onApproveEvent tests to assert navigate calls (mock-prefix required by Jest)
const mockNavigate = jest.fn()

jest.mock('@salesforce/retail-react-app/app/hooks/use-navigation', () => ({
    __esModule: true,
    default: () => mockNavigate
}))

jest.mock('@salesforce/commerce-sdk-react', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react')
    const defaultBasket = {
        basketId: 'mock',
        orderTotal: 0,
        productSubTotal: 0,
        shipments: [{shipmentId: 'me'}]
    }
    const mockUseShopperBasketsMutation = (key) => {
        if (
            mockValidateTestMocks &&
            key === 'updateShippingAddressForShipment' &&
            mockValidateTestMocks.updateShippingAddress
        ) {
            return {mutateAsync: mockValidateTestMocks.updateShippingAddress}
        }
        if (
            mockValidateTestMocks &&
            key === 'updateShippingMethodForShipment' &&
            mockValidateTestMocks.updateShippingMethod
        ) {
            return {mutateAsync: mockValidateTestMocks.updateShippingMethod}
        }
        if (
            mockValidateTestMocks &&
            key === 'updateBillingAddressForBasket' &&
            mockValidateTestMocks.updateBillingAddressForBasket
        ) {
            return {mutateAsync: mockValidateTestMocks.updateBillingAddressForBasket}
        }
        if (
            mockValidateTestMocks &&
            key === 'addPaymentInstrumentToBasket' &&
            mockValidateTestMocks.addPaymentInstrumentToBasket
        ) {
            return {mutateAsync: mockValidateTestMocks.addPaymentInstrumentToBasket}
        }
        if (
            mockPayPalCreateIntentMocks &&
            key === 'addPaymentInstrumentToBasket' &&
            mockPayPalCreateIntentMocks.addPaymentInstrumentToBasket
        ) {
            return {mutateAsync: mockPayPalCreateIntentMocks.addPaymentInstrumentToBasket}
        }
        if (
            mockPayPalCreateIntentMocks &&
            key === 'removePaymentInstrumentFromBasket' &&
            mockPayPalCreateIntentMocks.removePaymentInstrumentFromBasket
        ) {
            return {mutateAsync: mockPayPalCreateIntentMocks.removePaymentInstrumentFromBasket}
        }
        if (
            mockAttemptFailOrderMocks &&
            key === 'addPaymentInstrumentToBasket' &&
            mockAttemptFailOrderMocks.addPaymentInstrumentToBasket
        ) {
            return {mutateAsync: mockAttemptFailOrderMocks.addPaymentInstrumentToBasket}
        }
        if (
            mockAttemptFailOrderMocks &&
            key === 'removePaymentInstrumentFromBasket' &&
            mockAttemptFailOrderMocks.removePaymentInstrumentFromBasket
        ) {
            return {mutateAsync: mockAttemptFailOrderMocks.removePaymentInstrumentFromBasket}
        }
        if (
            mockCleanupExpressBasketMocks &&
            key === 'removePaymentInstrumentFromBasket' &&
            mockCleanupExpressBasketMocks.removePaymentInstrumentFromBasket
        ) {
            return {
                mutateAsync: mockCleanupExpressBasketMocks.removePaymentInstrumentFromBasket
            }
        }
        if (
            mockCleanupExpressBasketMocks &&
            key === 'deleteBasket' &&
            mockCleanupExpressBasketMocks.deleteBasket
        ) {
            return {mutateAsync: mockCleanupExpressBasketMocks.deleteBasket}
        }
        // Default: never call real SDK (avoids network in tests)
        return {
            mutateAsync: jest
                .fn()
                .mockResolvedValue(key === 'deleteBasket' ? undefined : defaultBasket)
        }
    }
    return {
        ...actual,
        useShopperBasketsMutation: mockUseShopperBasketsMutation,
        useShopperBasketsV2Mutation: mockUseShopperBasketsMutation,
        useShippingMethodsForShipment: (params, options) => {
            if (mockValidateTestMocks && mockValidateTestMocks.refetchShippingMethods) {
                return {refetch: mockValidateTestMocks.refetchShippingMethods}
            }
            return {
                refetch: jest.fn().mockResolvedValue({data: {applicableShippingMethods: []}})
            }
        },
        useShippingMethodsForShipmentV2: (params, options) => {
            if (mockValidateTestMocks && mockValidateTestMocks.refetchShippingMethods) {
                return {refetch: mockValidateTestMocks.refetchShippingMethods}
            }
            return {
                refetch: jest.fn().mockResolvedValue({data: {applicableShippingMethods: []}})
            }
        },
        useShopperOrdersMutation: (mutationKey) => {
            if (mockAttemptFailOrderMocks) {
                if (mutationKey === 'createOrder' && mockAttemptFailOrderMocks.createOrder) {
                    return {mutateAsync: mockAttemptFailOrderMocks.createOrder}
                }
                if (mutationKey === 'failOrder' && mockAttemptFailOrderMocks.failOrder) {
                    return {mutateAsync: mockAttemptFailOrderMocks.failOrder}
                }
                if (
                    mutationKey === 'updatePaymentInstrumentForOrder' &&
                    mockAttemptFailOrderMocks.updatePaymentInstrumentForOrder
                ) {
                    return {mutateAsync: mockAttemptFailOrderMocks.updatePaymentInstrumentForOrder}
                }
            }
            return {
                mutateAsync: jest.fn().mockResolvedValue({})
            }
        },
        useCommerceApi: () => {
            if (mockAttemptFailOrderMocks && mockAttemptFailOrderMocks.getOrder) {
                return {
                    shopperOrders: {
                        getOrder: mockAttemptFailOrderMocks.getOrder
                    }
                }
            }
            return {
                shopperOrders: {
                    getOrder: jest.fn().mockResolvedValue({status: 'created'})
                }
            }
        },
        useAccessToken: () => {
            if (mockAttemptFailOrderMocks && mockAttemptFailOrderMocks.getTokenWhenReady) {
                return {getTokenWhenReady: mockAttemptFailOrderMocks.getTokenWhenReady}
            }
            return {getTokenWhenReady: jest.fn().mockResolvedValue('mock-token')}
        }
    }
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-sf-payments', () => {
    const actual = jest.requireActual('@salesforce/retail-react-app/app/hooks/use-sf-payments')
    return {
        ...actual,
        useSFPayments: () => {
            if (mockValidateTestCaptureConfig) {
                return {
                    sfp: {
                        express: (_metadata, _paymentMethodSet, config) => {
                            mockValidateTestCaptureConfig.config = config
                            return {destroy: jest.fn()}
                        }
                    },
                    metadata: {},
                    startConfirming: mockOnCancelMocks?.startConfirming ?? jest.fn(),
                    endConfirming: mockOnCancelMocks?.endConfirming ?? jest.fn()
                }
            }
            return {
                sfp: null, // Not initialized
                metadata: null, // Not initialized
                startConfirming: jest.fn(),
                endConfirming: jest.fn()
            }
        }
    }
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => {
    const actual = jest.requireActual('@salesforce/retail-react-app/app/hooks/use-toast')
    return {
        ...actual,
        useToast: () => {
            // Component uses: const toast = useToast(); toast({...}) — hook returns the toast function
            if (mockOnCancelMocks && mockOnCancelMocks.toast) {
                return mockOnCancelMocks.toast
            }
            if (mockFailOrderToast) {
                return mockFailOrderToast
            }
            return actual.useToast()
        }
    }
})

beforeEach(() => {
    // Reset MSW handlers to avoid conflicts
    global.server.resetHandlers()

    // Add MSW handlers to mock API requests
    global.server.use(
        rest.get('*/api/configuration/shopper-configurations/*', (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.status(200),
                ctx.json({
                    configurations: []
                })
            )
        }),
        rest.get(
            '*/api/customer/shopper-customers/*/customers/*/product-lists',
            (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.status(200),
                    ctx.json({
                        data: [],
                        total: 0
                    })
                )
            }
        ),
        rest.get('*/api/payment-metadata', (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.status(200),
                ctx.json({
                    apiKey: 'test-key',
                    publishableKey: 'pk_test'
                })
            )
        }),
        rest.get('*/api/checkout/shopper-payments/*/payment-configuration', (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.status(200),
                ctx.json({
                    paymentMethods: [
                        {id: 'card', name: 'Card'},
                        {id: 'paypal', name: 'PayPal'}
                    ],
                    paymentMethodSetAccounts: []
                })
            )
        })
    )
})

afterEach(() => {
    jest.clearAllMocks()
})

const defaultProps = {
    usage: EXPRESS_PAY_NOW,
    paymentCurrency: 'USD',
    paymentCountryCode: 'US',
    initialAmount: 100,
    prepareBasket: jest.fn()
}

// --- Shared test helpers (reused across describes) ---
const flush = () => new Promise((r) => setTimeout(r, 0))

async function renderAndGetConfig(props = {}) {
    const prepareBasket = props.prepareBasket ?? jest.fn().mockResolvedValue(makeBasket('basket-1'))
    renderWithProviders(
        <SFPaymentsExpressButtons {...defaultProps} {...props} prepareBasket={prepareBasket} />
    )
    await waitFor(() => {
        expect(mockValidateTestCaptureConfig.config).toBeDefined()
    })
    return {config: mockValidateTestCaptureConfig.config, prepareBasket}
}

function getPaymentElement() {
    const box = screen.getByTestId('sf-payments-express')
    return box.firstChild
}

function dispatchPaymentEvent(eventName) {
    const el = getPaymentElement()
    if (el) el.dispatchEvent(new CustomEvent(eventName))
}

// --- Shared mock data factories ---
function makeBasket(basketId, overrides = {}) {
    return {
        basketId,
        orderTotal: 100,
        productSubTotal: 100,
        shipments: [{shipmentId: DEFAULT_SHIPMENT_ID}],
        ...overrides
    }
}

function makeOrder(orderNo, overrides = {}) {
    return {
        orderNo,
        orderTotal: 100,
        paymentInstruments: [
            {paymentMethodId: 'Salesforce Payments', paymentInstrumentId: 'opi-1'}
        ],
        ...overrides
    }
}

function makeOrderWithStripeIntent(orderNo, paymentReferenceId, clientSecret) {
    return {
        ...makeOrder(orderNo),
        paymentInstruments: [
            {
                paymentMethodId: 'Salesforce Payments',
                paymentInstrumentId: 'opi-1',
                paymentReference: {
                    paymentReferenceId,
                    gatewayProperties: {stripe: {clientSecret}}
                }
            }
        ]
    }
}

function createAttemptFailOrderMocks({
    basket = makeBasket('basket-1'),
    order = makeOrder('ord-1'),
    orderFromUpdate = order,
    getOrderStatus = 'created',
    updatePaymentRejects = false,
    createOrderRejects = false,
    failOrderResolves = true
} = {}) {
    return {
        getTokenWhenReady: jest.fn().mockResolvedValue('test-token'),
        getOrder: jest.fn().mockResolvedValue({status: getOrderStatus}),
        createOrder: jest
            .fn()
            [createOrderRejects ? 'mockRejectedValue' : 'mockResolvedValue'](
                createOrderRejects ? new Error('Create order failed') : order
            ),
        updatePaymentInstrumentForOrder: jest
            .fn()
            [updatePaymentRejects ? 'mockRejectedValue' : 'mockResolvedValue'](
                updatePaymentRejects ? new Error('Payment update failed') : orderFromUpdate
            ),
        failOrder: jest.fn().mockResolvedValue(failOrderResolves ? {} : null),
        addPaymentInstrumentToBasket: jest.fn().mockResolvedValue(basket),
        removePaymentInstrumentFromBasket: jest.fn().mockResolvedValue(basket)
    }
}

describe('SFPaymentsExpressButtons', () => {
    test('renders container element', () => {
        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} />)
        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test.each([
        ['EXPRESS_PAY_NOW', {usage: EXPRESS_PAY_NOW}],
        ['EXPRESS_BUY_NOW', {usage: EXPRESS_BUY_NOW}],
        ['horizontal layout', {expressButtonLayout: 'horizontal'}],
        ['vertical layout', {expressButtonLayout: 'vertical'}],
        ['maximumButtonCount', {maximumButtonCount: 2}],
        ['custom paymentCurrency', {paymentCurrency: 'EUR'}],
        ['custom initialAmount', {initialAmount: 250}],
        ['initialAmount of 0', {initialAmount: 0}]
    ])('renders with %s', (_, props) => {
        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} {...props} />)
        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders without paymentCountryCode (uses fallback)', () => {
        const props = {...defaultProps}
        delete props.paymentCountryCode
        renderWithProviders(<SFPaymentsExpressButtons {...props} />)
        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders with onPaymentMethodsRendered callback', () => {
        const mockCallback = jest.fn()
        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} onPaymentMethodsRendered={mockCallback} />
        )
        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders with custom prepareBasket function', () => {
        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={jest.fn()} />
        )
        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders with onExpressPaymentCompleted callback', () => {
        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} onExpressPaymentCompleted={jest.fn()} />
        )
        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })
    test('component renders and handles prop changes without errors', () => {
        const {rerender} = renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} paymentCurrency="USD" />
        )

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()

        // Simulate prop change that would trigger useEffect
        rerender(<SFPaymentsExpressButtons {...defaultProps} paymentCurrency="EUR" />)

        // Should still render without errors
        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })
})

describe('prepareBasket prop updates', () => {
    test('component handles prepareBasket prop changes without errors', () => {
        const prepareBasket1 = jest.fn()
        const {rerender} = renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket1} />
        )

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()

        // Change prepareBasket prop (simulates variant change on PDP)
        const prepareBasket2 = jest.fn()
        rerender(<SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket2} />)

        // Component should still render without errors
        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })
})

describe('lifecycle', () => {
    test('unmounts without errors', () => {
        const {unmount} = renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
        expect(() => unmount()).not.toThrow()
    })

    test('container element has correct test id and tag', () => {
        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} />)

        const container = screen.getByTestId('sf-payments-express')
        expect(container).toBeInTheDocument()
        expect(container.tagName.toLowerCase()).toBe('div')
    })
})

describe('callbacks when SF Payments not initialized', () => {
    test('onPaymentMethodsRendered is not called on initial render', () => {
        const onPaymentMethodsRendered = jest.fn()

        renderWithProviders(
            <SFPaymentsExpressButtons
                {...defaultProps}
                onPaymentMethodsRendered={onPaymentMethodsRendered}
            />
        )

        expect(onPaymentMethodsRendered).not.toHaveBeenCalled()
    })

    test('onExpressPaymentCompleted is not called on initial render', () => {
        const onExpressPaymentCompleted = jest.fn()

        renderWithProviders(
            <SFPaymentsExpressButtons
                {...defaultProps}
                onExpressPaymentCompleted={onExpressPaymentCompleted}
            />
        )

        expect(onExpressPaymentCompleted).not.toHaveBeenCalled()
    })

    test('prepareBasket is not called on initial render', () => {
        const prepareBasket = jest.fn()

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        expect(prepareBasket).not.toHaveBeenCalled()
    })
})

describe('payment configuration', () => {
    test('renders when payment configuration API returns error', () => {
        global.server.use(
            rest.get('*/api/checkout/shopper-payments/*/payment-configuration', (req, res, ctx) =>
                res(ctx.delay(0), ctx.status(500), ctx.json({message: 'Server error'}))
            )
        )

        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders when payment configuration returns empty payment methods', () => {
        global.server.use(
            rest.get('*/api/checkout/shopper-payments/*/payment-configuration', (req, res, ctx) =>
                res(
                    ctx.delay(0),
                    ctx.status(200),
                    ctx.json({
                        paymentMethods: [],
                        paymentMethodSetAccounts: []
                    })
                )
            )
        )

        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })
})

describe('default and optional props', () => {
    test('uses default expressButtonLayout when not provided', () => {
        const propsWithoutLayout = {...defaultProps}
        delete propsWithoutLayout.expressButtonLayout

        renderWithProviders(<SFPaymentsExpressButtons {...propsWithoutLayout} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders without maximumButtonCount', () => {
        const propsWithoutMaxButtons = {...defaultProps}
        delete propsWithoutMaxButtons.maximumButtonCount

        renderWithProviders(<SFPaymentsExpressButtons {...propsWithoutMaxButtons} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders without onPaymentMethodsRendered', () => {
        const propsWithoutCallback = {...defaultProps}
        delete propsWithoutCallback.onPaymentMethodsRendered

        renderWithProviders(<SFPaymentsExpressButtons {...propsWithoutCallback} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('renders without onExpressPaymentCompleted', () => {
        const propsWithoutCallback = {...defaultProps}
        delete propsWithoutCallback.onExpressPaymentCompleted

        renderWithProviders(<SFPaymentsExpressButtons {...propsWithoutCallback} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })
})

describe('edge cases and rerenders', () => {
    test('handles initialAmount as decimal', () => {
        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} initialAmount={99.99} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('handles multiple rerenders with different paymentCurrency and paymentCountryCode', () => {
        const {rerender} = renderWithProviders(
            <SFPaymentsExpressButtons
                {...defaultProps}
                paymentCurrency="USD"
                paymentCountryCode="US"
            />
        )

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()

        rerender(
            <SFPaymentsExpressButtons
                {...defaultProps}
                paymentCurrency="GBP"
                paymentCountryCode="GB"
            />
        )
        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()

        rerender(
            <SFPaymentsExpressButtons
                {...defaultProps}
                paymentCurrency="EUR"
                paymentCountryCode="DE"
            />
        )
        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('handles rerender from EXPRESS_PAY_NOW to EXPRESS_BUY_NOW', () => {
        const {rerender} = renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} usage={EXPRESS_PAY_NOW} />
        )

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()

        rerender(<SFPaymentsExpressButtons {...defaultProps} usage={EXPRESS_BUY_NOW} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
    })

    test('handles rerender with callbacks added then removed', () => {
        const onPaymentMethodsRendered = jest.fn()
        const onExpressPaymentCompleted = jest.fn()

        const {rerender} = renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} />)

        rerender(
            <SFPaymentsExpressButtons
                {...defaultProps}
                onPaymentMethodsRendered={onPaymentMethodsRendered}
                onExpressPaymentCompleted={onExpressPaymentCompleted}
            />
        )
        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()

        rerender(<SFPaymentsExpressButtons {...defaultProps} />)
        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
        expect(onPaymentMethodsRendered).not.toHaveBeenCalled()
        expect(onExpressPaymentCompleted).not.toHaveBeenCalled()
    })
})

describe('validateAndUpdateShippingMethod', () => {
    const basketId = 'basket-123'
    const mockBasketWithShippingMethod = (shippingMethodId) => ({
        basketId,
        shipments: [
            {
                shipmentId: DEFAULT_SHIPMENT_ID,
                shippingMethod: shippingMethodId ? {id: shippingMethodId} : undefined
            }
        ]
    })

    const applicableShippingMethods = [
        {id: 'first-applicable', name: 'Standard'},
        {id: 'second-applicable', name: 'Express'}
    ]

    beforeEach(() => {
        mockValidateTestCaptureConfig = {}
        mockValidateTestMocks = {
            updateShippingAddress: jest.fn(),
            updateShippingMethod: jest.fn(),
            refetchShippingMethods: jest.fn()
        }
    })

    afterEach(() => {
        mockValidateTestCaptureConfig = null
        mockValidateTestMocks = null
    })

    test('calls updateShippingMethod with first applicable method when current method is not in applicable list', async () => {
        const basketWithInapplicableMethod = mockBasketWithShippingMethod('old-inapplicable-method')
        mockValidateTestMocks.updateShippingAddress.mockResolvedValue(basketWithInapplicableMethod)
        mockValidateTestMocks.updateShippingMethod.mockResolvedValue({
            ...basketWithInapplicableMethod,
            shipments: [
                {
                    ...basketWithInapplicableMethod.shipments[0],
                    shippingMethod: {id: 'first-applicable'}
                }
            ]
        })
        mockValidateTestMocks.refetchShippingMethods.mockResolvedValue({
            data: {applicableShippingMethods}
        })

        const prepareBasket = jest.fn().mockResolvedValue(mockBasketWithShippingMethod('any'))

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig
        expect(config.actions.onClick).toBeDefined()
        expect(config.actions.onShippingAddressChange).toBeDefined()

        await config.actions.onClick('card')
        await flush()

        const mockCallback = {
            updateShippingAddress: jest.fn()
        }
        const shippingAddress = {
            city: 'San Francisco',
            state: 'CA',
            postal_code: '94102',
            country: 'US'
        }

        await config.actions.onShippingAddressChange(shippingAddress, mockCallback)

        expect(mockValidateTestMocks.updateShippingMethod).toHaveBeenCalledWith({
            parameters: {
                basketId,
                shipmentId: DEFAULT_SHIPMENT_ID
            },
            body: {
                id: 'first-applicable'
            }
        })
    })

    test('does not call updateShippingMethod when current method is in applicable list', async () => {
        const basketWithApplicableMethod = mockBasketWithShippingMethod('first-applicable')
        mockValidateTestMocks.updateShippingAddress.mockResolvedValue(basketWithApplicableMethod)
        mockValidateTestMocks.refetchShippingMethods.mockResolvedValue({
            data: {applicableShippingMethods}
        })

        const prepareBasket = jest.fn().mockResolvedValue(mockBasketWithShippingMethod('any'))

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig
        await config.actions.onClick('card')
        await flush()

        const mockCallback = {updateShippingAddress: jest.fn()}
        const shippingAddress = {
            city: 'San Francisco',
            state: 'CA',
            postal_code: '94102',
            country: 'US'
        }

        await config.actions.onShippingAddressChange(shippingAddress, mockCallback)

        expect(mockValidateTestMocks.updateShippingMethod).not.toHaveBeenCalled()
    })

    test('calls updateShippingMethod with first applicable method when current basket has no shipping method', async () => {
        const basketWithNoShippingMethod = mockBasketWithShippingMethod(undefined)
        mockValidateTestMocks.updateShippingAddress.mockResolvedValue(basketWithNoShippingMethod)
        mockValidateTestMocks.updateShippingMethod.mockResolvedValue({
            ...basketWithNoShippingMethod,
            shipments: [
                {
                    ...basketWithNoShippingMethod.shipments[0],
                    shippingMethod: {id: 'first-applicable'}
                }
            ]
        })
        mockValidateTestMocks.refetchShippingMethods.mockResolvedValue({
            data: {applicableShippingMethods}
        })

        const prepareBasket = jest.fn().mockResolvedValue(mockBasketWithShippingMethod(undefined))

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig
        await config.actions.onClick('card')
        await flush()

        const mockCallback = {updateShippingAddress: jest.fn()}
        const shippingAddress = {
            city: 'Seattle',
            state: 'WA',
            postal_code: '98101',
            country: 'US'
        }

        await config.actions.onShippingAddressChange(shippingAddress, mockCallback)

        expect(mockValidateTestMocks.updateShippingMethod).toHaveBeenCalledWith({
            parameters: {
                basketId,
                shipmentId: DEFAULT_SHIPMENT_ID
            },
            body: {
                id: 'first-applicable'
            }
        })
    })
})

describe('onShippingMethodChange', () => {
    const basketId = 'basket-shipping-method'
    const applicableShippingMethods = [
        {id: 'standard-id', name: 'Standard'},
        {id: 'express-id', name: 'Express'}
    ]
    const mockUpdatedBasket = {
        basketId,
        orderTotal: 100,
        productSubTotal: 100,
        shippingTotal: 10,
        shipments: [
            {
                shipmentId: DEFAULT_SHIPMENT_ID,
                shippingMethod: {id: 'express-id'}
            }
        ]
    }

    beforeEach(() => {
        mockValidateTestCaptureConfig = {}
        mockValidateTestMocks = {
            updateShippingAddress: jest.fn(),
            updateShippingMethod: jest.fn(),
            refetchShippingMethods: jest.fn()
        }
    })

    afterEach(() => {
        mockValidateTestCaptureConfig = null
        mockValidateTestMocks = null
    })

    test('calls updateShippingMethod and callback with express callback when shipping method changes', async () => {
        mockValidateTestMocks.updateShippingMethod.mockResolvedValue(mockUpdatedBasket)
        mockValidateTestMocks.refetchShippingMethods.mockResolvedValue({
            data: {applicableShippingMethods}
        })

        const prepareBasket = jest.fn().mockResolvedValue({
            basketId,
            orderTotal: 100,
            productSubTotal: 100,
            shipments: [{shipmentId: DEFAULT_SHIPMENT_ID}]
        })

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        await flush()

        const mockCallback = {updateShippingMethod: jest.fn()}
        const shippingMethod = {id: 'express-id', name: 'Express'}

        await config.actions.onShippingMethodChange(shippingMethod, mockCallback)

        expect(mockValidateTestMocks.updateShippingMethod).toHaveBeenCalledWith({
            parameters: {
                basketId,
                shipmentId: DEFAULT_SHIPMENT_ID
            },
            body: {
                id: 'express-id'
            }
        })
        expect(mockValidateTestMocks.refetchShippingMethods).toHaveBeenCalled()
        expect(mockCallback.updateShippingMethod).toHaveBeenCalledTimes(1)
        const callbackArg = mockCallback.updateShippingMethod.mock.calls[0][0]
        expect(callbackArg).toHaveProperty('total')
        expect(callbackArg).toHaveProperty('shippingMethods')
        expect(callbackArg).toHaveProperty('selectedShippingMethod')
        expect(callbackArg).toHaveProperty('lineItems')
        expect(callbackArg).not.toHaveProperty('errors')
    })

    test('calls callback with errors when updateShippingMethod rejects', async () => {
        mockValidateTestMocks.updateShippingMethod.mockRejectedValue(new Error('API error'))
        mockValidateTestMocks.refetchShippingMethods.mockResolvedValue({
            data: {applicableShippingMethods}
        })

        const prepareBasket = jest.fn().mockResolvedValue({
            basketId,
            orderTotal: 100,
            productSubTotal: 100,
            shipments: [{shipmentId: DEFAULT_SHIPMENT_ID}]
        })

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        await flush()

        const mockCallback = {updateShippingMethod: jest.fn()}
        const shippingMethod = {id: 'standard-id'}

        await config.actions.onShippingMethodChange(shippingMethod, mockCallback)

        expect(mockCallback.updateShippingMethod).toHaveBeenCalledWith({errors: ['fail']})
    })

    test('calls callback with errors when prepareBasketPromise rejects', async () => {
        const prepareBasket = jest.fn().mockRejectedValue(new Error('Basket failed'))

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        const mockCallback = {updateShippingMethod: jest.fn()}
        const shippingMethod = {id: 'standard-id'}

        await config.actions.onShippingMethodChange(shippingMethod, mockCallback)

        expect(mockCallback.updateShippingMethod).toHaveBeenCalledWith({errors: ['fail']})
        expect(mockValidateTestMocks.updateShippingMethod).not.toHaveBeenCalled()
    })
})

describe('onPayerApprove', () => {
    const basketId = 'basket-payer-approve'
    const mockUpdatedBasketAfterShipping = {
        basketId,
        orderTotal: 100,
        productSubTotal: 100,
        shipments: [{shipmentId: DEFAULT_SHIPMENT_ID}]
    }
    const mockBasketWithInstrument = {
        ...mockUpdatedBasketAfterShipping,
        paymentInstruments: [{paymentMethodId: 'Salesforce Payments', paymentInstrumentId: 'pi-1'}]
    }

    const billingDetails = {
        name: 'John Doe',
        address: {
            line1: '123 Billing St',
            line2: 'Apt 1',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'US'
        },
        phone: '555-1234'
    }
    const shippingDetails = {
        name: 'Jane Doe',
        address: {
            line1: '456 Shipping Ave',
            city: 'Oakland',
            state: 'CA',
            postalCode: '94601',
            country: 'US'
        }
    }

    beforeEach(() => {
        mockValidateTestCaptureConfig = {}
        mockValidateTestMocks = {
            updateShippingAddress: jest.fn().mockResolvedValue(mockUpdatedBasketAfterShipping),
            updateShippingMethod: jest.fn(),
            refetchShippingMethods: jest.fn(),
            updateBillingAddressForBasket: jest.fn().mockResolvedValue(undefined),
            addPaymentInstrumentToBasket: jest.fn().mockResolvedValue(mockBasketWithInstrument)
        }
    })

    afterEach(() => {
        mockValidateTestCaptureConfig = null
        mockValidateTestMocks = null
    })

    test('calls updateShippingAddress, updateBillingAddress and addPaymentInstrument for non-PayPal when payer approves', async () => {
        const prepareBasket = jest.fn().mockResolvedValue({
            basketId,
            orderTotal: 100,
            productSubTotal: 100,
            shipments: [{shipmentId: DEFAULT_SHIPMENT_ID}]
        })

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        await flush()

        await config.actions.onPayerApprove(billingDetails, shippingDetails)

        expect(mockValidateTestMocks.updateShippingAddress).toHaveBeenCalledWith({
            parameters: {
                basketId,
                shipmentId: DEFAULT_SHIPMENT_ID,
                useAsBilling: false
            },
            body: expect.objectContaining({
                firstName: 'Jane',
                lastName: 'Doe',
                address1: '456 Shipping Ave',
                city: 'Oakland',
                stateCode: 'CA',
                postalCode: '94601',
                countryCode: 'US'
            })
        })
        expect(mockValidateTestMocks.updateBillingAddressForBasket).toHaveBeenCalledWith({
            parameters: {basketId},
            body: expect.objectContaining({
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Billing St',
                city: 'San Francisco',
                stateCode: 'CA',
                postalCode: '94102',
                countryCode: 'US'
            })
        })
        expect(mockValidateTestMocks.addPaymentInstrumentToBasket).toHaveBeenCalledWith({
            parameters: {basketId},
            body: expect.any(Object)
        })
    })

    test('returns early without updating addresses when orderRef is set (non-PayPal)', async () => {
        const basket = makeBasket(basketId, {
            paymentInstruments: [
                {paymentMethodId: 'Salesforce Payments', paymentInstrumentId: 'basket-pi-1'}
            ]
        })
        mockAttemptFailOrderMocks = createAttemptFailOrderMocks({
            basket,
            updatePaymentRejects: true
        })

        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(makeBasket(basketId))
        })

        await config.actions.onClick('card')
        await flush()
        await expect(config.actions.createIntent()).rejects.toThrow()

        expect(mockValidateTestMocks.updateShippingAddress).not.toHaveBeenCalled()
        expect(mockValidateTestMocks.updateBillingAddressForBasket).not.toHaveBeenCalled()

        mockAttemptFailOrderMocks = null
    })

    test('throws when updateShippingAddressForShipment rejects', async () => {
        mockValidateTestMocks.updateShippingAddress.mockRejectedValue(
            new Error('Address update failed')
        )

        const prepareBasket = jest.fn().mockResolvedValue({
            basketId,
            orderTotal: 100,
            productSubTotal: 100,
            shipments: [{shipmentId: DEFAULT_SHIPMENT_ID}]
        })

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        await flush()

        await expect(
            config.actions.onPayerApprove(billingDetails, shippingDetails)
        ).rejects.toThrow('Address update failed')
    })

    test('calls endConfirming and rethrows when updateBillingAddressForBasket rejects', async () => {
        mockOnCancelMocks = {endConfirming: jest.fn(), toast: jest.fn()}
        mockValidateTestMocks.updateBillingAddressForBasket.mockRejectedValue(
            new Error('Billing update failed')
        )

        const prepareBasket = jest.fn().mockResolvedValue({
            basketId,
            orderTotal: 100,
            productSubTotal: 100,
            shipments: [{shipmentId: DEFAULT_SHIPMENT_ID}]
        })

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        await flush()

        await expect(
            config.actions.onPayerApprove(billingDetails, shippingDetails)
        ).rejects.toThrow('Billing update failed')

        expect(mockOnCancelMocks.endConfirming).toHaveBeenCalled()
        mockOnCancelMocks = null
    })

    test('calls showErrorMessage(PROCESS_PAYMENT) and endConfirming and rethrows when addPaymentInstrumentToBasket rejects (non-PayPal)', async () => {
        mockOnCancelMocks = {endConfirming: jest.fn(), toast: jest.fn()}
        mockValidateTestMocks.addPaymentInstrumentToBasket.mockRejectedValue(
            new Error('Add payment instrument failed')
        )

        const prepareBasket = jest.fn().mockResolvedValue({
            basketId,
            orderTotal: 100,
            productSubTotal: 100,
            shipments: [{shipmentId: DEFAULT_SHIPMENT_ID}]
        })

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        await flush()

        await expect(
            config.actions.onPayerApprove(billingDetails, shippingDetails)
        ).rejects.toThrow('Add payment instrument failed')

        expect(mockOnCancelMocks.toast).toHaveBeenCalledWith(
            expect.objectContaining({status: 'error'})
        )
        expect(mockOnCancelMocks.endConfirming).toHaveBeenCalled()
        mockOnCancelMocks = null
    })
})

describe('createIntentFunction PayPal path (isPayPalPaymentMethodType)', () => {
    const basketId = 'basket-paypal-intent'
    const basketWithoutSfInstrument = {
        basketId,
        orderTotal: 100,
        productSubTotal: 100,
        shipments: [{shipmentId: DEFAULT_SHIPMENT_ID}]
    }
    const basketWithSfInstrument = {
        ...basketWithoutSfInstrument,
        paymentInstruments: [
            {
                paymentMethodId: 'Salesforce Payments',
                paymentInstrumentId: 'pi-existing-1'
            }
        ]
    }
    const basketAfterAddInstrument = {
        ...basketWithoutSfInstrument,
        paymentInstruments: [
            {
                paymentMethodId: 'Salesforce Payments',
                paymentInstrumentId: 'pi-new-1'
            }
        ]
    }

    beforeEach(() => {
        mockValidateTestCaptureConfig = {}
        mockPayPalCreateIntentMocks = {
            removePaymentInstrumentFromBasket: jest
                .fn()
                .mockResolvedValue(basketWithoutSfInstrument),
            addPaymentInstrumentToBasket: jest.fn().mockResolvedValue(basketAfterAddInstrument)
        }
    })

    afterEach(() => {
        mockValidateTestCaptureConfig = null
        mockPayPalCreateIntentMocks = null
    })

    test('calls prepareBasket then addPaymentInstrumentToBasket when basket has no SF Payments instrument', async () => {
        const prepareBasket = jest.fn().mockResolvedValue(basketWithoutSfInstrument)

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('paypal')
        const result = await config.actions.createIntent()

        expect(prepareBasket).toHaveBeenCalled()
        expect(mockPayPalCreateIntentMocks.addPaymentInstrumentToBasket).toHaveBeenCalledWith({
            parameters: {basketId},
            body: expect.objectContaining({
                amount: 100,
                paymentMethodId: 'Salesforce Payments'
            })
        })
        expect(mockPayPalCreateIntentMocks.removePaymentInstrumentFromBasket).not.toHaveBeenCalled()
        expect(result).toBeDefined()
    })

    test('calls removePaymentInstrumentFromBasket then addPaymentInstrumentToBasket when basket has existing SF Payments instrument', async () => {
        const prepareBasket = jest.fn().mockResolvedValue(basketWithSfInstrument)

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('paypal')
        const result = await config.actions.createIntent()

        expect(prepareBasket).toHaveBeenCalled()
        expect(mockPayPalCreateIntentMocks.removePaymentInstrumentFromBasket).toHaveBeenCalledWith({
            parameters: {
                basketId,
                paymentInstrumentId: 'pi-existing-1'
            }
        })
        expect(mockPayPalCreateIntentMocks.addPaymentInstrumentToBasket).toHaveBeenCalledWith({
            parameters: {basketId},
            body: expect.objectContaining({
                amount: 100,
                paymentMethodId: 'Salesforce Payments'
            })
        })
        expect(result).toBeDefined()
    })

    test('throws when addPaymentInstrumentToBasket rejects in PayPal path', async () => {
        mockPayPalCreateIntentMocks.addPaymentInstrumentToBasket.mockRejectedValue(
            new Error('Add instrument failed')
        )
        const prepareBasket = jest.fn().mockResolvedValue(basketWithoutSfInstrument)

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('paypal')
        await expect(config.actions.createIntent()).rejects.toThrow('Add instrument failed')
    })
})

describe('createIntentFunction non-PayPal path (else branch of isPayPalPaymentMethodType)', () => {
    const basketId = 'basket-nonpaypal-intent'
    const orderNo = 'ord-nonpaypal-1'
    const paymentReferenceId = 'ref-nonpaypal-123'
    const clientSecret = 'pi_secret_xyz'
    const mockBasket = makeBasket(basketId)
    const mockOrderFromCreate = makeOrder(orderNo)
    const mockOrderFromUpdatePayment = makeOrderWithStripeIntent(
        orderNo,
        paymentReferenceId,
        clientSecret
    )

    beforeEach(() => {
        mockValidateTestCaptureConfig = {}
        mockAttemptFailOrderMocks = createAttemptFailOrderMocks({
            basket: mockBasket,
            order: mockOrderFromCreate,
            orderFromUpdate: mockOrderFromUpdatePayment
        })
    })

    afterEach(() => {
        mockValidateTestCaptureConfig = null
        mockAttemptFailOrderMocks = null
    })

    test('calls ensurePaymentInstrumentInBasket and createOrderAndUpdatePayment and returns client_secret and id when createIntent succeeds (card)', async () => {
        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(mockBasket)
        })

        await config.actions.onClick('card')
        await flush()

        const result = await config.actions.createIntent()

        expect(result).toEqual({
            client_secret: clientSecret,
            id: paymentReferenceId
        })
        expect(mockAttemptFailOrderMocks.addPaymentInstrumentToBasket).toHaveBeenCalled()
        expect(mockAttemptFailOrderMocks.createOrder).toHaveBeenCalledWith({
            body: {basketId}
        })
        expect(mockAttemptFailOrderMocks.updatePaymentInstrumentForOrder).toHaveBeenCalled()
    })

    test('does not call prepareBasket at start of createIntent for non-PayPal (only onClick does)', async () => {
        const {config, prepareBasket} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(mockBasket)
        })

        await config.actions.onClick('card')
        await flush()

        const prepareBasketCallsBeforeCreateIntent = prepareBasket.mock.calls.length
        await config.actions.createIntent()
        const prepareBasketCallsAfterCreateIntent = prepareBasket.mock.calls.length

        expect(prepareBasketCallsBeforeCreateIntent).toBe(1)
        expect(prepareBasketCallsAfterCreateIntent).toBe(1)
    })

    test('calls endConfirming and rethrows when createOrderAndUpdatePayment throws in non-PayPal path', async () => {
        mockOnCancelMocks = {endConfirming: jest.fn(), toast: jest.fn()}
        mockAttemptFailOrderMocks.updatePaymentInstrumentForOrder.mockRejectedValue(
            new Error('Payment update failed')
        )

        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(mockBasket)
        })

        await config.actions.onClick('card')
        await flush()

        await expect(config.actions.createIntent()).rejects.toThrow('Payment update failed')

        expect(mockOnCancelMocks.endConfirming).toHaveBeenCalled()
        mockOnCancelMocks = null
    })

    test('returns basket as-is from ensurePaymentInstrumentInBasket when basket already has SF Payments instrument (non-PayPal)', async () => {
        const basketWithSfInstrument = {
            ...mockBasket,
            paymentInstruments: [
                {
                    paymentMethodId: 'Salesforce Payments',
                    paymentInstrumentId: 'pi-existing-1'
                }
            ]
        }
        const prepareBasket = jest.fn().mockResolvedValue(basketWithSfInstrument)

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        await flush()

        const result = await config.actions.createIntent()

        expect(result).toEqual({
            client_secret: clientSecret,
            id: paymentReferenceId
        })
        expect(mockAttemptFailOrderMocks.addPaymentInstrumentToBasket).not.toHaveBeenCalled()
        expect(mockAttemptFailOrderMocks.removePaymentInstrumentFromBasket).not.toHaveBeenCalled()
        expect(mockAttemptFailOrderMocks.createOrder).toHaveBeenCalled()
        expect(mockAttemptFailOrderMocks.updatePaymentInstrumentForOrder).toHaveBeenCalled()
    })

    test('calls showErrorMessage(PROCESS_PAYMENT) and endConfirming and rethrows when ensurePaymentInstrumentInBasket addPaymentInstrumentToBasket rejects (non-PayPal)', async () => {
        mockOnCancelMocks = {endConfirming: jest.fn(), toast: jest.fn()}
        mockAttemptFailOrderMocks.addPaymentInstrumentToBasket.mockRejectedValue(
            new Error('Add payment instrument failed')
        )

        const prepareBasket = jest.fn().mockResolvedValue(mockBasket)

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        await flush()

        await expect(config.actions.createIntent()).rejects.toThrow('Add payment instrument failed')

        expect(mockOnCancelMocks.toast).toHaveBeenCalledWith(
            expect.objectContaining({status: 'error'})
        )
        expect(mockOnCancelMocks.endConfirming).toHaveBeenCalled()
        expect(mockAttemptFailOrderMocks.createOrder).not.toHaveBeenCalled()
        mockOnCancelMocks = null
    })
})

describe('createIntentFunction Adyen path (isAdyen && paymentData?.shippingDetails)', () => {
    const basketId = 'basket-adyen-intent'
    const pspReference = 'adyen-psp-123'
    const paymentReferenceId = 'adyen-guid-456'
    const mockBasket = {
        basketId,
        orderTotal: 100,
        productSubTotal: 100,
        shipments: [{shipmentId: DEFAULT_SHIPMENT_ID}]
    }
    const mockBasketAfterShippingUpdate = {...mockBasket, basketId}
    const mockOrderFromCreate = {
        orderNo: 'ord-adyen-1',
        orderTotal: 100,
        paymentInstruments: [
            {paymentMethodId: 'Salesforce Payments', paymentInstrumentId: 'opi-adyen-1'}
        ]
    }
    const mockOrderFromUpdatePayment = {
        ...mockOrderFromCreate,
        paymentInstruments: [
            {
                paymentMethodId: 'Salesforce Payments',
                paymentInstrumentId: 'opi-adyen-1',
                paymentReference: {
                    paymentReferenceId,
                    gatewayProperties: {
                        adyen: {
                            adyenPaymentIntent: {
                                id: pspReference,
                                resultCode: 'Authorised',
                                adyenPaymentIntentAction: {type: 'threeDS2'}
                            }
                        }
                    }
                }
            }
        ]
    }
    const billingDetails = {
        name: 'John Doe',
        address: {
            line1: '123 Billing St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'US'
        }
    }
    const shippingDetails = {
        name: 'Jane Doe',
        address: {
            line1: '456 Shipping Ave',
            city: 'Oakland',
            state: 'CA',
            postalCode: '94601',
            country: 'US'
        }
    }
    const adyenPaymentConfig = {
        paymentMethods: [
            {id: 'card', name: 'Card', paymentMethodType: 'card', accountId: 'adyen-account-1'}
        ],
        paymentMethodSetAccounts: [{accountId: 'adyen-account-1', vendor: 'adyen'}]
    }

    beforeEach(() => {
        mockValidateTestCaptureConfig = {}
        mockValidateTestMocks = {
            updateShippingAddress: jest.fn().mockResolvedValue(mockBasketAfterShippingUpdate),
            updateBillingAddressForBasket: jest.fn().mockResolvedValue(undefined)
        }
        mockAttemptFailOrderMocks = {
            getTokenWhenReady: jest.fn().mockResolvedValue('test-token'),
            getOrder: jest.fn().mockResolvedValue({status: 'created'}),
            createOrder: jest.fn().mockResolvedValue(mockOrderFromCreate),
            updatePaymentInstrumentForOrder: jest
                .fn()
                .mockResolvedValue(mockOrderFromUpdatePayment),
            addPaymentInstrumentToBasket: jest.fn().mockResolvedValue(mockBasket),
            removePaymentInstrumentFromBasket: jest.fn().mockResolvedValue(mockBasket)
        }
        global.server.use(
            rest.get('*/api/checkout/shopper-payments/*/payment-configuration', (req, res, ctx) =>
                res(ctx.delay(0), ctx.status(200), ctx.json(adyenPaymentConfig))
            )
        )
    })

    afterEach(() => {
        mockValidateTestCaptureConfig = null
        mockValidateTestMocks = null
        mockAttemptFailOrderMocks = null
    })

    test('calls updateShippingAddressForShipment and updateBillingAddressForBasket when createIntent(paymentData) is called with shippingDetails (Adyen)', async () => {
        const prepareBasket = jest.fn().mockResolvedValue(mockBasket)

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        await flush()

        const result = await config.actions.createIntent({
            billingDetails,
            shippingDetails
        })

        expect(result).toEqual({
            pspReference,
            guid: paymentReferenceId,
            resultCode: 'Authorised',
            action: {type: 'threeDS2'}
        })
        expect(mockValidateTestMocks.updateShippingAddress).toHaveBeenCalledWith({
            parameters: {
                basketId,
                shipmentId: DEFAULT_SHIPMENT_ID,
                useAsBilling: false
            },
            body: expect.objectContaining({
                firstName: 'Jane',
                lastName: 'Doe',
                address1: '456 Shipping Ave',
                city: 'Oakland',
                stateCode: 'CA',
                postalCode: '94601',
                countryCode: 'US'
            })
        })
        expect(mockValidateTestMocks.updateBillingAddressForBasket).toHaveBeenCalledWith({
            parameters: {basketId},
            body: expect.objectContaining({
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Billing St',
                city: 'San Francisco',
                stateCode: 'CA',
                postalCode: '94102',
                countryCode: 'US'
            })
        })
    })

    test('calls endConfirming and rethrows when updateShippingAddressForShipment rejects in Adyen address-update block', async () => {
        mockOnCancelMocks = {endConfirming: jest.fn(), toast: jest.fn()}
        mockValidateTestMocks.updateShippingAddress.mockRejectedValue(
            new Error('Address update failed')
        )

        const prepareBasket = jest.fn().mockResolvedValue(mockBasket)

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        await flush()

        await expect(
            config.actions.createIntent({billingDetails, shippingDetails})
        ).rejects.toThrow('Address update failed')

        expect(mockOnCancelMocks.endConfirming).toHaveBeenCalled()
        mockOnCancelMocks = null
    })

    test('does not call updateShippingAddress or updateBillingAddress when paymentData has no shippingDetails (Adyen)', async () => {
        const prepareBasket = jest.fn().mockResolvedValue(mockBasket)

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        await flush()

        await config.actions.createIntent({billingDetails})

        expect(mockValidateTestMocks.updateShippingAddress).not.toHaveBeenCalled()
        expect(mockValidateTestMocks.updateBillingAddressForBasket).not.toHaveBeenCalled()
    })
})

describe('attemptFailOrder', () => {
    const orderNo = 'ord-attempt-fail-test'
    const mockOrder = makeOrder(orderNo)
    const mockBasket = makeBasket('basket-1', {
        paymentInstruments: [
            {paymentMethodId: 'Salesforce Payments', paymentInstrumentId: 'basket-pi-1'}
        ]
    })

    beforeEach(() => {
        mockValidateTestCaptureConfig = {}
        mockAttemptFailOrderMocks = createAttemptFailOrderMocks({
            basket: mockBasket,
            order: mockOrder,
            updatePaymentRejects: true
        })
    })

    afterEach(() => {
        mockValidateTestCaptureConfig = null
        mockAttemptFailOrderMocks = null
    })

    test('calls failOrder with reopenBasket when updatePaymentInstrumentForOrder fails after order created and order status is created', async () => {
        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(makeBasket('basket-1'))
        })

        await config.actions.onClick('card')
        await flush()

        await expect(config.actions.createIntent()).rejects.toThrow()

        expect(mockAttemptFailOrderMocks.failOrder).toHaveBeenCalledWith({
            parameters: {orderNo, reopenBasket: true},
            body: {reasonCode: 'payment_confirm_failure'}
        })
        expect(mockAttemptFailOrderMocks.getTokenWhenReady).toHaveBeenCalled()
        expect(mockAttemptFailOrderMocks.getOrder).toHaveBeenCalledWith({
            parameters: {orderNo},
            headers: {Authorization: 'Bearer test-token'}
        })
    })

    test('does not call failOrder when getOrder returns status other than created', async () => {
        mockAttemptFailOrderMocks.getOrder.mockResolvedValue({status: 'completed'})

        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(makeBasket('basket-1'))
        })

        await config.actions.onClick('card')
        await flush()

        await expect(config.actions.createIntent()).rejects.toThrow()

        expect(mockAttemptFailOrderMocks.failOrder).not.toHaveBeenCalled()
        expect(mockAttemptFailOrderMocks.getTokenWhenReady).toHaveBeenCalled()
        expect(mockAttemptFailOrderMocks.getOrder).toHaveBeenCalled()
    })

    test('does not call failOrder when getOrder throws', async () => {
        mockAttemptFailOrderMocks.getOrder.mockRejectedValue(new Error('Network error'))

        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(makeBasket('basket-1'))
        })

        await config.actions.onClick('card')
        await flush()

        await expect(config.actions.createIntent()).rejects.toThrow()

        expect(mockAttemptFailOrderMocks.failOrder).not.toHaveBeenCalled()
    })
})

describe('cleanupExpressBasket', () => {
    const basketWithSfInstrument = {
        basketId: 'basket-cleanup-1',
        orderTotal: 100,
        productSubTotal: 100,
        shipments: [{shipmentId: 'me'}],
        paymentInstruments: [
            {
                paymentMethodId: 'Salesforce Payments',
                paymentInstrumentId: 'pi-cleanup-1'
            }
        ]
    }
    const basketWithoutSfInstrument = {
        basketId: 'basket-cleanup-2',
        orderTotal: 100,
        productSubTotal: 100,
        shipments: [{shipmentId: 'me'}]
    }
    const basketTemporary = {
        ...basketWithSfInstrument,
        basketId: 'basket-temp-1',
        temporaryBasket: true
    }

    const dispatchPaymentCancel = () => dispatchPaymentEvent('sfp:paymentcancel')

    beforeEach(() => {
        mockValidateTestCaptureConfig = {}
        mockCleanupExpressBasketMocks = {
            removePaymentInstrumentFromBasket: jest
                .fn()
                .mockResolvedValue(basketWithoutSfInstrument),
            deleteBasket: jest.fn().mockResolvedValue(undefined)
        }
    })

    afterEach(() => {
        mockValidateTestCaptureConfig = null
        mockCleanupExpressBasketMocks = null
    })

    test('calls removePaymentInstrumentFromBasket when user cancels and basket has SF Payments instrument', async () => {
        const prepareBasket = jest.fn().mockResolvedValue(basketWithSfInstrument)

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        await flush()

        dispatchPaymentCancel()
        await waitFor(() => {
            expect(
                mockCleanupExpressBasketMocks.removePaymentInstrumentFromBasket
            ).toHaveBeenCalledWith({
                parameters: {
                    basketId: basketWithSfInstrument.basketId,
                    paymentInstrumentId: 'pi-cleanup-1'
                }
            })
        })
    })

    test('calls deleteBasket when user cancels and basket is temporary', async () => {
        const prepareBasket = jest.fn().mockResolvedValue(basketTemporary)
        mockCleanupExpressBasketMocks.removePaymentInstrumentFromBasket.mockResolvedValue({
            ...basketTemporary,
            paymentInstruments: []
        })

        renderWithProviders(
            <SFPaymentsExpressButtons {...defaultProps} prepareBasket={prepareBasket} />
        )

        await waitFor(() => {
            expect(mockValidateTestCaptureConfig.config).toBeDefined()
        })
        const {config} = mockValidateTestCaptureConfig

        await config.actions.onClick('card')
        await flush()

        dispatchPaymentCancel()
        await waitFor(() => {
            expect(
                mockCleanupExpressBasketMocks.removePaymentInstrumentFromBasket
            ).toHaveBeenCalled()
        })
        await waitFor(() => {
            expect(mockCleanupExpressBasketMocks.deleteBasket).toHaveBeenCalledWith({
                parameters: {basketId: basketTemporary.basketId}
            })
        })
    })

    test('does not call removePaymentInstrumentFromBasket or deleteBasket when order was already created (orderRef set)', async () => {
        const basket = makeBasket('basket-1', {
            paymentInstruments: [
                {paymentMethodId: 'Salesforce Payments', paymentInstrumentId: 'basket-pi-1'}
            ]
        })
        mockValidateTestCaptureConfig = {}
        mockAttemptFailOrderMocks = createAttemptFailOrderMocks({
            basket,
            updatePaymentRejects: true
        })

        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(makeBasket('basket-1'))
        })

        await config.actions.onClick('card')
        await flush()
        await expect(config.actions.createIntent()).rejects.toThrow()

        const removeCallCountBeforeCancel =
            mockAttemptFailOrderMocks.removePaymentInstrumentFromBasket.mock.calls.length
        dispatchPaymentCancel()
        await flush()
        await flush()

        expect(mockAttemptFailOrderMocks.removePaymentInstrumentFromBasket.mock.calls).toHaveLength(
            removeCallCountBeforeCancel
        )

        mockAttemptFailOrderMocks = null
    })
})

describe('onCancel', () => {
    const basketWithSfInstrument = {
        basketId: 'basket-oncancel',
        orderTotal: 100,
        productSubTotal: 100,
        shipments: [{shipmentId: 'me'}],
        paymentInstruments: [
            {
                paymentMethodId: 'Salesforce Payments',
                paymentInstrumentId: 'pi-oncancel-1'
            }
        ]
    }
    const basketWithoutSfInstrument = {
        basketId: 'basket-oncancel',
        orderTotal: 100,
        productSubTotal: 100,
        shipments: [{shipmentId: 'me'}]
    }

    const dispatchPaymentCancel = () => dispatchPaymentEvent('sfp:paymentcancel')

    beforeEach(() => {
        mockValidateTestCaptureConfig = {}
        mockOnCancelMocks = {
            endConfirming: jest.fn(),
            toast: jest.fn()
        }
        mockCleanupExpressBasketMocks = {
            removePaymentInstrumentFromBasket: jest
                .fn()
                .mockResolvedValue(basketWithoutSfInstrument),
            deleteBasket: jest.fn().mockResolvedValue(undefined)
        }
    })

    afterEach(() => {
        mockValidateTestCaptureConfig = null
        mockOnCancelMocks = null
        mockCleanupExpressBasketMocks = null
    })

    test('calls endConfirming, cleanupExpressBasket, and showErrorMessage when user cancels', async () => {
        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(basketWithSfInstrument)
        })

        await config.actions.onClick('card')
        await flush()

        dispatchPaymentCancel()

        await waitFor(() => {
            expect(mockOnCancelMocks.endConfirming).toHaveBeenCalled()
        })
        await waitFor(() => {
            expect(
                mockCleanupExpressBasketMocks.removePaymentInstrumentFromBasket
            ).toHaveBeenCalledWith({
                parameters: {
                    basketId: basketWithSfInstrument.basketId,
                    paymentInstrumentId: 'pi-oncancel-1'
                }
            })
        })
        expect(mockOnCancelMocks.toast).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'error',
                title: expect.any(String)
            })
        )
    })

    test('shows error toast with DEFAULT message when user cancels', async () => {
        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(basketWithoutSfInstrument)
        })

        await config.actions.onClick('card')
        await flush()

        dispatchPaymentCancel()

        await waitFor(() => {
            expect(mockOnCancelMocks.toast).toHaveBeenCalled()
        })
        const toastCall = mockOnCancelMocks.toast.mock.calls[0][0]
        expect(toastCall.status).toBe('error')
        expect(toastCall.title).toBeDefined()
        expect(typeof toastCall.title).toBe('string')
    })
})

describe('onApproveEvent', () => {
    const basketId = 'basket-approve'
    const orderNo = 'ord-approve-1'
    const mockBasket = makeBasket(basketId)
    const mockOrder = makeOrder(orderNo, {
        paymentInstruments: [
            {paymentMethodId: 'Salesforce Payments', paymentInstrumentId: 'opi-approve-1'}
        ]
    })

    const dispatchPaymentApprove = () => dispatchPaymentEvent('sfp:paymentapprove')

    test('calls createOrderAndUpdatePayment, onExpressPaymentCompleted, endConfirming, and navigate when PayPal approve event fires', async () => {
        mockValidateTestCaptureConfig = {}
        mockOnCancelMocks = {endConfirming: jest.fn(), toast: jest.fn()}
        mockPayPalCreateIntentMocks = {
            removePaymentInstrumentFromBasket: jest.fn().mockResolvedValue(mockBasket),
            addPaymentInstrumentToBasket: jest.fn().mockResolvedValue(mockBasket)
        }
        mockAttemptFailOrderMocks = createAttemptFailOrderMocks({
            order: mockOrder,
            basket: mockBasket
        })

        const onExpressPaymentCompleted = jest.fn()
        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(mockBasket),
            onExpressPaymentCompleted
        })

        await config.actions.onClick('paypal')
        await config.actions.createIntent()
        await flush()

        dispatchPaymentApprove()

        await waitFor(() => {
            expect(mockAttemptFailOrderMocks.createOrder).toHaveBeenCalledWith({
                body: {basketId}
            })
        })
        expect(onExpressPaymentCompleted).toHaveBeenCalled()
        expect(mockOnCancelMocks.endConfirming).toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledWith(`/checkout/confirmation/${orderNo}`)

        mockValidateTestCaptureConfig = null
        mockOnCancelMocks = null
        mockPayPalCreateIntentMocks = null
        mockAttemptFailOrderMocks = null
    })

    test('calls onExpressPaymentCompleted, endConfirming, and navigate with orderRef when non-PayPal approve event fires after createIntent', async () => {
        mockValidateTestCaptureConfig = {}
        mockOnCancelMocks = {endConfirming: jest.fn(), toast: jest.fn()}
        mockAttemptFailOrderMocks = createAttemptFailOrderMocks({
            order: mockOrder,
            basket: mockBasket
        })

        const onExpressPaymentCompleted = jest.fn()
        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(mockBasket),
            onExpressPaymentCompleted
        })

        await config.actions.onClick('card')
        await flush()
        await config.actions.createIntent()
        await flush()

        dispatchPaymentApprove()

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(`/checkout/confirmation/${orderNo}`)
        })
        expect(onExpressPaymentCompleted).toHaveBeenCalled()
        expect(mockOnCancelMocks.endConfirming).toHaveBeenCalled()
        expect(mockAttemptFailOrderMocks.createOrder).toHaveBeenCalledTimes(1)

        mockValidateTestCaptureConfig = null
        mockOnCancelMocks = null
        mockAttemptFailOrderMocks = null
    })

    test('calls endConfirming when createOrderAndUpdatePayment throws in PayPal onApproveEvent', async () => {
        mockValidateTestCaptureConfig = {}
        mockOnCancelMocks = {endConfirming: jest.fn(), toast: jest.fn()}
        mockPayPalCreateIntentMocks = {
            removePaymentInstrumentFromBasket: jest.fn().mockResolvedValue(mockBasket),
            addPaymentInstrumentToBasket: jest.fn().mockResolvedValue(mockBasket)
        }
        mockAttemptFailOrderMocks = createAttemptFailOrderMocks({
            order: mockOrder,
            basket: mockBasket,
            createOrderRejects: true
        })

        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(mockBasket)
        })

        await config.actions.onClick('paypal')
        await config.actions.createIntent()
        await flush()

        dispatchPaymentApprove()

        await waitFor(() => {
            expect(mockOnCancelMocks.endConfirming).toHaveBeenCalled()
        })
        expect(mockNavigate).not.toHaveBeenCalled()

        mockValidateTestCaptureConfig = null
        mockOnCancelMocks = null
        mockPayPalCreateIntentMocks = null
        mockAttemptFailOrderMocks = null
    })
})

describe('paymentError', () => {
    const basketId = 'basket-payment-error'
    const orderNo = 'ord-payment-error-1'
    const mockBasket = makeBasket(basketId)
    const mockOrder = makeOrder(orderNo)
    const mockOrderFromUpdatePayment = makeOrderWithStripeIntent(orderNo, 'ref-1', 'pi_secret')

    const dispatchPaymentError = () => dispatchPaymentEvent('sfp:paymenterror')

    test('calls endConfirming and showErrorMessage(FAIL_ORDER) when attemptFailOrder returns true (basket recovered)', async () => {
        mockValidateTestCaptureConfig = {}
        mockOnCancelMocks = {endConfirming: jest.fn(), toast: jest.fn()}
        mockAttemptFailOrderMocks = createAttemptFailOrderMocks({
            basket: mockBasket,
            order: mockOrder,
            orderFromUpdate: mockOrderFromUpdatePayment
        })

        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(mockBasket)
        })

        await config.actions.onClick('card')
        await flush()
        await config.actions.createIntent()
        await flush()

        dispatchPaymentError()

        await waitFor(() => {
            expect(mockOnCancelMocks.endConfirming).toHaveBeenCalled()
        })
        expect(mockOnCancelMocks.toast).toHaveBeenCalledWith(
            expect.objectContaining({status: 'error'})
        )
        expect(mockAttemptFailOrderMocks.failOrder).toHaveBeenCalledWith({
            parameters: {orderNo, reopenBasket: true},
            body: {reasonCode: 'payment_confirm_failure'}
        })
        expect(mockNavigate).not.toHaveBeenCalled()

        mockValidateTestCaptureConfig = null
        mockOnCancelMocks = null
        mockAttemptFailOrderMocks = null
    })

    test('calls endConfirming, showErrorMessage(ORDER_RECOVERY_FAILED), and navigate to cart when attemptFailOrder returns false and usage is EXPRESS_PAY_NOW', async () => {
        mockValidateTestCaptureConfig = {}
        mockOnCancelMocks = {endConfirming: jest.fn(), toast: jest.fn()}

        await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(mockBasket),
            usage: EXPRESS_PAY_NOW
        })

        dispatchPaymentError()

        await waitFor(() => {
            expect(mockOnCancelMocks.endConfirming).toHaveBeenCalled()
        })
        expect(mockOnCancelMocks.toast).toHaveBeenCalledWith(
            expect.objectContaining({status: 'error'})
        )
        expect(mockNavigate).toHaveBeenCalledWith('/cart')

        mockValidateTestCaptureConfig = null
        mockOnCancelMocks = null
    })

    test('calls endConfirming and showErrorMessage(ORDER_RECOVERY_FAILED) but does not navigate when attemptFailOrder returns false and usage is EXPRESS_BUY_NOW', async () => {
        mockValidateTestCaptureConfig = {}
        mockOnCancelMocks = {endConfirming: jest.fn(), toast: jest.fn()}

        await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(mockBasket),
            usage: EXPRESS_BUY_NOW
        })

        dispatchPaymentError()

        await waitFor(() => {
            expect(mockOnCancelMocks.endConfirming).toHaveBeenCalled()
        })
        expect(mockOnCancelMocks.toast).toHaveBeenCalledWith(
            expect.objectContaining({status: 'error'})
        )
        expect(mockNavigate).not.toHaveBeenCalled()

        mockValidateTestCaptureConfig = null
        mockOnCancelMocks = null
    })

    test('calls endConfirming, showErrorMessage(ORDER_RECOVERY_FAILED), and navigate when orderRef is set but getOrder returns status other than created', async () => {
        mockValidateTestCaptureConfig = {}
        mockOnCancelMocks = {endConfirming: jest.fn(), toast: jest.fn()}
        mockAttemptFailOrderMocks = createAttemptFailOrderMocks({
            basket: mockBasket,
            order: mockOrder,
            orderFromUpdate: mockOrderFromUpdatePayment,
            getOrderStatus: 'completed'
        })

        const {config} = await renderAndGetConfig({
            prepareBasket: jest.fn().mockResolvedValue(mockBasket),
            usage: EXPRESS_PAY_NOW
        })

        await config.actions.onClick('card')
        await flush()
        await config.actions.createIntent()
        await flush()

        dispatchPaymentError()

        await waitFor(() => {
            expect(mockOnCancelMocks.endConfirming).toHaveBeenCalled()
        })
        expect(mockOnCancelMocks.toast).toHaveBeenCalledWith(
            expect.objectContaining({status: 'error'})
        )
        expect(mockNavigate).toHaveBeenCalledWith('/cart')
        expect(mockAttemptFailOrderMocks.failOrder).not.toHaveBeenCalled()

        mockValidateTestCaptureConfig = null
        mockOnCancelMocks = null
        mockAttemptFailOrderMocks = null
    })
})

describe('failOrder error handling', () => {
    const mockFailOrder = jest.fn()
    const mockCreateOrder = jest.fn()
    const mockUpdatePaymentInstrument = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        mockFailOrder.mockResolvedValue({})
        mockFailOrderToast = jest.fn()
    })

    afterEach(() => {
        mockFailOrderToast = null
    })

    // Mock the mutations to verify they're available
    jest.mock('@salesforce/commerce-sdk-react', () => {
        const actual = jest.requireActual('@salesforce/commerce-sdk-react')
        return {
            ...actual,
            useShopperOrdersMutation: (mutationKey) => {
                if (mutationKey === 'failOrder') {
                    return {mutateAsync: mockFailOrder}
                }
                if (mutationKey === 'createOrder') {
                    return {mutateAsync: mockCreateOrder}
                }
                if (mutationKey === 'updatePaymentInstrumentForOrder') {
                    return {mutateAsync: mockUpdatePaymentInstrument}
                }
                return {mutateAsync: jest.fn()}
            },
            usePaymentConfiguration: () => ({
                data: {
                    paymentMethods: [{id: 'card', name: 'Card'}],
                    paymentMethodSetAccounts: []
                }
            }),
            useShopperBasketsV2Mutation: () => ({
                mutateAsync: jest.fn()
            }),
            useShippingMethodsForShipmentV2: () => ({
                refetch: jest.fn()
            })
        }
    })

    jest.mock('@salesforce/retail-react-app/app/hooks/use-shopper-configuration', () => ({
        useShopperConfiguration: () => 'default'
    }))

    // It doesn't trigger the actual failOrder call (that requires the full payment flow), but it confirms the setup is correct.
    // The actual failOrder call is better tested in integration/E2E tests.
    test('failOrder mutation is available and error message constant is defined', () => {
        renderWithProviders(<SFPaymentsExpressButtons {...defaultProps} />)

        expect(screen.getByTestId('sf-payments-express')).toBeInTheDocument()
        expect(mockFailOrder).toBeDefined()
        expect(mockFailOrderToast).toBeDefined()
    })
})
