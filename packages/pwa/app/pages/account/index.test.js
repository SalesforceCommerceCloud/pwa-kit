/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {Route, Switch} from 'react-router-dom'
import {screen, waitFor, within} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {renderWithProviders} from '../../utils/test-utils'
import {
    mockedGuestCustomer,
    mockedRegisteredCustomer,
    mockOrderHistory,
    mockOrderProducts,
    exampleTokenReponse
} from '../../commerce-api/mock-data'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import Account from './index'

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
            customer.login('test@test.com', 'password1')
        }
    }, [])

    return (
        <Switch>
            <Route path="/en/account" render={(props) => <Account {...props} />} />
        </Switch>
    )
}

const server = setupServer(
    rest.post('*/customers/actions/login', (req, res, ctx) =>
        res(ctx.set('authorization', `Bearer guesttoken`), ctx.json(mockedRegisteredCustomer))
    ),
    rest.get('*/customers/:customerId/orders', (req, res, ctx) =>
        res(ctx.delay(0), ctx.json(mockOrderHistory))
    ),
    rest.get('*/products', (req, res, ctx) => res(ctx.delay(0), ctx.json(mockOrderProducts))),
    rest.post('*/oauth2/authorize', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(303), ctx.set('location', `/testcallback`))
    ),
    rest.get('*/oauth2/authorize', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(303), ctx.set('location', `/testcallback`))
    ),
    rest.get('*/testcallback', (req, res, ctx) => {
        return res(ctx.delay(0), ctx.status(200))
    }),
    rest.post('*/oauth2/login', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
    ),
    rest.get('*/customers/:customerId', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
    ),
    rest.get('*/oauth2/logout', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(200), ctx.json(exampleTokenReponse))
    ),
    rest.post('*/oauth2/token', (req, res, ctx) =>
        res(
            ctx.delay(0),
            ctx.json({
                customer_id: 'test',
                access_token: 'testtoken',
                refresh_token: 'testrefeshtoken',
                usid: 'testusid',
                enc_user_id: 'testEncUserId'
            })
        )
    )
)

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})

    // Need to mock TextEncoder for tests
    if (typeof TextEncoder === 'undefined') {
        global.TextEncoder = require('util').TextEncoder
    }

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', '/en/account')
})
afterEach(() => {
    localStorage.clear()
    server.resetHandlers()
})
afterAll(() => server.close())

test('Redirects to login page if the customer is not logged in', async () => {
    server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedGuestCustomer))
        })
    )
    renderWithProviders(<MockedComponent />)
    await waitFor(() => expect(window.location.pathname).toEqual('/en/login'))
})

test('Provides navigation for subpages', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('account-page')).toBeInTheDocument()

    const nav = within(screen.getByTestId('account-detail-nav'))
    user.click(nav.getByText('Addresses'))
    await waitFor(() => expect(window.location.pathname).toEqual('/en/account/addresses'))
    user.click(nav.getByText('Order History'))
    await waitFor(() => expect(window.location.pathname).toEqual('/en/account/orders'))
    user.click(nav.getByText('Payment Methods'))
    await waitFor(() => expect(window.location.pathname).toEqual('/en/account/payments'))
})

test('Renders account detail page by default for logged-in customer', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('account-page')).toBeInTheDocument()
    expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()
    expect(screen.getByText('Testing Tester')).toBeInTheDocument()
    expect(screen.getByText('customer@test.com')).toBeInTheDocument()
    expect(screen.getByText('(727) 555-1234')).toBeInTheDocument()
})

test('Allows customer to sign out', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()
    user.click(screen.getAllByText('Log out')[0])
    await waitFor(() => {
        expect(window.location.pathname).toEqual('/en/login')
    })
})

test('Allows customer to edit profile details', async () => {
    server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(
                ctx.json({
                    ...mockedRegisteredCustomer,
                    firstName: 'Geordi',
                    phoneHome: '(567) 123-5585'
                })
            )
        ),
        rest.patch('*/customers/:customerId', (req, res, ctx) =>
            res(
                ctx.json({
                    ...mockedRegisteredCustomer,
                    firstName: 'Geordi',
                    phoneHome: '(567) 123-5585'
                })
            )
        )
    )

    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('account-page')).toBeInTheDocument()
    expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()

    const el = within(screen.getByTestId('sf-toggle-card-my-profile'))
    user.click(el.getByText(/edit/i))
    user.type(el.getByLabelText(/first name/i), 'Geordi')
    user.type(el.getByLabelText(/Phone Number/i), '5671235585')
    user.click(el.getByText(/save/i))
    expect(await screen.findByText('Geordi Tester')).toBeInTheDocument()
    expect(await screen.findByText('(567) 123-5585')).toBeInTheDocument()
})

test('Allows customer to update password', async () => {
    server.use(rest.put('*/password', (req, res, ctx) => res(ctx.json())))

    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('account-page')).toBeInTheDocument()
    expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()

    const el = within(screen.getByTestId('sf-toggle-card-password'))
    user.click(el.getByText(/edit/i))
    user.type(el.getByLabelText(/current password/i), 'Password!12345')
    user.type(el.getByLabelText(/new password/i), 'Password!98765')
    user.click(el.getByText(/Forgot password/i))

    expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()

    user.click(el.getByText(/save/i))
    expect(await screen.findByText('••••••••')).toBeInTheDocument()
})
