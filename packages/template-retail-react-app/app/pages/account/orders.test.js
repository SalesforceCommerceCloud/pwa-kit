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

// Single shipment scenarios - ECOM vs OMS data
describe('Single shipment - ECOM data only', () => {
    beforeEach(() => {
        // ECOM order with single shipment, no OMS data
        setupOrderDetailsPage(createMockOrder())
    })

    test('should display shipping status from ECOM', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/not shipped/i)).toBeInTheDocument()
    })

    test('should display shipping method name', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/Ground/i)).toBeInTheDocument()
    })

    test('should display single shipping address heading (no number)', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(
            await screen.findByRole('heading', {name: /^shipping address$/i})
        ).toBeInTheDocument()
    })

    test('should display shipping address fields', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/John Doe/i)).toBeInTheDocument()
        expect(await screen.findByText(/123 Test St/i)).toBeInTheDocument()
        expect((await screen.findAllByText(/Boston/i)).length).toBeGreaterThanOrEqual(1)
        expect((await screen.findAllByText(/MA/i)).length).toBeGreaterThanOrEqual(1)
        expect((await screen.findAllByText(/02101/i)).length).toBeGreaterThanOrEqual(1)
    })

    test('should not display tracking number when not present', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(screen.queryByText(/tracking number/i)).not.toBeInTheDocument()
    })
})

describe('Single shipment - OMS data with tracking', () => {
    beforeEach(() => {
        // Order with OMS data including tracking info
        // Note: When omsData is present, shipments don't have shippingStatus
        const orderWithOmsTracking = createMockOrder({
            status: undefined, // No ECOM status
            shipments: [
                {
                    shippingMethod: {name: 'Ground'},
                    // No shippingStatus - OMS orders use omsData.shipments[].status instead
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
            omsData: {
                status: 'SHIPPED',
                shipments: [
                    {
                        status: 'shipped',
                        trackingNumber: '1Z999AA10123456784',
                        trackingUrl: 'https://www.ups.com/track?tracknum=1Z999AA10123456784'
                    }
                ]
            }
        })
        setupOrderDetailsPage(orderWithOmsTracking)
    })

    test('should display OMS order status', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText('SHIPPED')).toBeInTheDocument()
    })

    test('should display OMS tracking number', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/1Z999AA10123456784/i)).toBeInTheDocument()
    })

    test('should render tracking number as clickable link', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        const trackingLink = await screen.findByRole('link', {name: /1Z999AA10123456784/i})
        expect(trackingLink).toHaveAttribute(
            'href',
            'https://www.ups.com/track?tracknum=1Z999AA10123456784'
        )
    })

    test('should display tracking number label', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/tracking number/i)).toBeInTheDocument()
    })

    test('should display shipping address fields from ECOM', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/John Doe/i)).toBeInTheDocument()
        expect(await screen.findByText(/123 Test St/i)).toBeInTheDocument()
        // Boston appears in both shipping and billing
        expect((await screen.findAllByText(/Boston/i)).length).toBeGreaterThanOrEqual(1)
    })
})

// Multi-shipment scenarios with OMS data
describe('Multiple shipments - OMS data with different statuses', () => {
    beforeEach(() => {
        // Order with 2 delivery shipments and OMS data
        // Note: When omsData is present, shipments don't have shippingStatus - status comes from omsData.shipments[]
        const multiShipmentOmsOrder = createMockOrder({
            status: undefined,
            shipments: [
                {
                    shipmentId: 'ship-1',
                    shippingMethod: {name: 'Express'},
                    // No shippingStatus - uses omsData.shipments[0].status
                    shippingAddress: {
                        firstName: 'John',
                        lastName: 'Doe',
                        address1: '123 Main St',
                        city: 'Boston',
                        stateCode: 'MA',
                        postalCode: '02101'
                    }
                },
                {
                    shipmentId: 'ship-2',
                    shippingMethod: {name: 'Ground'},
                    // No shippingStatus - uses omsData.shipments[1].status
                    shippingAddress: {
                        firstName: 'Jane',
                        lastName: 'Smith',
                        address1: '456 Oak Ave',
                        city: 'Los Angeles',
                        stateCode: 'CA',
                        postalCode: '90001'
                    }
                }
            ],
            omsData: {
                status: 'PARTIALLY_SHIPPED',
                shipments: [
                    {
                        status: 'shipped',
                        trackingNumber: '1Z999AA10123456784',
                        trackingUrl: 'https://www.ups.com/track?tracknum=1Z999AA10123456784'
                    },
                    {
                        status: 'in_transit',
                        trackingNumber: '9400111899223334445566',
                        trackingUrl: 'https://tools.usps.com/track?tracknum=9400111899223334445566'
                    }
                ]
            }
        })
        setupOrderDetailsPage(multiShipmentOmsOrder)
    })

    test('should display order status from OMS', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText('PARTIALLY_SHIPPED')).toBeInTheDocument()
    })

    test('should display numbered shipping method headings', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /shipping method 1/i})).toBeInTheDocument()
        expect(await screen.findByRole('heading', {name: /shipping method 2/i})).toBeInTheDocument()
    })

    test('should display numbered shipping address headings', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(
            await screen.findByRole('heading', {name: /shipping address 1/i})
        ).toBeInTheDocument()
        expect(
            await screen.findByRole('heading', {name: /shipping address 2/i})
        ).toBeInTheDocument()
    })

    test('should display both shipping addresses', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/John Doe/i)).toBeInTheDocument()
        // Jane Smith appears in both shipping and billing - verify both exist
        expect((await screen.findAllByText(/Jane Smith/i)).length).toBeGreaterThanOrEqual(1)
    })

    test('should display first shipment address fields', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/123 Main St/i)).toBeInTheDocument()
        // Boston, MA, 02101 may appear in billing too - verify they exist
        expect((await screen.findAllByText(/Boston/i)).length).toBeGreaterThanOrEqual(1)
        expect((await screen.findAllByText(/MA/i)).length).toBeGreaterThanOrEqual(1)
        expect((await screen.findAllByText(/02101/i)).length).toBeGreaterThanOrEqual(1)
    })

    test('should display second shipment address fields', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/456 Oak Ave/i)).toBeInTheDocument()
        expect(await screen.findByText(/Los Angeles/i)).toBeInTheDocument()
        expect(await screen.findByText(/CA/i)).toBeInTheDocument()
        expect(await screen.findByText(/90001/i)).toBeInTheDocument()
    })

    test('should display both tracking numbers from OMS', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/1Z999AA10123456784/i)).toBeInTheDocument()
        expect(await screen.findByText(/9400111899223334445566/i)).toBeInTheDocument()
    })

    test('should render both tracking numbers as clickable links', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        const upsLink = await screen.findByRole('link', {name: /1Z999AA10123456784/i})
        const uspsLink = await screen.findByRole('link', {name: /9400111899223334445566/i})
        expect(upsLink).toHaveAttribute(
            'href',
            'https://www.ups.com/track?tracknum=1Z999AA10123456784'
        )
        expect(uspsLink).toHaveAttribute(
            'href',
            'https://tools.usps.com/track?tracknum=9400111899223334445566'
        )
    })

    test('should display tracking number labels for both shipments', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        const trackingLabels = await screen.findAllByText(/tracking number/i)
        expect(trackingLabels).toHaveLength(2)
    })
})
