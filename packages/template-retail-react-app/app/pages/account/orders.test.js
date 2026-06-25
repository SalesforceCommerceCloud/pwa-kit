/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Route, Switch} from 'react-router-dom'
import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {rest} from 'msw'
import {
    renderWithProviders,
    createPathWithDefaults
} from '@salesforce/retail-react-app/app/utils/test-utils'
import {
    mockCustomerBaskets,
    mockOrderHistory,
    mockOrderProducts,
    mockStore,
    mockMultiShipmentOrder
} from '@salesforce/retail-react-app/app/mocks/mock-data'
import Orders from '@salesforce/retail-react-app/app/pages/account/orders'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

// `mockMutateAsync` backs the cancel flow (cancelOmsOrder); `mockReturnMutateAsync`
// backs the return flow (returnOmsOrder). The hook mock branches on the mutation
// name so a test can prove which endpoint was actually invoked instead of a single
// shared spy answering for every mutation.
const mockMutateAsync = jest.fn()
const mockReturnMutateAsync = jest.fn()
// Per-name isLoading control so the modal's `isSubmitting` can be exercised.
let mockReturnIsLoading = false
const mockOmsMetaDataReturnReasonCodes = [
    {reason: 'Wrong size', default: true},
    {reason: 'Defect', default: false},
    {reason: 'Changed my mind', default: false}
]
jest.mock('@salesforce/commerce-sdk-react', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...actual,
        useShopperOrdersMutation: (name) =>
            name === 'returnOmsOrder'
                ? {mutateAsync: mockReturnMutateAsync, isLoading: mockReturnIsLoading}
                : {mutateAsync: mockMutateAsync, isLoading: false},
        useOmsMetaData: () => ({
            data: {cancelReasonCodes: [], returnReasonCodes: mockOmsMetaDataReturnReasonCodes},
            isLoading: false
        }),
        useCustomerType: () => ({isRegistered: true, isGuest: false}),
        useCustomerId: () => 'testCustomerId'
    }
})

// Simple mock order for SOM integration tests
const createMockOrder = (overrides = {}) => ({
    orderNo: '00099999',
    orderTotal: 99.99,
    currency: 'USD',
    creationDate: '2025-01-15T10:00:00.000Z',
    status: 'open',
    productItems: [{productId: 'test-product-1', productName: 'Test Product', quantity: 1}],
    shipments: [
        {
            shippingMethod: {name: 'Ground'},
            shippingStatus: 'not_shipped',
            shippingAddress: {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Test St',
                city: 'Boston',
                stateCode: 'MA',
                postalCode: '02101'
            }
        }
    ],
    billingAddress: {
        firstName: 'Jane',
        lastName: 'Smith',
        address1: '456 Bill St',
        city: 'Boston',
        stateCode: 'MA',
        postalCode: '02101'
    },
    paymentInstruments: [
        {paymentCard: {cardType: 'Visa', numberLastDigits: '1111', holder: 'Jane Smith'}}
    ],
    ...overrides
})

// Mock OMS order (based on real API response structure)
const createMockOmsOrder = (overrides = {}) => ({
    orderNo: 'dec1625xxx00000601',
    orderTotal: 366.43,
    currency: 'USD',
    creationDate: '2026-01-14T01:43:00.000Z',
    // Note: No 'status' field - OMS orders use omsData.status
    omsData: {
        status: 'Created',
        shipments: [
            {
                id: '0OBLT0000000Nav4AE',
                status: 'Allocated',
                provider: 'UPS',
                trackingNumber: '123456789',
                trackingUrl: 'https://www.ups.com/track?loc=en_US&tracknum=123456789',
                expectedDeliveryDate: '2026-01-16T00:00:00.000Z'
            }
        ]
    },
    productItems: [
        {
            productId: '640188017003M',
            productName: 'Charcoal Flat Front Athletic Fit Shadow Striped Wool Suit',
            quantity: 1,
            omsData: {status: 'allocated', quantityAvailableToCancel: 0}
        }
    ],
    shipments: [
        {
            shipmentId: '0agLT00000Q4Sd3YAF',
            shippingMethod: {
                name: 'Ground',
                description: 'Order received within 7-10 business days'
            },
            // Note: OMS uses fullName instead of firstName/lastName
            shippingAddress: {
                fullName: 'Alex Johnson',
                address1: '2030 NE 8th st',
                city: 'Seattle',
                stateCode: 'WA',
                postalCode: '98121',
                countryCode: 'US'
            }
        }
    ],
    billingAddress: {
        fullName: 'Alex Johnson',
        address1: '2030 NE 8th st',
        city: 'Seattle',
        stateCode: 'WA',
        postalCode: '98121'
    },
    // Note: OMS orders may not have payment data
    paymentInstruments: [],
    ...overrides
})

const MockedComponent = () => {
    return (
        <Switch>
            <Route path={createPathWithDefaults('/account/orders')}>
                <Orders />
            </Route>
        </Switch>
    )
}

// Set up and clean up
beforeEach(() => {
    global.server.use(
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) =>
            res(ctx.delay(0), ctx.json(mockCustomerBaskets))
        )
    )

    window.history.pushState({}, 'Account', createPathWithDefaults('/account/orders'))
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
})

test('Renders order history and details', async () => {
    global.server.use(
        rest.get('*/orders/:orderNo', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockOrderHistory.data[0]))
        }),
        rest.get('*/customers/:customerId/orders', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockOrderHistory))
        }),
        rest.get('*/products', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockOrderProducts))
        })
    )
    const {user} = renderWithProviders(<MockedComponent history={history} />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })
    expect(await screen.findByTestId('account-order-history-page')).toBeInTheDocument()
    expect(await screen.findAllByText(/Ordered: /i)).toHaveLength(3)
    expect(
        await screen.findAllByAltText(
            'Pleated Bib Long Sleeve Shirt, Silver Grey, small',
            {},
            {timeout: 500}
        )
    ).toHaveLength(3)

    await user.click((await screen.findAllByText(/view details/i))[0])
    expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
    expect(await screen.findByText(/order number: 00028011/i)).toBeInTheDocument()
    expect(
        await screen.findByAltText(/Pleated Bib Long Sleeve Shirt, Silver Grey, small/i)
    ).toBeInTheDocument()
    expect(
        await screen.findByAltText(/Long Sleeve Crew Neck, Fire Red, small/i)
    ).toBeInTheDocument()
})

test('Renders order history place holder when no orders', async () => {
    global.server.use(
        rest.get('*/customers/:customerId/orders', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json({limit: 0, offset: 0, total: 0}))
        })
    )
    await renderWithProviders(<MockedComponent history={history} />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    expect(await screen.findByTestId('account-order-history-place-holder')).toBeInTheDocument()
})

describe('Order with empty product list', () => {
    let user
    beforeEach(async () => {
        const emptyProductOrder = {
            ...mockOrderHistory.data[0],
            productItems: []
        }
        const mockOrderHistoryWithEmptyProduct = {
            ...mockOrderHistory,
            data: [emptyProductOrder]
        }
        global.server.use(
            rest.get('*/orders/:orderNo', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(emptyProductOrder))
            }),
            rest.get('*/customers/:customerId/orders', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderHistoryWithEmptyProduct))
            })
        )
        const renderResult = renderWithProviders(<MockedComponent history={history} />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })
        user = renderResult.user
    })

    test('should render order history page', async () => {
        expect(await screen.findByTestId('account-order-history-page')).toBeInTheDocument()
    })

    test('should render order details page', async () => {
        await user.click((await screen.findAllByText(/view details/i))[0])
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
    })

    test('should show 0 items', async () => {
        await user.click((await screen.findAllByText(/view details/i))[0])
        expect(await screen.findByText(/0 items/i)).toBeInTheDocument()
    })

    test('should not render products', async () => {
        await user.click((await screen.findAllByText(/view details/i))[0])
        expect(screen.queryByAltText(/Pleated Bib Long Sleeve Shirt/i)).not.toBeInTheDocument()
    })
})

describe('Direct navigation to order details and back to order list', () => {
    let user, orderNo
    beforeEach(async () => {
        global.server.use(
            rest.get('*/orders/:orderNo', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderHistory.data[0]))
            }),
            rest.get('*/customers/:customerId/orders', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderHistory))
            }),
            rest.get('*/products', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderProducts))
            })
        )
        orderNo = mockOrderHistory.data[0].orderNo
        window.history.pushState(
            {},
            'Order Details',
            createPathWithDefaults(`/account/orders/${orderNo}`)
        )
        const renderResult = renderWithProviders(<MockedComponent history={history} />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })
        user = renderResult.user
    })

    test('should render order details page on direct navigation', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(window.location.pathname).toMatch(new RegExp(`/account/orders/${orderNo}$`))
    })

    test('should navigate back to order history page', async () => {
        await user.click(await screen.findByRole('link', {name: /back to order history/i}))
        expect(await screen.findByTestId('account-order-history-page')).toBeInTheDocument()
        expect(window.location.pathname).toMatch(/\/account\/orders$/)
    })

    test('should show all orders', async () => {
        await user.click(await screen.findByRole('link', {name: /back to order history/i}))
        expect(await screen.findAllByText(/Ordered: /i)).toHaveLength(3)
    })

    test('should show all products', async () => {
        await user.click(await screen.findByRole('link', {name: /back to order history/i}))
        expect(
            await screen.findAllByAltText(
                'Pleated Bib Long Sleeve Shirt, Silver Grey, small',
                {},
                {timeout: 500}
            )
        ).toHaveLength(3)
    })
})

