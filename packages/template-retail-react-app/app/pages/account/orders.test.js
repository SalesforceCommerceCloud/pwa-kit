/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {Route, Switch} from 'react-router-dom'
import {screen} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {renderWithProviders, createPathWithDefaults} from '../../utils/test-utils'
import {
    mockCustomerBaskets,
    mockOrderHistory,
    mockOrderProducts
} from '../../commerce-api/mock-data'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import Orders from './orders'
import mockConfig from '../../../config/mocks/default'

const MockedComponent = () => {
    const customer = useCustomer()

    useEffect(() => {
        if (!customer.isRegistered) {
            customer.login('est@test.com', 'password')
        }
    }, [])

    if (!customer.isRegistered) {
        return null
    }

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
        rest.get('*/customers/:customerId/orders', (req, res, ctx) =>
            res(ctx.delay(0), ctx.json(mockOrderHistory))
        ),
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) =>
            res(ctx.delay(0), ctx.json(mockCustomerBaskets))
        ),
        rest.get('*/products', (req, res, ctx) => res(ctx.delay(0), ctx.json(mockOrderProducts)))
    )

    window.history.pushState({}, 'Account', createPathWithDefaults('/account/orders'))
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
})

test('Renders order history and details', async () => {
    renderWithProviders(<MockedComponent history={history} />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })
    expect(await screen.findByTestId('account-order-history-page')).toBeInTheDocument()
    expect(await screen.findAllByText(/Ordered: /i)).toHaveLength(3)
    expect(
        await screen.findAllByAltText(
            'Pleated Bib Long Sleeve Shirt, Silver Grey, small',
            {},
            {timeout: 15000}
        )
    ).toHaveLength(3)

    user.click((await screen.findAllByText(/view details/i))[0])
    expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
    expect(await screen.findByText(/order number: 00028011/i)).toBeInTheDocument()
    expect(
        await screen.findByAltText(/Pleated Bib Long Sleeve Shirt, Silver Grey, small/i)
    ).toBeInTheDocument()
    expect(
        await screen.findByAltText(/Long Sleeve Crew Neck, Fire Red, small/i)
    ).toBeInTheDocument()
})
