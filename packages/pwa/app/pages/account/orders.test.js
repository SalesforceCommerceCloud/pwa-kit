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
import {renderWithProviders, createPathWithDefaults, setupMockServer} from '../../utils/test-utils'
import {mockOrderHistory, mockOrderProducts} from '../../commerce-api/mock-data'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import Orders from './orders'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
jest.mock('pwa-kit-runtime/utils/ssr-config', () => {
    const origin = jest.requireActual('pwa-kit-runtime/utils/ssr-config')
    return {
        ...origin,
        getConfig: jest.fn()
    }
})
import mockConfig from '../../../config/__mocks__/default'
jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

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

const server = setupMockServer(
    rest.get('*/customers/:customerId/orders', (req, res, ctx) =>
        res(ctx.delay(0), ctx.json(mockOrderHistory))
    ),
    rest.get('*/products', (req, res, ctx) => res(ctx.delay(0), ctx.json(mockOrderProducts)))
)

// Set up and clean up
beforeEach(() => {
    jest.resetModules()

    server.listen({onUnhandledRequest: 'error'})
    // mock getConfig to return the mock config instead of actual one
    getConfig.mockImplementation(() => mockConfig)
    const ordersUrl = createPathWithDefaults('/account/orders')

    window.history.pushState({}, 'Account', ordersUrl)
})
afterEach(() => {
    localStorage.clear()
    server.resetHandlers()
})
afterAll(() => server.close())

test('Renders order history and details', async () => {
    renderWithProviders(<MockedComponent history={history} />)
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
    console.log('window.location', window.location.pathname)
    expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
    expect(await screen.findByText(/order number: 00028011/i)).toBeInTheDocument()
    expect(
        await screen.findByAltText(/Pleated Bib Long Sleeve Shirt, Silver Grey, small/i)
    ).toBeInTheDocument()
    expect(
        await screen.findByAltText(/Long Sleeve Crew Neck, Fire Red, small/i)
    ).toBeInTheDocument()
})