describe('Handles order with missing or partial data gracefully', () => {
    let orderNo
    beforeEach(async () => {
        const partialOrder = {
            ...mockOrderHistory.data[0],
            billingAddress: undefined,
            shipments: undefined,
            paymentInstruments: undefined,
            creationDate: undefined
        }
        global.server.use(
            rest.get('*/orders/:orderNo', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(partialOrder))
            }),
            rest.get('*/customers/:customerId/orders', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json({...mockOrderHistory, data: [partialOrder]}))
            })
        )
        orderNo = partialOrder.orderNo
        window.history.pushState(
            {},
            'Order Details',
            createPathWithDefaults(`/account/orders/${orderNo}`)
        )
        renderWithProviders(<MockedComponent history={history} />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })
    })

    test('should render order details page', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
    })

    test('should show the Order Details header', async () => {
        expect(screen.getByRole('heading', {name: /order details/i})).toBeInTheDocument()
    })

    test('should not render billing, payment, or shipping sections', async () => {
        expect(screen.queryByText(/billing address/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/payment method/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/shipping address/i)).not.toBeInTheDocument()
    })
})

// Helper to setup order details page with mock order data
const setupOrderDetailsPage = (mockOrder) => {
    global.server.use(
        rest.get('*/orders/:orderNo', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockOrder))
        })
    )
    window.history.pushState(
        {},
        'Order Details',
        createPathWithDefaults(`/account/orders/${mockOrder.orderNo}`)
    )
    renderWithProviders(<MockedComponent history={history} />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })
}

describe('Order without payment data', () => {
    beforeEach(async () => {
        setupOrderDetailsPage(createMockOrder({paymentInstruments: []}))
    })

    test('should render order details page', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
    })

    test('should not display payment method section', async () => {
        await screen.findByTestId('account-order-details-page')
        expect(screen.queryByText(/payment method/i)).not.toBeInTheDocument()
    })
})

describe('Order detail error/fallback state (AC6)', () => {
    // Set up the detail route, but make the order fetch fail (HTTP 500). With the
    // global QueryClient retry disabled, useOrder reports isError immediately.
    const setupFailedOrderFetch = () => {
        global.server.use(
            rest.get('*/orders/:orderNo', (req, res, ctx) => res(ctx.delay(0), ctx.status(500)))
        )
        window.history.pushState(
            {},
            'Order Details',
            createPathWithDefaults('/account/orders/FAILED-ORDER')
        )
        renderWithProviders(<MockedComponent history={history} />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })
    }

    test('shows the full-card error (not a perpetual skeleton) when the order fetch fails', async () => {
        setupFailedOrderFetch()
        // The error card renders...
        expect(await screen.findByTestId('account-order-details-error')).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /Order Not Found/i})).toBeInTheDocument()
        // ...and the normal order-details page does NOT (no perpetual skeleton).
        expect(screen.queryByTestId('account-order-details-page')).not.toBeInTheDocument()
    })

    test('offers a path back to order history from the error card', async () => {
        setupFailedOrderFetch()
        const backLink = await screen.findByRole('link', {name: /Back to Order History/i})
        expect(backLink.getAttribute('href')).toMatch(/\/account\/orders$/)
    })

    test('does NOT show the error card for a successful order with no OMS data (ECOM fallback, not an error)', async () => {
        // 200 OK with no omsData (org not SOM-connected / order not ingested) is NOT an
        // error — the page should render normally via the ECOM fallback, never the card.
        setupOrderDetailsPage(createMockOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByTestId('account-order-details-error')).not.toBeInTheDocument()
        // ECOM fields still render (proves the fallback path, not the error path).
        expect(await screen.findByText(/John Doe/i)).toBeInTheDocument()
    })
})

describe('OMS/SOM Integration - Order Details', () => {
    // ECOM order tests - uses order.status, firstName/lastName, and has payment data
    test('should display ECOM order status from order.status', async () => {
        setupOrderDetailsPage(createMockOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText('open')).toBeInTheDocument()
    })

    test('should display firstName + lastName for ECOM shipping address', async () => {
        setupOrderDetailsPage(createMockOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/John Doe/i)).toBeInTheDocument()
    })

    test('should display payment method for ECOM order', async () => {
        setupOrderDetailsPage(createMockOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /payment method/i})).toBeInTheDocument()
    })

    test('should NOT display an expected delivery line for an ECOM-fallback order (AC3)', async () => {
        // ECOM orders have no omsData → no expectedDeliveryDate → the ETA line is omitted.
        setupOrderDetailsPage(createMockOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByText(/Expected delivery/i)).not.toBeInTheDocument()
    })

    // OMS order tests - uses omsData.status, fullName, and has no payment data
    test('should display OMS status from omsData.status', async () => {
        setupOrderDetailsPage(createMockOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText('Created')).toBeInTheDocument()
    })

    test('should display fullName for OMS shipping address', async () => {
        setupOrderDetailsPage(createMockOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/Alex Johnson/i)).toBeInTheDocument()
    })

    test('should NOT display payment method for OMS order', async () => {
        setupOrderDetailsPage(createMockOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByRole('heading', {name: /payment method/i})).not.toBeInTheDocument()
    })
})

