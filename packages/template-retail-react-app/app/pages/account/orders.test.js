/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Route, Switch} from 'react-router-dom'
import {screen} from '@testing-library/react'
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
                    provider: 'FedEx'
                },
                {
                    status: 'PENDING',
                    trackingNumber: 'OMS-002',
                    trackingUrl: 'https://track.example.com/OMS-002',
                    provider: 'UPS'
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
                    provider: 'FedEx Ground'
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
