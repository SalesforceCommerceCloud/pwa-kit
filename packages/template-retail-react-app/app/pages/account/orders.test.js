/*
 * Copyright (c) 2023, salesforce.com, inc.
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
    mockOrderProducts
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