describe('Return Items CTA (W-22821836 / W-22821837)', () => {
    // Eligibility is OMS-driven: the CTA renders when at least one productItem has
    // omsData.quantityAvailableToReturn > 0. OMS computes that field per item; the
    // server returns 409 if the order is no longer in a returnable state, so there
    // is no client-side status allowlist.
    const createReturnEligibleOmsOrder = (overrides = {}) =>
        createMockOmsOrder({
            // The return CTA gates on ownership: order.customerInfo.customerId
            // must match the current shopper's id. `useCustomerId` is mocked
            // at the top of this file to return `'testCustomerId'`.
            customerInfo: {customerId: 'testCustomerId'},
            productItems: [
                {
                    itemId: 'returnable-item-1',
                    productId: 'returnable-1',
                    productName: 'Returnable A',
                    quantity: 2,
                    omsData: {
                        status: 'fulfilled',
                        quantityAvailableToCancel: 0,
                        quantityAvailableToReturn: 2
                    }
                }
            ],
            ...overrides
        })

    test('renders the enabled Return Items CTA when an item has quantityAvailableToReturn > 0', async () => {
        setupOrderDetailsPage(createReturnEligibleOmsOrder())
        const cta = await screen.findByTestId('account-order-detail-start-return')
        expect(cta).toBeInTheDocument()
        expect(cta).toBeEnabled()
        // The label was renamed from "Start return" to "Return Items" in
        // W-22821837 to match the storefront-next designs; the underlying
        // message id stays stable so downstream extenders aren't broken.
        expect(cta).toHaveAccessibleName('Return Items')
    })

    test('renders the CTA disabled (with an SR reason) when no item has quantityAvailableToReturn > 0', async () => {
        // W-22821839: the button always renders for the order owner (mirroring the
        // always-rendered Cancel order button); having nothing to return disables
        // it via aria-disabled rather than hiding it, and exposes a hidden reason.
        setupOrderDetailsPage(
            createReturnEligibleOmsOrder({
                productItems: [
                    {
                        productId: 'no-return-1',
                        productName: 'Already Returned',
                        quantity: 1,
                        omsData: {status: 'returned', quantityAvailableToReturn: 0}
                    }
                ]
            })
        )
        const cta = await screen.findByTestId('account-order-detail-start-return')
        expect(cta).toBeInTheDocument()
        // aria-disabled (not native disabled) keeps it focusable so the SR hint is heard.
        expect(cta).toHaveAttribute('aria-disabled', 'true')
        expect(
            screen.getByText(/no items on this order are available to return/i)
        ).toBeInTheDocument()
    })

    test('clicking the disabled CTA does not open the modal', async () => {
        const user = userEvent.setup()
        setupOrderDetailsPage(
            createReturnEligibleOmsOrder({
                productItems: [
                    {
                        productId: 'no-return-1',
                        productName: 'Already Returned',
                        quantity: 1,
                        omsData: {status: 'returned', quantityAvailableToReturn: 0}
                    }
                ]
            })
        )
        const cta = await screen.findByTestId('account-order-detail-start-return')
        await user.click(cta)
        expect(screen.queryByText(/return items from order #/i)).not.toBeInTheDocument()
    })

    test('does NOT render the CTA for an ECOM-only order (no omsData envelope)', async () => {
        // createMockOrder produces a vanilla ECOM order with no omsData on the order
        // or items. Even with OMS enabled in config, no return CTA should render.
        setupOrderDetailsPage(createMockOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByTestId('account-order-detail-start-return')).not.toBeInTheDocument()
    })

    test('clicking Return Items opens the return-items modal (W-22821837)', async () => {
        const user = userEvent.setup()
        setupOrderDetailsPage(createReturnEligibleOmsOrder())
        const cta = await screen.findByTestId('account-order-detail-start-return')
        await user.click(cta)
        expect(await screen.findByText(/return items from order #/i)).toBeInTheDocument()
    })

    test('does NOT render the CTA when the order belongs to a different customer', async () => {
        // Defense-in-depth: even if useOrder somehow returned an order owned
        // by a different customer, the trigger must not render. Mirrors the
        // ownership guard already in place on the cancel-order CTA.
        setupOrderDetailsPage(
            createReturnEligibleOmsOrder({
                customerInfo: {customerId: 'someone-else'}
            })
        )
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByTestId('account-order-detail-start-return')).not.toBeInTheDocument()
    })
})

describe('Return submission (W-22821838)', () => {
    const createReturnEligibleOmsOrder = (overrides = {}) =>
        createMockOmsOrder({
            customerInfo: {customerId: 'testCustomerId'},
            productItems: [
                {
                    itemId: 'returnable-item-1',
                    productId: 'returnable-1',
                    productName: 'Returnable A',
                    quantity: 2,
                    omsData: {
                        status: 'fulfilled',
                        quantityAvailableToCancel: 0,
                        quantityAvailableToReturn: 2
                    }
                }
            ],
            ...overrides
        })

    // Walk the modal from the trigger through select → review.
    const openModalAndReview = async (user) => {
        await user.click(await screen.findByTestId('account-order-detail-start-return'))
        await screen.findByText(/return items from order #/i)
        await user.click(screen.getAllByRole('checkbox')[0])
        await user.click(screen.getByTestId('return-items-modal-review'))
        return screen.findByTestId('return-items-modal-submit')
    }

    beforeEach(() => {
        mockReturnMutateAsync.mockReset()
        mockReturnIsLoading = false
    })
    afterEach(() => {
        mockReturnIsLoading = false
    })

    test('Submit invokes returnOmsOrder (not cancel) with the orderNo + productItems body', async () => {
        mockReturnMutateAsync.mockResolvedValueOnce({})
        const order = createReturnEligibleOmsOrder()
        setupOrderDetailsPage(order)
        const user = userEvent.setup()

        const submit = await openModalAndReview(user)
        await user.click(submit)

        await waitFor(() => expect(mockReturnMutateAsync).toHaveBeenCalledTimes(1))
        expect(mockReturnMutateAsync).toHaveBeenCalledWith({
            parameters: {orderNo: order.orderNo},
            body: {productItems: [{itemId: 'returnable-item-1', quantity: 1}]}
        })
        // The cancel mutation must NOT have fired.
        expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    test('success closes the modal and shows the return-submitted feedback', async () => {
        mockReturnMutateAsync.mockResolvedValueOnce({})
        setupOrderDetailsPage(createReturnEligibleOmsOrder())
        const user = userEvent.setup()

        const submit = await openModalAndReview(user)
        await user.click(submit)

        // The success alert is announced (after the 300ms a11y delay).
        expect(await screen.findByText(/return submitted/i)).toBeInTheDocument()
        // Modal is gone.
        await waitFor(() =>
            expect(screen.queryByText(/review your return/i)).not.toBeInTheDocument()
        )
        // A return success must NOT flip the order status Badge to "Cancelled".
        expect(screen.queryByText(/^cancelled$/i)).not.toBeInTheDocument()
    })

    test('success returns focus to the Order Details heading', async () => {
        mockReturnMutateAsync.mockResolvedValueOnce({})
        setupOrderDetailsPage(createReturnEligibleOmsOrder())
        const user = userEvent.setup()

        const submit = await openModalAndReview(user)
        await user.click(submit)

        await screen.findByText(/return submitted/i)
        const heading = screen.getByRole('heading', {level: 1, name: /order details/i})
        await waitFor(() => expect(heading).toHaveFocus())
    })

    test('error keeps the modal open with an inline alert + Retry that re-fires', async () => {
        mockReturnMutateAsync.mockRejectedValueOnce({response: {status: 500}})
        setupOrderDetailsPage(createReturnEligibleOmsOrder())
        const user = userEvent.setup()

        const submit = await openModalAndReview(user)
        await user.click(submit)

        // Inline error surfaces and the review view stays mounted.
        expect(await screen.findByTestId('return-items-modal-submit-error')).toBeInTheDocument()
        expect(screen.getByText(/review your return/i)).toBeInTheDocument()

        // Retry re-invokes the mutation.
        mockReturnMutateAsync.mockResolvedValueOnce({})
        await user.click(screen.getByTestId('return-items-modal-submit-retry'))
        await waitFor(() => expect(mockReturnMutateAsync).toHaveBeenCalledTimes(2))
    })

    test.each([404, 409])(
        'a terminal %i keeps the modal open and shows an in-modal terminal banner (no page banner)',
        async (status) => {
            mockReturnMutateAsync.mockRejectedValueOnce({response: {status}})
            setupOrderDetailsPage(createReturnEligibleOmsOrder())
            const user = userEvent.setup()

            const submit = await openModalAndReview(user)
            await user.click(submit)

            // The terminal banner renders INSIDE the still-open modal (review view) ...
            expect(
                await screen.findByTestId('return-items-modal-terminal-error')
            ).toBeInTheDocument()
            expect(screen.getByText(/review your return/i)).toBeInTheDocument()
            // ... with no inline Retry (resubmitting the same payload can't succeed) ...
            expect(screen.queryByTestId('return-items-modal-submit-retry')).not.toBeInTheDocument()
            // ... and Submit is disabled, leaving the recovery link as the only path.
            expect(screen.getByTestId('return-items-modal-submit')).toBeDisabled()
            // The order-detail page behind the modal is NOT mutated: the Return Items
            // trigger stays enabled and no page-level terminal hint appears.
            expect(screen.getByTestId('account-order-detail-start-return')).toHaveAttribute(
                'aria-disabled',
                'false'
            )
            expect(
                screen.queryByText(/this order can no longer be returned/i)
            ).not.toBeInTheDocument()
        }
    )
})

describe('Item-level return error states (W-22821839)', () => {
    const createReturnEligibleOmsOrder = (overrides = {}) =>
        createMockOmsOrder({
            customerInfo: {customerId: 'testCustomerId'},
            productItems: [
                {
                    itemId: 'returnable-item-1',
                    productId: 'returnable-1',
                    productName: 'Returnable A',
                    quantity: 2,
                    omsData: {
                        status: 'fulfilled',
                        quantityAvailableToCancel: 0,
                        quantityAvailableToReturn: 2
                    }
                }
            ],
            ...overrides
        })

    // Build a rejection whose response body carries the 400 errorCode discriminator,
    // mirroring the SCAPI shape the classifier reads (response.status + response.json()).
    const rejectWith = ({status, body}) => {
        let bodyUsed = false
        mockReturnMutateAsync.mockRejectedValueOnce({
            response: {
                status,
                get bodyUsed() {
                    return bodyUsed
                },
                json: async () => {
                    bodyUsed = true
                    return body
                }
            }
        })
    }

    const openModalAndReview = async (user) => {
        await user.click(await screen.findByTestId('account-order-detail-start-return'))
        await screen.findByText(/return items from order #/i)
        await user.click(screen.getAllByRole('checkbox')[0])
        await user.click(screen.getByTestId('return-items-modal-review'))
        return screen.findByTestId('return-items-modal-submit')
    }

    beforeEach(() => {
        mockReturnMutateAsync.mockReset()
        mockReturnIsLoading = false
    })

    test('a 400 QuantityExceeded keeps the modal open and drops to the select view with an affected-items banner', async () => {
        rejectWith({
            status: 400,
            body: {
                errorCode: 'ReturnQuantityExceeded',
                productItems: [{itemId: 'returnable-item-1'}]
            }
        })
        setupOrderDetailsPage(createReturnEligibleOmsOrder())
        const user = userEvent.setup()

        const submit = await openModalAndReview(user)
        await user.click(submit)

        // Modal stays open and falls back to the select view with the banner.
        const banner = await screen.findByTestId('return-items-modal-select-error')
        expect(banner).toBeInTheDocument()
        // The affected item is named in the banner copy.
        expect(banner).toHaveTextContent(/Returnable A/i)
        // Still on the select view (item checkboxes visible), not the terminal banner.
        expect(screen.queryByText(/unable to submit return/i)).not.toBeInTheDocument()
    })

    test('prunes a checked row that is no longer returnable after the post-error refetch', async () => {
        // quantityExceeded keeps the modal open and refetches the order. If the
        // refetched order no longer lists the item as returnable, the now-hidden
        // checked row must be dropped from the selection — otherwise it would keep
        // the selection invalid with no on-screen control to fix it.
        rejectWith({
            status: 400,
            body: {
                errorCode: 'ReturnQuantityExceeded',
                productItems: [{itemId: 'returnable-item-1'}]
            }
        })
        const returnable = createReturnEligibleOmsOrder()
        // Second GET (the refetch) returns the same order with nothing returnable.
        const exhausted = createReturnEligibleOmsOrder({
            productItems: [
                {
                    itemId: 'returnable-item-1',
                    productId: 'returnable-1',
                    productName: 'Returnable A',
                    quantity: 2,
                    omsData: {status: 'returned', quantityAvailableToReturn: 0}
                }
            ]
        })
        let call = 0
        global.server.use(
            rest.get('*/orders/:orderNo', (req, res, ctx) => {
                call += 1
                return res(ctx.delay(0), ctx.json(call === 1 ? returnable : exhausted))
            })
        )
        window.history.pushState(
            {},
            'Order Details',
            createPathWithDefaults(`/account/orders/${returnable.orderNo}`)
        )
        renderWithProviders(<MockedComponent history={history} />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })
        const user = userEvent.setup()

        const submit = await openModalAndReview(user)
        await user.click(submit)

        // The banner drops us to the select view; after the refetch the row for the
        // now-exhausted item is gone, leaving no returnable item rows in the modal.
        await screen.findByTestId('return-items-modal-select-error')
        await waitFor(() =>
            expect(screen.queryAllByTestId('return-items-modal-item-row')).toHaveLength(0)
        )
        // With nothing selectable, Review stays disabled.
        expect(screen.getByTestId('return-items-modal-review')).toHaveAttribute(
            'aria-disabled',
            'true'
        )
    })

    test('a 400 InvalidReasonCode keeps the modal open with the invalid-reason banner', async () => {
        rejectWith({status: 400, body: {errorCode: 'InvalidReasonCode'}})
        setupOrderDetailsPage(createReturnEligibleOmsOrder())
        const user = userEvent.setup()

        const submit = await openModalAndReview(user)
        await user.click(submit)

        expect(await screen.findByTestId('return-items-modal-select-error')).toHaveTextContent(
            /reason is no longer available/i
        )
    })

    test('a network error (no response) keeps the modal open with an inline retry', async () => {
        mockReturnMutateAsync.mockRejectedValueOnce(new TypeError('Failed to fetch'))
        setupOrderDetailsPage(createReturnEligibleOmsOrder())
        const user = userEvent.setup()

        const submit = await openModalAndReview(user)
        await user.click(submit)

        // Inline error on the review view (retry available), not the terminal banner.
        expect(await screen.findByTestId('return-items-modal-submit-error')).toHaveTextContent(
            /try again in a few minutes/i
        )
        expect(screen.getByText(/review your return/i)).toBeInTheDocument()
    })

    test('a terminal 404 surfaces an in-modal "back to order history" recovery link', async () => {
        rejectWith({status: 404, body: {}})
        setupOrderDetailsPage(createReturnEligibleOmsOrder())
        const user = userEvent.setup()

        const submit = await openModalAndReview(user)
        await user.click(submit)

        const banner = await screen.findByTestId('return-items-modal-terminal-error')
        expect(banner).toHaveTextContent(/we could not find this order/i)
        const link = await screen.findByTestId('return-items-modal-terminal-link')
        expect(link).toHaveTextContent(/back to order history/i)
    })

    test('a terminal 409 surfaces an in-modal "contact support" recovery link', async () => {
        rejectWith({status: 409, body: {}})
        setupOrderDetailsPage(createReturnEligibleOmsOrder())
        const user = userEvent.setup()

        const submit = await openModalAndReview(user)
        await user.click(submit)

        const banner = await screen.findByTestId('return-items-modal-terminal-error')
        expect(banner).toHaveTextContent(/can't be returned at this time/i)
        const link = await screen.findByTestId('return-items-modal-terminal-link')
        expect(link).toHaveTextContent(/contact support/i)
    })

    test('restores an in-progress return from a returnDraft URL param on mount (case 1 token-refresh survival)', async () => {
        const order = createReturnEligibleOmsOrder()
        global.server.use(
            rest.get('*/orders/:orderNo', (req, res, ctx) => res(ctx.delay(0), ctx.json(order)))
        )
        const draft = encodeURIComponent(
            JSON.stringify([{i: 'returnable-item-1', q: 1, r: 'Wrong size'}])
        )
        window.history.pushState(
            {},
            'Order Details',
            createPathWithDefaults(`/account/orders/${order.orderNo}?returnDraft=${draft}`)
        )
        renderWithProviders(<MockedComponent history={history} />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })

        // The modal auto-opens with the restored selection.
        expect(await screen.findByText(/return items from order #/i)).toBeInTheDocument()
        await waitFor(() => expect(screen.getAllByRole('checkbox')[0]).toBeChecked())
    })
})

describe('OMS/SOM Integration - Order History', () => {
    // Helper to setup order history with mock data
    const setupOrderHistoryMock = (orderData) => {
        global.server.use(
            rest.get('*/customers/:customerId/orders', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.json({limit: 10, offset: 0, total: 1, data: [orderData]})
                )
            }),
            rest.get('*/products', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderProducts))
            })
        )
    }

    // ECOM order tests - uses order.status and firstName/lastName
    test('should display ECOM order status from order.status', async () => {
        setupOrderHistoryMock(createMockOrder())
        renderWithProviders(<MockedComponent history={history} />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })
        expect(await screen.findByTestId('account-order-history-page')).toBeInTheDocument()
        expect(await screen.findByText('open')).toBeInTheDocument()
    })

    test('should display firstName + lastName for ECOM shipping address', async () => {
        setupOrderHistoryMock(createMockOrder())
        renderWithProviders(<MockedComponent history={history} />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })
        expect(await screen.findByTestId('account-order-history-page')).toBeInTheDocument()
        expect(await screen.findByText(/Shipped to: John Doe/i)).toBeInTheDocument()
    })

    // OMS order tests - uses omsData.status and fullName
    test('should display OMS status from omsData.status', async () => {
        setupOrderHistoryMock(createMockOmsOrder())
        renderWithProviders(<MockedComponent history={history} />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })
        expect(await screen.findByTestId('account-order-history-page')).toBeInTheDocument()
        expect(await screen.findByText('Created')).toBeInTheDocument()
    })

    test('should display fullName for OMS shipping address', async () => {
        setupOrderHistoryMock(createMockOmsOrder())
        renderWithProviders(<MockedComponent history={history} />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })
        expect(await screen.findByTestId('account-order-history-page')).toBeInTheDocument()
        expect(await screen.findByText(/Shipped to: Alex Johnson/i)).toBeInTheDocument()
    })
})

