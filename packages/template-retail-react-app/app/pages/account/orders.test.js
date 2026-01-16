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

describe('Order with ECOM status (non-OMS)', () => {
    beforeEach(async () => {
        const ecomOrder = {
            ...mockOrderHistory.data[0],
            status: 'new'
        }
        setupOrderDetailsPage(ecomOrder)
    })

    test('should display ECOM status when present', async () => {
        const statusBadge = await screen.findByText('new')
        expect(statusBadge).toBeInTheDocument()
    })
})

describe('Order with OMS data', () => {
    beforeEach(async () => {
        const omsOrder = {
            ...mockOrderHistory.data[0],
            status: undefined,
            omsData: {status: 'SHIPPED'}
        }
        setupOrderDetailsPage(omsOrder)
    })

    test('should display OMS status when ECOM status is not present', async () => {
        const statusBadge = await screen.findByText('SHIPPED')
        expect(statusBadge).toBeInTheDocument()
    })
})

describe('Order without payment data', () => {
    beforeEach(async () => {
        const orderWithoutPayment = {
            ...mockOrderHistory.data[0],
            paymentInstruments: []
        }
        setupOrderDetailsPage(orderWithoutPayment)
    })

    test('should render order details page', async () => {
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
    })

    test('should not display payment method section', async () => {
        await screen.findByTestId('account-order-details-page')
        expect(screen.queryByText(/payment method/i)).not.toBeInTheDocument()
    })
})

describe('Order with firstName and lastName for shipping address', () => {
    beforeEach(async () => {
        const orderWithNames = {
            ...mockOrderHistory.data[0],
            shipments: [
                {
                    ...mockOrderHistory.data[0].shipments[0],
                    shippingAddress: {
                        ...mockOrderHistory.data[0].shipments[0].shippingAddress,
                        firstName: 'Jane',
                        lastName: 'Doe',
                        fullName: 'Should Not Display'
                    }
                }
            ]
        }
        setupOrderDetailsPage(orderWithNames)
    })

    test('should display firstName + lastName when both present', async () => {
        expect(await screen.findByText(/Jane Doe/i)).toBeInTheDocument()
        expect(screen.queryByText(/Should Not Display/i)).not.toBeInTheDocument()
    })
})

describe('Order with fullName fallback for shipping address', () => {
    beforeEach(async () => {
        const orderWithFullName = {
            ...mockOrderHistory.data[0],
            shipments: [
                {
                    ...mockOrderHistory.data[0].shipments[0],
                    shippingAddress: {
                        ...mockOrderHistory.data[0].shipments[0].shippingAddress,
                        firstName: undefined,
                        lastName: undefined,
                        fullName: 'John Smith'
                    }
                }
            ]
        }
        setupOrderDetailsPage(orderWithFullName)
    })

    test('should display fullName when firstName and lastName are not present', async () => {
        expect(await screen.findByText(/John Smith/i)).toBeInTheDocument()
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