describe('Order with multiple shipments (pickup and delivery)', () => {
    let orderNo

    beforeEach(async () => {
        global.server.use(
            rest.get('*/orders/:orderNo', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockMultiShipmentOrder))
            }),
            rest.get('*/customers/:customerId/orders', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.json({...mockOrderHistory, data: [mockMultiShipmentOrder]})
                )
            }),
            rest.get('*/products', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockOrderProducts))
            }),
            rest.get('*/stores', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockStore))
            })
        )

        orderNo = mockMultiShipmentOrder.orderNo
        window.history.pushState(
            {},
            'Order Details',
            createPathWithDefaults(`/account/orders/${orderNo}`)
        )
        renderWithProviders(<MockedComponent history={history} />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })
    })

    test('should render order details page with multiple shipments', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
    })

    test('should display pickup address section', async () => {
        expect(await screen.findByRole('heading', {name: /pickup address/i})).toBeInTheDocument()
        expect(await screen.findByText(/Downtown Store/i)).toBeInTheDocument()
    })

    test('should display shipping method and address sections', async () => {
        expect(await screen.findByRole('heading', {name: /^shipping method$/i})).toBeInTheDocument()
        expect(
            await screen.findByRole('heading', {name: /^shipping address$/i})
        ).toBeInTheDocument()
    })

    test('should display delivery address details', async () => {
        expect(await screen.findByText(/John Doe/i)).toBeInTheDocument()
        expect(await screen.findByText(/123 Main St/i)).toBeInTheDocument()
        expect(await screen.findByText(/Boston/i)).toBeInTheDocument()
    })

    test('should display shipping method name', async () => {
        expect(await screen.findByText(/Ground/i)).toBeInTheDocument()
    })

    test('should display tracking number', async () => {
        expect(await screen.findByText(/TRACK123456/i)).toBeInTheDocument()
    })

    test('should display both payment method and billing address', async () => {
        expect(await screen.findByRole('heading', {name: /payment method/i})).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /billing address/i})).toBeInTheDocument()
    })
})

describe('OMS Multi-shipment - Shipping address hidden', () => {
    // When OMS has multiple shipments, shipping address should be hidden
    // (can't reliably correlate OMS shipments to ECOM addresses by index)
    const omsMultiShipmentOrder = createMockOmsOrder({
        shipments: [
            {
                shippingMethod: {name: 'Ground'},
                shippingAddress: {
                    fullName: 'Alice Johnson',
                    address1: '123 First St',
                    city: 'Seattle',
                    stateCode: 'WA',
                    postalCode: '98101'
                }
            },
            {
                shippingMethod: {name: 'Express'},
                shippingAddress: {
                    fullName: 'Bob Smith',
                    address1: '456 Second St',
                    city: 'Portland',
                    stateCode: 'OR',
                    postalCode: '97201'
                }
            }
        ],
        omsData: {
            status: 'Processing',
            shipments: [
                {
                    status: 'SHIPPED',
                    trackingNumber: 'OMS-001',
                    trackingUrl: 'https://track.example.com/OMS-001',
                    provider: 'FedEx',
                    expectedDeliveryDate: '2026-06-12T00:00:00.000Z'
                },
                {
                    status: 'PENDING',
                    trackingNumber: 'OMS-002',
                    trackingUrl: 'https://track.example.com/OMS-002',
                    provider: 'UPS',
                    expectedDeliveryDate: '2026-07-20T00:00:00.000Z'
                }
            ]
        }
    })

    beforeEach(async () => {
        setupOrderDetailsPage(omsMultiShipmentOrder)
    })

    test('should render order details page', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
    })

    test('should display numbered shipping method headings', async () => {
        expect(await screen.findByRole('heading', {name: /shipping method 1/i})).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /shipping method 2/i})).toBeInTheDocument()
    })

    test('should NOT display shipping address headings for OMS multi-shipment', async () => {
        await screen.findByTestId('account-order-details-page')
        expect(screen.queryByRole('heading', {name: /shipping address/i})).not.toBeInTheDocument()
    })

    test('should display OMS provider name instead of ECOM shipping method', async () => {
        expect(await screen.findByText(/FedEx/i)).toBeInTheDocument()
        expect(await screen.findByText(/UPS/i)).toBeInTheDocument()
    })

    test('should display OMS shipment status', async () => {
        expect(await screen.findByText(/SHIPPED/i)).toBeInTheDocument()
        expect(await screen.findByText(/PENDING/i)).toBeInTheDocument()
    })

    test('should display tracking numbers as clickable links', async () => {
        const trackingLink1 = await screen.findByRole('link', {name: /OMS-001/i})
        expect(trackingLink1).toHaveAttribute('href', 'https://track.example.com/OMS-001')

        const trackingLink2 = await screen.findByRole('link', {name: /OMS-002/i})
        expect(trackingLink2).toHaveAttribute('href', 'https://track.example.com/OMS-002')
    })

    test('should display the expected delivery date per shipment (AC3, OMS-multi call site)', async () => {
        // Exercises the OMS-multi call site: each shipment renders its own ETA line.
        // findAllByText waits for the async order render to resolve.
        const etaLabels = await screen.findAllByText(/Expected delivery/i)
        expect(etaLabels).toHaveLength(2)
        expect(etaLabels[0].closest('p')).toHaveTextContent(/Expected delivery:.*2026/)
        expect(etaLabels[1].closest('p')).toHaveTextContent(/Expected delivery:.*2026/)
    })
})

describe('ECOM Multi-shipment - Shipping address shown', () => {
    // When ECOM has multiple shipments but NO OMS data, shipping address should be shown
    const ecomMultiShipmentOrder = createMockOrder({
        shipments: [
            {
                shippingMethod: {name: 'Ground'},
                shippingStatus: 'shipped',
                trackingNumber: 'ECOM-001',
                shippingAddress: {
                    firstName: 'John',
                    lastName: 'Doe',
                    address1: '123 First St',
                    city: 'Boston',
                    stateCode: 'MA',
                    postalCode: '02101'
                }
            },
            {
                shippingMethod: {name: 'Express'},
                shippingStatus: 'not_shipped',
                shippingAddress: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    address1: '456 Second St',
                    city: 'Chicago',
                    stateCode: 'IL',
                    postalCode: '60601'
                }
            }
        ]
    })

    beforeEach(async () => {
        setupOrderDetailsPage(ecomMultiShipmentOrder)
    })

    test('should render order details page', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
    })

    test('should display numbered shipping method headings', async () => {
        expect(await screen.findByRole('heading', {name: /shipping method 1/i})).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /shipping method 2/i})).toBeInTheDocument()
    })

    test('should display numbered shipping address headings for ECOM multi-shipment', async () => {
        expect(
            await screen.findByRole('heading', {name: /shipping address 1/i})
        ).toBeInTheDocument()
        expect(
            await screen.findByRole('heading', {name: /shipping address 2/i})
        ).toBeInTheDocument()
    })

    test('should display both shipping addresses', async () => {
        expect(await screen.findByText(/John Doe/i)).toBeInTheDocument()
        // Jane Smith appears in both shipping and billing address
        const janeSmithElements = await screen.findAllByText(/Jane Smith/i)
        expect(janeSmithElements).toHaveLength(2)
    })

    test('should display ECOM shipping statuses', async () => {
        // Use exact match to avoid "Not shipped" matching "Shipped"
        expect(await screen.findByText('Shipped')).toBeInTheDocument()
        expect(await screen.findByText('Not shipped')).toBeInTheDocument()
    })
})

describe('OMS Single shipment with tracking URL', () => {
    // Single OMS shipment should show shipping address and tracking as clickable link
    const omsSingleShipmentOrder = createMockOmsOrder({
        shipments: [
            {
                shippingMethod: {name: 'Standard'},
                shippingAddress: {
                    fullName: 'Alex Johnson',
                    address1: '789 Main St',
                    city: 'Seattle',
                    stateCode: 'WA',
                    postalCode: '98101'
                }
            }
        ],
        omsData: {
            status: 'SHIPPED',
            shipments: [
                {
                    status: 'DELIVERED',
                    trackingNumber: 'TRACK-12345',
                    trackingUrl: 'https://tracking.fedex.com/TRACK-12345',
                    provider: 'FedEx Ground',
                    expectedDeliveryDate: '2026-06-12T00:00:00.000Z'
                }
            ]
        }
    })

    beforeEach(async () => {
        setupOrderDetailsPage(omsSingleShipmentOrder)
    })

    test('should display shipping address for single OMS shipment', async () => {
        expect(
            await screen.findByRole('heading', {name: /^shipping address$/i})
        ).toBeInTheDocument()
        expect(await screen.findByText(/Alex Johnson/i)).toBeInTheDocument()
    })

    test('should display OMS provider instead of ECOM method name', async () => {
        expect(await screen.findByText(/FedEx Ground/i)).toBeInTheDocument()
    })

    test('should display tracking number as clickable link', async () => {
        const trackingLink = await screen.findByRole('link', {name: /TRACK-12345/i})
        expect(trackingLink).toHaveAttribute('href', 'https://tracking.fedex.com/TRACK-12345')
    })

    test('should display OMS shipment status (fallback to raw value)', async () => {
        expect(await screen.findByText(/DELIVERED/i)).toBeInTheDocument()
    })

    test('should display the expected delivery date from OMS data (AC3, page call site)', async () => {
        // Verifies the ETA renders at the real delivery call site, not just in the
        // isolated component test. The label and the formatted date share one line;
        // scope the date assertion to that line so it doesn't collide with the
        // order's creation date elsewhere on the page.
        const etaLabel = await screen.findByText(/Expected delivery/i)
        expect(etaLabel).toBeInTheDocument()
        // The <Text> line reads "Expected delivery: <formatted date>" and includes the year.
        expect(etaLabel.closest('p')).toHaveTextContent(/Expected delivery:.*2026/)
    })
})

describe('OMS Single shipment with partial data (missing provider, trackingUrl)', () => {
    // Tests fallback behavior when OMS data is partially available
    const omsPartialDataOrder = createMockOmsOrder({
        shipments: [
            {
                shippingMethod: {name: 'Ground Shipping'},
                shippingAddress: {
                    fullName: 'Mike Brown',
                    address1: '100 Oak St',
                    city: 'Denver',
                    stateCode: 'CO',
                    postalCode: '80201'
                }
            }
        ],
        omsData: {
            status: 'Processing',
            shipments: [
                {
                    status: 'ALLOCATED',
                    trackingNumber: 'OMS-TRACK-999'
                    // No provider field
                    // No trackingUrl - tracking number displayed as plain text
                }
            ]
        }
    })

    beforeEach(async () => {
        setupOrderDetailsPage(omsPartialDataOrder)
    })

    test('should render order details page', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
    })

    test('should fallback to ECOM shipping method name when OMS provider is missing', async () => {
        expect(await screen.findByText(/Ground Shipping/i)).toBeInTheDocument()
    })

    test('should display OMS status even when other OMS fields are missing', async () => {
        expect(await screen.findByText(/ALLOCATED/i)).toBeInTheDocument()
    })

    test('should display OMS tracking number (takes priority over ECOM)', async () => {
        expect(await screen.findByText(/OMS-TRACK-999/i)).toBeInTheDocument()
        // ECOM tracking should NOT be displayed
        expect(screen.queryByText(/ECOM-TRACK-999/i)).not.toBeInTheDocument()
    })

    test('should display tracking number as plain text when trackingUrl is missing', async () => {
        // Should NOT be a link
        expect(screen.queryByRole('link', {name: /OMS-TRACK-999/i})).not.toBeInTheDocument()
        // But should still show the tracking number as text
        expect(await screen.findByText(/OMS-TRACK-999/i)).toBeInTheDocument()
    })

    test('should display shipping address with fullName', async () => {
        expect(await screen.findByText(/Mike Brown/i)).toBeInTheDocument()
        expect(await screen.findByText(/100 Oak St/i)).toBeInTheDocument()
    })
})

describe('BOPIS Order with OMS Single Pickup and Single Delivery', () => {
    // Helper to create BOPIS order with OMS data
    const createBopisOmsOrder = (overrides = {}) => ({
        orderNo: 'BOPIS-OMS-001',
        currency: 'USD',
        productItems: [{productId: 'product-1', quantity: 1}],
        omsData: {
            status: 'Processing',
            shipments: [
                {
                    status: 'SHIPPED',
                    provider: 'FedEx',
                    trackingNumber: 'BOPIS-TRACK-123',
                    trackingUrl: 'https://tracking.fedex.com/BOPIS-TRACK-123'
                }
            ]
        },
        shipments: [
            {
                shipmentId: 'pickup1',
                shippingMethod: {
                    c_storePickupEnabled: true
                },
                c_fromStoreId: '00001'
            },
            {
                shipmentId: 'delivery1',
                shippingMethod: {
                    name: 'Ground'
                },
                shippingAddress: {
                    fullName: 'Sarah Johnson',
                    address1: '456 Delivery St',
                    city: 'Seattle',
                    stateCode: 'WA',
                    postalCode: '98101'
                }
            }
        ],
        billingAddress: {
            firstName: 'Sarah',
            lastName: 'Johnson',
            address1: '456 Delivery St',
            city: 'Seattle',
            stateCode: 'WA',
            postalCode: '98101'
        },
        paymentInstruments: [],
        ...overrides
    })

    test('should display OMS status for BOPIS order', async () => {
        setupOrderDetailsPage(createBopisOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText('Processing')).toBeInTheDocument()
    })

    test('should display pickup address section for BOPIS order', async () => {
        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockStore))
            })
        )
        setupOrderDetailsPage(createBopisOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /pickup address/i})).toBeInTheDocument()
        expect(await screen.findByText('Pickup Address')).toBeInTheDocument()
    })

    test('should display pickup address details (store name, address, phone)', async () => {
        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockStore))
            })
        )
        setupOrderDetailsPage(createBopisOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText('Pickup Address')).toBeInTheDocument()
        expect(await screen.findByText(/Downtown Store/i)).toBeInTheDocument()
        expect(await screen.findByText(/100 Market St/i)).toBeInTheDocument()
        expect(await screen.findByText(/San Francisco, CA 94105/i)).toBeInTheDocument()
        expect(await screen.findByText(/Phone: \(415\) 555-0001/i)).toBeInTheDocument()
    })

    test('should display OMS provider for delivery shipment in BOPIS order', async () => {
        setupOrderDetailsPage(createBopisOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /^shipping method$/i})).toBeInTheDocument()
        expect(await screen.findByText('Shipping Method')).toBeInTheDocument()
        expect(await screen.findByText(/FedEx/i)).toBeInTheDocument()
        expect(screen.queryByText(/Ground/i)).not.toBeInTheDocument()
        const trackingLink = await screen.findByRole('link', {name: /BOPIS-TRACK-123/i})
        expect(trackingLink).toHaveAttribute('href', 'https://tracking.fedex.com/BOPIS-TRACK-123')
        expect(await screen.findByText(/SHIPPED/i)).toBeInTheDocument()
    })

    test('should NOT display shipping address for BOPIS OMS order with multiple shipments', async () => {
        setupOrderDetailsPage(createBopisOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        // Shipping address should be hidden for OMS multi-shipment orders
        // (can't reliably correlate OMS shipments to ECOM addresses by index)
        expect(screen.queryByRole('heading', {name: /^shipping address$/i})).not.toBeInTheDocument()
        expect(screen.queryByText(/Sarah Johnson/i)).not.toBeInTheDocument()
    })

    test('should NOT display payment method for BOPIS OMS order', async () => {
        setupOrderDetailsPage(createBopisOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByRole('heading', {name: /payment method/i})).not.toBeInTheDocument()
    })
})

describe('BOPIS Order with OMS - Single Pickup Only', () => {
    // OMS BOPIS order with only pickup shipment, no delivery
    const createOmsBopisPickupOnly = () => ({
        orderNo: 'OMS-BOPIS-PICKUP-001',
        currency: 'USD',
        productItems: [{productId: 'product-1', quantity: 1}],
        omsData: {
            status: 'Ready for Pickup',
            shipments: [
                {
                    status: 'READY_FOR_PICKUP',
                    provider: 'Store Pickup',
                    trackingNumber: 'PICKUP-12345',
                    trackingUrl: 'https://tracking.example.com/PICKUP-12345'
                }
            ]
        },
        shipments: [
            {
                shipmentId: 'pickup1',
                shippingMethod: {
                    c_storePickupEnabled: true
                },
                c_fromStoreId: '00001'
            }
        ],
        billingAddress: {
            firstName: 'Alex',
            lastName: 'Johnson',
            address1: '2030 NE 8th st',
            city: 'Seattle',
            stateCode: 'WA',
            postalCode: '98121'
        },
        paymentInstruments: []
    })

    test('should display OMS status for pickup-only BOPIS order', async () => {
        setupOrderDetailsPage(createOmsBopisPickupOnly())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/Ready for Pickup/i)).toBeInTheDocument()
    })

    test('should display pickup address section', async () => {
        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockStore))
            })
        )
        setupOrderDetailsPage(createOmsBopisPickupOnly())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /pickup address/i})).toBeInTheDocument()
        expect(await screen.findByText('Pickup Address')).toBeInTheDocument()
    })

    test('should display pickup address details for OMS pickup-only order', async () => {
        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockStore))
            })
        )
        setupOrderDetailsPage(createOmsBopisPickupOnly())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText('Pickup Address')).toBeInTheDocument()
        expect(await screen.findByText(/Downtown Store/i)).toBeInTheDocument()
        expect(await screen.findByText(/100 Market St/i)).toBeInTheDocument()
    })

    test('should NOT display payment method for OMS pickup-only order', async () => {
        setupOrderDetailsPage(createOmsBopisPickupOnly())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByRole('heading', {name: /payment method/i})).not.toBeInTheDocument()
    })

    test('should NOT display shipping method section (pickup only)', async () => {
        setupOrderDetailsPage(createOmsBopisPickupOnly())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByRole('heading', {name: /shipping method/i})).not.toBeInTheDocument()
    })

    test('should NOT display shipping address section (pickup only)', async () => {
        setupOrderDetailsPage(createOmsBopisPickupOnly())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByRole('heading', {name: /shipping address/i})).not.toBeInTheDocument()
    })

    test('should display billing address', async () => {
        setupOrderDetailsPage(createOmsBopisPickupOnly())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /billing address/i})).toBeInTheDocument()
        expect(await screen.findByText(/Alex Johnson/i)).toBeInTheDocument()
    })
})

describe('BOPIS Order with OMS - Multiple Pickup Locations', () => {
    // BOPIS order with multiple pickup locations and OMS data
    const createMultiPickupBopisOmsOrder = () => ({
        orderNo: 'BOPIS-MULTI-001',
        currency: 'USD',
        productItems: [{productId: 'product-1', quantity: 1}],
        omsData: {
            status: 'Partially Ready',
            shipments: [
                {
                    status: 'SHIPPED',
                    provider: 'UPS',
                    trackingNumber: 'MULTI-TRACK-456',
                    trackingUrl: 'https://www.ups.com/track?loc=en_US&tracknum=MULTI-TRACK-456'
                },
                {
                    status: 'PENDING',
                    provider: 'FedEx',
                    trackingNumber: 'MULTI-TRACK-789',
                    trackingUrl: 'https://tracking.fedex.com/MULTI-TRACK-789'
                }
            ]
        },
        shipments: [
            {
                shipmentId: 'pickup1',
                shippingMethod: {
                    c_storePickupEnabled: true
                },
                c_fromStoreId: '00001'
            },
            {
                shipmentId: 'pickup2',
                shippingMethod: {
                    c_storePickupEnabled: true
                },
                c_fromStoreId: '00002'
            },
            {
                shipmentId: 'delivery1',
                shippingAddress: {
                    fullName: 'Jane Smith',
                    address1: '321 Delivery Ave',
                    city: 'Seattle',
                    stateCode: 'WA',
                    postalCode: '98101'
                }
            }
        ],
        billingAddress: {
            firstName: 'Tom',
            lastName: 'Wilson',
            address1: '789 Ship St',
            city: 'Portland',
            stateCode: 'OR',
            postalCode: '97201'
        },
        paymentInstruments: []
    })

    test('should display multiple pickup addresses', async () => {
        setupOrderDetailsPage(createMultiPickupBopisOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText('Pickup Address 1')).toBeInTheDocument()
        expect(await screen.findByText('Pickup Address 2')).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /pickup address 1/i})).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /pickup address 2/i})).toBeInTheDocument()
    })

    test('should display pickup address details for multiple stores', async () => {
        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.json({
                        data: [
                            {
                                id: '00001',
                                name: 'Downtown Store',
                                address1: '100 Market St',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94105',
                                phone: '(415) 555-0001'
                            },
                            {
                                id: '00002',
                                name: 'Uptown Store',
                                address1: '200 Main St',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94102',
                                phone: '(415) 555-0002'
                            }
                        ]
                    })
                )
            })
        )
        setupOrderDetailsPage(createMultiPickupBopisOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText('Pickup Address 1')).toBeInTheDocument()
        expect(await screen.findByText('Pickup Address 2')).toBeInTheDocument()
        // First store
        expect(await screen.findByText(/Downtown Store/i)).toBeInTheDocument()
        expect(await screen.findByText(/100 Market St/i)).toBeInTheDocument()
        expect(await screen.findByText(/San Francisco, CA 94105/i)).toBeInTheDocument()
        // Second store
        expect(await screen.findByText(/Uptown Store/i)).toBeInTheDocument()
        expect(await screen.findByText(/200 Main St/i)).toBeInTheDocument()
        expect(await screen.findByText(/San Francisco, CA 94102/i)).toBeInTheDocument()
    })

    test('should display OMS status for multi-pickup BOPIS order', async () => {
        setupOrderDetailsPage(createMultiPickupBopisOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/Partially Ready/i)).toBeInTheDocument()
    })

    test('should display OMS shipment 1 with UPS provider and tracking', async () => {
        setupOrderDetailsPage(createMultiPickupBopisOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/UPS/i)).toBeInTheDocument()
        expect(await screen.findByText(/SHIPPED/i)).toBeInTheDocument()
        const trackingLink = await screen.findByRole('link', {name: /MULTI-TRACK-456/i})
        expect(trackingLink).toHaveAttribute(
            'href',
            'https://www.ups.com/track?loc=en_US&tracknum=MULTI-TRACK-456'
        )
    })

    test('should display OMS shipment 2 with FedEx provider and tracking', async () => {
        setupOrderDetailsPage(createMultiPickupBopisOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/FedEx/i)).toBeInTheDocument()
        expect(await screen.findByText(/PENDING/i)).toBeInTheDocument()
        const trackingLink = await screen.findByRole('link', {name: /MULTI-TRACK-789/i})
        expect(trackingLink).toHaveAttribute('href', 'https://tracking.fedex.com/MULTI-TRACK-789')
    })

    test('should NOT display shipping address for multi-pickup BOPIS OMS order', async () => {
        setupOrderDetailsPage(createMultiPickupBopisOmsOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByRole('heading', {name: /^shipping address$/i})).not.toBeInTheDocument()
        expect(screen.queryByText(/Tom Wilson/i)).not.toBeInTheDocument()
    })
})

describe('BOPIS Order with OMS - Pickup and Delivery Shipments', () => {
    // OMS BOPIS order with both pickup and delivery shipments
    const createOmsBopisWithDelivery = () => ({
        orderNo: 'OMS-BOPIS-001',
        currency: 'USD',
        productItems: [{productId: 'product-1', quantity: 1}],
        omsData: {
            status: 'Processing',
            shipments: [
                {
                    status: 'SHIPPED',
                    provider: 'FedEx',
                    trackingNumber: 'OMS-TRACK-456',
                    trackingUrl: 'https://tracking.fedex.com/OMS-TRACK-456'
                },
                {
                    status: 'NEW',
                    provider: 'UPS',
                    trackingNumber: 'OMS-TRACK-123',
                    trackingUrl: 'https://tracking.fedex.com/OMS-TRACK-123'
                }
            ]
        },
        shipments: [
            {
                shipmentId: 'pickup1',
                shippingMethod: {
                    c_storePickupEnabled: true
                },
                c_fromStoreId: '00001'
            },
            {
                shipmentId: 'delivery1',
                shippingMethod: {
                    name: 'Ground'
                },
                shippingAddress: {
                    firstName: 'John',
                    lastName: 'Doe'
                }
            }
        ],
        billingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            address1: '123 Main St',
            city: 'Boston',
            stateCode: 'MA',
            postalCode: '02101'
        },
        paymentInstruments: []
    })

    test('should display OMS order status', async () => {
        setupOrderDetailsPage(createOmsBopisWithDelivery())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText('Processing')).toBeInTheDocument()
    })

    test('should display pickup address section', async () => {
        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockStore))
            })
        )
        setupOrderDetailsPage(createOmsBopisWithDelivery())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /pickup address/i})).toBeInTheDocument()
        expect(await screen.findByText('Pickup Address')).toBeInTheDocument()
    })

    test('should display pickup address details for OMS BOPIS with delivery', async () => {
        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockStore))
            })
        )
        setupOrderDetailsPage(createOmsBopisWithDelivery())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText('Pickup Address')).toBeInTheDocument()
        expect(await screen.findByText(/Downtown Store/i)).toBeInTheDocument()
        expect(await screen.findByText(/100 Market St/i)).toBeInTheDocument()
    })

    test('should display OMS shipment 1 and link', async () => {
        setupOrderDetailsPage(createOmsBopisWithDelivery())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/FEDEX/i)).toBeInTheDocument()
        expect(await screen.findByText(/SHIPPED/i)).toBeInTheDocument()
        const trackingLink = await screen.findByRole('link', {name: /OMS-TRACK-456/i})
        expect(trackingLink).toHaveAttribute('href', 'https://tracking.fedex.com/OMS-TRACK-456')
    })

    test('should display OMS shipment 2 and link', async () => {
        setupOrderDetailsPage(createOmsBopisWithDelivery())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/UPS/i)).toBeInTheDocument()
        expect(await screen.findByText(/NEW/i)).toBeInTheDocument()
        const trackingLink = await screen.findByRole('link', {name: /OMS-TRACK-123/i})
        expect(trackingLink).toHaveAttribute('href', 'https://tracking.fedex.com/OMS-TRACK-123')
    })

    test('should NOT display shipping address for OMS BOPIS order with multiple shipments', async () => {
        setupOrderDetailsPage(createOmsBopisWithDelivery())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByRole('heading', {name: /^shipping address$/i})).not.toBeInTheDocument()
        expect(screen.queryByText(/John Doe/i)).not.toBeInTheDocument()
    })

    test('should NOT display payment method for OMS BOPIS order', async () => {
        setupOrderDetailsPage(createOmsBopisWithDelivery())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByRole('heading', {name: /payment method/i})).not.toBeInTheDocument()
    })

    test('should display billing address for OMS BOPIS order', async () => {
        setupOrderDetailsPage(createOmsBopisWithDelivery())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /billing address/i})).toBeInTheDocument()
    })
})

describe('BOPIS Order - ECOM Only (No OMS)', () => {
    // Pure ECOM BOPIS order without OMS data
    const createEcomBopisOrder = () => ({
        orderNo: '00095551',
        currency: 'GBP',
        status: 'created',
        productItems: [{productId: 'product-1', quantity: 1}],
        shipments: [
            {
                shipmentId: 'me',
                shippingMethod: {
                    c_storePickupEnabled: true
                },
                c_fromStoreId: '00019'
            }
        ],
        billingAddress: {
            firstName: 'Deepali',
            lastName: 'Bharmal',
            address1: '2030 NE',
            city: 'Seattle',
            stateCode: 'WA',
            postalCode: '98121'
        },
        paymentInstruments: [
            {
                paymentCard: {
                    cardType: 'Visa',
                    numberLastDigits: '1111'
                }
            }
        ]
    })

    beforeEach(async () => {
        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.json({
                        data: [{id: '00019', name: 'Burlington Retail Store'}]
                    })
                )
            })
        )
    })

    test('should display ECOM order status for BOPIS order', async () => {
        setupOrderDetailsPage(createEcomBopisOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText('created')).toBeInTheDocument()
    })

    test('should display pickup address section for ECOM BOPIS order', async () => {
        setupOrderDetailsPage(createEcomBopisOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /pickup address/i})).toBeInTheDocument()
        expect(await screen.findByText('Pickup Address')).toBeInTheDocument()
    })

    test('should display pickup address details (store name, address, phone)', async () => {
        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.json({
                        data: [
                            {
                                id: '00019',
                                name: 'Burlington Retail Store',
                                address1: '75 Middlesex Turnpike',
                                city: 'Burlington',
                                stateCode: 'MA',
                                postalCode: '01803',
                                phone: '111-111-1111'
                            }
                        ]
                    })
                )
            })
        )
        setupOrderDetailsPage(createEcomBopisOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText('Pickup Address')).toBeInTheDocument()
        expect(await screen.findByText(/Burlington Retail Store/i)).toBeInTheDocument()
        expect(await screen.findByText(/75 Middlesex Turnpike/i)).toBeInTheDocument()
        expect(await screen.findByText(/Burlington, MA 01803/i)).toBeInTheDocument()
        expect(await screen.findByText(/Phone: 111-111-1111/i)).toBeInTheDocument()
    })

    test('should display payment method for ECOM BOPIS order', async () => {
        setupOrderDetailsPage(createEcomBopisOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /payment method/i})).toBeInTheDocument()
    })

    test('should display billing address for ECOM BOPIS order', async () => {
        setupOrderDetailsPage(createEcomBopisOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /billing address/i})).toBeInTheDocument()
        expect(await screen.findByText(/Deepali Bharmal/i)).toBeInTheDocument()
    })

    test('should NOT display shipping method section (pickup only, no delivery)', async () => {
        setupOrderDetailsPage(createEcomBopisOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        // No delivery shipments, so no shipping method section
        expect(screen.queryByRole('heading', {name: /shipping method/i})).not.toBeInTheDocument()
    })

    test('should NOT display shipping address section (pickup only, no delivery)', async () => {
        setupOrderDetailsPage(createEcomBopisOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        // No delivery shipments, so no shipping address section
        expect(screen.queryByRole('heading', {name: /shipping address/i})).not.toBeInTheDocument()
    })
})

describe('OMS order with no OMS shipments - default to ECOM shipment display (multi-ship)', () => {
    // Multi-shipment scenario: OMS order has omsData but no OMS shipments.
    const omsOrderMultiShipNoOmsShipments = createMockOmsOrder({
        omsData: {
            status: 'Created'
        },
        shipments: [
            {
                shipmentId: 'ship1',
                shippingMethod: {name: 'Ground'},
                shippingAddress: {
                    fullName: 'Alex Johnson',
                    address1: '876 NE 8th st',
                    city: 'Seattle',
                    stateCode: 'WA',
                    postalCode: '98121',
                    countryCode: 'US'
                }
            },
            {
                shipmentId: 'ship2',
                shippingMethod: {name: 'Express'},
                shippingAddress: {
                    fullName: 'Bob Smith',
                    address1: '456 Second St',
                    city: 'Portland',
                    stateCode: 'OR',
                    postalCode: '97201',
                    countryCode: 'US'
                }
            }
        ]
    })

    test('should display multi-shipment Shipping Method and Shipping Address from ECOM when OMS has no shipments', async () => {
        setupOrderDetailsPage(omsOrderMultiShipNoOmsShipments)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        // Default to ECOM delivery block (multi-shipment) when OMS has no shipments.
        expect(await screen.findByRole('heading', {name: /shipping method 1/i})).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /shipping method 2/i})).toBeInTheDocument()
        expect(
            await screen.findByRole('heading', {name: /shipping address 1/i})
        ).toBeInTheDocument()
        expect(
            await screen.findByRole('heading', {name: /shipping address 2/i})
        ).toBeInTheDocument()
        expect(await screen.findByText(/Alex Johnson/i)).toBeInTheDocument()
        expect(await screen.findByText(/Bob Smith/i)).toBeInTheDocument()
        expect(await screen.findByText(/876 NE 8th st/i)).toBeInTheDocument()
        expect(await screen.findByText(/456 Second St/i)).toBeInTheDocument()
        expect(await screen.findByText(/Ground/i)).toBeInTheDocument()
        expect(await screen.findByText(/Express/i)).toBeInTheDocument()
    })
})

describe('Cancel order error scenarios', () => {
    const cancelEligibleOmsOrder = createMockOmsOrder({
        omsData: {status: 'Created'},
        productItems: [
            {
                productId: 'product-1',
                productName: 'Test Product',
                quantity: 1,
                omsData: {
                    status: 'created',
                    quantityAvailableToCancel: 1,
                    quantityOrdered: 1
                }
            }
        ],
        customerInfo: {customerId: 'testCustomerId'}
    })

    beforeEach(() => {
        mockMutateAsync.mockReset()
    })

    test('shows 404 error message when cancel API returns 404', async () => {
        mockMutateAsync.mockRejectedValueOnce({response: {status: 404}})
        setupOrderDetailsPage(cancelEligibleOmsOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        const user = userEvent.setup()
        await user.click(await screen.findByRole('button', {name: /cancel order/i}))
        await user.click(await screen.findByRole('button', {name: /confirm cancellation/i}))
        await waitFor(() => {
            expect(screen.getByText(/we could not find this order/i)).toBeInTheDocument()
        })
        expect(screen.getByText(/unable to cancel order/i)).toBeInTheDocument()
    })

    test('shows 409 error message when cancel API returns 409', async () => {
        mockMutateAsync.mockRejectedValueOnce({response: {status: 409}})
        setupOrderDetailsPage(cancelEligibleOmsOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        const user = userEvent.setup()
        await user.click(await screen.findByRole('button', {name: /cancel order/i}))
        await user.click(await screen.findByRole('button', {name: /confirm cancellation/i}))
        await waitFor(() => {
            expect(screen.getByText(/already being processed/i)).toBeInTheDocument()
        })
        expect(screen.getByText(/unable to cancel order/i)).toBeInTheDocument()
    })

    test('shows generic error message when cancel API returns 500', async () => {
        mockMutateAsync.mockRejectedValueOnce({response: {status: 500}})
        setupOrderDetailsPage(cancelEligibleOmsOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        const user = userEvent.setup()
        await user.click(await screen.findByRole('button', {name: /cancel order/i}))
        await user.click(await screen.findByRole('button', {name: /confirm cancellation/i}))
        await waitFor(() => {
            expect(screen.getByText(/couldn't process your cancellation/i)).toBeInTheDocument()
        })
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })

    test('shows generic error message when error has no response (network failure)', async () => {
        mockMutateAsync.mockRejectedValueOnce(new Error('Network error'))
        setupOrderDetailsPage(cancelEligibleOmsOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        const user = userEvent.setup()
        await user.click(await screen.findByRole('button', {name: /cancel order/i}))
        await user.click(await screen.findByRole('button', {name: /confirm cancellation/i}))
        await waitFor(() => {
            expect(screen.getByText(/couldn't process your cancellation/i)).toBeInTheDocument()
        })
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
})

describe('Cancel order — eligibility and full flow (W-22806929)', () => {
    const omsEligibleOrder = createMockOmsOrder({
        omsData: {status: 'Created'},
        productItems: [
            {
                productId: 'product-1',
                productName: 'Test Product',
                quantity: 2,
                omsData: {
                    status: 'created',
                    quantityAvailableToCancel: 2,
                    quantityOrdered: 2
                }
            }
        ],
        customerInfo: {customerId: 'testCustomerId'}
    })

    const omsCancelledOrder = createMockOmsOrder({
        omsData: {status: 'Approved'},
        productItems: [
            {
                productId: 'product-1',
                productName: 'Cancelled Product',
                quantity: 1,
                omsData: {
                    status: 'canceled',
                    quantityAvailableToCancel: 0,
                    quantityOrdered: 1
                }
            }
        ],
        customerInfo: {customerId: 'testCustomerId'}
    })

    const omsPartiallyShippedOrder = createMockOmsOrder({
        omsData: {status: 'Approved'},
        productItems: [
            {
                productId: 'product-1',
                productName: 'Shipped Product',
                quantity: 1,
                omsData: {
                    status: 'fulfilled',
                    quantityAvailableToCancel: 0,
                    quantityOrdered: 1
                }
            },
            {
                productId: 'product-2',
                productName: 'Pending Product',
                quantity: 1,
                omsData: {
                    status: 'created',
                    quantityAvailableToCancel: 1,
                    quantityOrdered: 1
                }
            }
        ],
        customerInfo: {customerId: 'testCustomerId'}
    })

    beforeEach(() => {
        mockMutateAsync.mockReset()
    })

    test('shows ORDER ACTIONS with enabled cancel button for eligible OMS order', async () => {
        setupOrderDetailsPage(omsEligibleOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/order actions/i)).toBeInTheDocument()
        const cancelButton = await screen.findByRole('button', {name: /cancel order/i})
        expect(cancelButton).toBeEnabled()
    })

    test('disables cancel button when all items have quantityAvailableToCancel === 0', async () => {
        setupOrderDetailsPage(omsCancelledOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        const cancelButton = await screen.findByRole('button', {name: /cancel order/i})
        expect(cancelButton).toBeDisabled()
    })

    test('disables cancel button when any item is not fully cancellable', async () => {
        setupOrderDetailsPage(omsPartiallyShippedOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        const cancelButton = await screen.findByRole('button', {name: /cancel order/i})
        expect(cancelButton).toBeDisabled()
    })

    test('does not show ORDER ACTIONS for non-OMS order', async () => {
        setupOrderDetailsPage(createMockOrder())
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByText(/order actions/i)).not.toBeInTheDocument()
    })

    test('disables cancel button when order belongs to different customer', async () => {
        const otherCustomerOrder = createMockOmsOrder({
            omsData: {status: 'Created'},
            productItems: [
                {
                    productId: 'product-1',
                    productName: 'Product',
                    quantity: 1,
                    omsData: {
                        status: 'created',
                        quantityAvailableToCancel: 1,
                        quantityOrdered: 1
                    }
                }
            ],
            customerInfo: {customerId: 'differentCustomerId'}
        })
        setupOrderDetailsPage(otherCustomerOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        const cancelButton = await screen.findByRole('button', {name: /cancel order/i})
        expect(cancelButton).toBeDisabled()
    })

    test('cancel happy path: modal opens, submit succeeds, feedback shows', async () => {
        mockMutateAsync.mockResolvedValueOnce({
            orderNo: omsEligibleOrder.orderNo,
            status: 'cancelled'
        })
        setupOrderDetailsPage(omsEligibleOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()

        const user = userEvent.setup()
        await user.click(await screen.findByRole('button', {name: /^cancel order$/i}))

        // Modal opens
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/this cancels the entire order/i)).toBeInTheDocument()

        // Submit
        await user.click(screen.getByRole('button', {name: /confirm cancellation/i}))

        // API called
        expect(mockMutateAsync).toHaveBeenCalledTimes(1)
        expect(mockMutateAsync).toHaveBeenCalledWith({
            parameters: {orderNo: omsEligibleOrder.orderNo},
            body: {}
        })

        // Success feedback appears
        await waitFor(() => {
            expect(screen.getByText(/order cancelled/i)).toBeInTheDocument()
        })
    })

    test('cancel submits empty body when no reason codes available', async () => {
        // The module-level mock returns cancelReasonCodes: [] so the dropdown
        // is hidden and the modal submits with no reason (server applies default)
        mockMutateAsync.mockResolvedValueOnce({
            orderNo: omsEligibleOrder.orderNo,
            status: 'cancelled'
        })
        setupOrderDetailsPage(omsEligibleOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()

        const user = userEvent.setup()
        await user.click(await screen.findByRole('button', {name: /^cancel order$/i}))
        await user.click(screen.getByRole('button', {name: /confirm cancellation/i}))

        expect(mockMutateAsync).toHaveBeenCalledTimes(1)
        expect(mockMutateAsync.mock.calls[0][0].body).toEqual({})

        await waitFor(() => {
            expect(screen.getByText(/order cancelled/i)).toBeInTheDocument()
        })
    })

    test('cancel button disabled after successful cancellation', async () => {
        mockMutateAsync.mockResolvedValueOnce({
            orderNo: omsEligibleOrder.orderNo,
            status: 'cancelled'
        })
        setupOrderDetailsPage(omsEligibleOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()

        const user = userEvent.setup()
        const cancelButton = await screen.findByRole('button', {name: /cancel order/i})
        await user.click(cancelButton)
        await user.click(screen.getByRole('button', {name: /confirm cancellation/i}))

        await waitFor(() => {
            expect(screen.getByText(/order cancelled/i)).toBeInTheDocument()
        })

        // Button should now be disabled
        expect(cancelButton).toBeDisabled()
    })

    test('cancel button stays enabled after transient error (500)', async () => {
        mockMutateAsync.mockRejectedValueOnce({response: {status: 500}})
        setupOrderDetailsPage(omsEligibleOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()

        const user = userEvent.setup()
        const cancelButton = await screen.findByRole('button', {name: /cancel order/i})
        await user.click(cancelButton)
        await user.click(screen.getByRole('button', {name: /confirm cancellation/i}))

        await waitFor(() => {
            expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
        })

        // Button should still be enabled for retry
        expect(cancelButton).toBeEnabled()
    })

    test('cancel button disabled after terminal error (409)', async () => {
        mockMutateAsync.mockRejectedValueOnce({response: {status: 409}})
        setupOrderDetailsPage(omsEligibleOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()

        const user = userEvent.setup()
        const cancelButton = await screen.findByRole('button', {name: /cancel order/i})
        await user.click(cancelButton)
        await user.click(screen.getByRole('button', {name: /confirm cancellation/i}))

        await waitFor(() => {
            expect(screen.getByText(/already being processed/i)).toBeInTheDocument()
        })

        // Button should be disabled — terminal error, retrying won't help
        expect(cancelButton).toBeDisabled()
    })

    test('keep order closes modal without calling API', async () => {
        setupOrderDetailsPage(omsEligibleOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()

        const user = userEvent.setup()
        await user.click(await screen.findByRole('button', {name: /^cancel order$/i}))
        expect(screen.getByRole('dialog')).toBeInTheDocument()

        await user.click(screen.getByRole('button', {name: /keep order/i}))

        // Modal closes (wait for animation)
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
        // API not called
        expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    test('modal shows "Confirm cancellation below" when no reason codes available', async () => {
        setupOrderDetailsPage(omsEligibleOrder)
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()

        const user = userEvent.setup()
        await user.click(await screen.findByRole('button', {name: /cancel order/i}))

        // The mock returns cancelReasonCodes: [] — dropdown should be hidden
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
        expect(screen.getByText(/confirm cancellation below/i)).toBeInTheDocument()
    })
})
