/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {Route, Switch} from 'react-router-dom'
import {screen, waitFor, within, act} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {renderWithProviders, createPathWithDefaults} from '../../utils/test-utils'
import {
    mockOrderHistory,
    mockedGuestCustomer,
    mockedRegisteredCustomer,
    mockOrderProducts
} from '../../commerce-api/mock-data'
import Account from './index'
import Login from '../login'
import mockConfig from '../../../config/mocks/default'
import {AuthHelpers, useAuthHelper, useCustomerType} from 'commerce-sdk-react-preview'
import {useCurrentCustomer} from '../../hooks/use-current-customer'

jest.mock('../../commerce-api/einstein')

const MockedComponent = () => {
    const {isRegistered} = useCustomerType()
    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    const {data: customer} = useCurrentCustomer()

    useEffect(() => {
        if (!isRegistered) {
            login.mutate(
                {email: 'email@test.com', password: 'password1'},
                {
                    onSuccess: () => {
                        window.history.pushState({}, 'Account', createPathWithDefaults('/account'))
                    }
                }
            )
        }
    }, [])

    if (!customer.isRegistered) {
        return null
    }

    return (
        <Switch>
            <Route
                path={createPathWithDefaults('/account')}
                render={(props) => <Account {...props} />}
            />
            <Route
                path={createPathWithDefaults('/login')}
                render={(props) => <Login {...props} />}
            />
        </Switch>
    )
}

// Set up and clean up
beforeEach(() => {
    global.server.use(
        rest.get('*/products', (req, res, ctx) => res(ctx.delay(0), ctx.json(mockOrderProducts))),
        rest.get('*/customers/:customerId/orders', (req, res, ctx) =>
            res(ctx.delay(0), ctx.json(mockOrderHistory))
        )
    )

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', createPathWithDefaults('/account'))
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
})

const expectedBasePath = '/uk/en-GB'
describe('Test redirects', function () {
    beforeEach(() => {
        global.server.use(
            rest.get('*/customers/:customerId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockedGuestCustomer))
            })
        )
    })
    test.skip('Redirects to login page if the customer is not logged in', async () => {
        const Component = () => {
            return (
                <Switch>
                    <Route
                        path={createPathWithDefaults('/account')}
                        render={(props) => <Account {...props} />}
                    />
                </Switch>
            )
        }
        renderWithProviders(<Component />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })
        await waitFor(() => expect(window.location.pathname).toEqual(`${expectedBasePath}/login`))
    })
})

//TODO: wait until other pages are integrated with hook to fix this test
test('Provides navigation for subpages', async () => {
    global.server.use(
        rest.get('*/products', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockOrderProducts))
        }),
        rest.get('*/customers/:customerId/orders', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockOrderHistory))
        })
    )
    await renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })
    expect(await screen.findByTestId('account-page')).toBeInTheDocument()

    const nav = within(screen.getByTestId('account-detail-nav'))
    user.click(nav.getByText('Addresses'))
    await waitFor(() =>
        expect(window.location.pathname).toEqual(`${expectedBasePath}/account/addresses`)
    )
    user.click(nav.getByText('Order History'))
    await waitFor(() =>
        expect(window.location.pathname).toEqual(`${expectedBasePath}/account/orders`)
    )
    user.click(nav.getByText('Payment Methods'))
    await waitFor(() =>
        expect(window.location.pathname).toEqual(`${expectedBasePath}/account/payments`)
    )
})

describe('Render and logs out', function () {
    test.skip('Renders account detail page by default for logged-in customer, and can log out', async () => {
        renderWithProviders(<MockedComponent />)

        await waitFor(() => expect(window.location.pathname).toEqual(`${expectedBasePath}/login`))
        // Render user profile page
        await waitFor(() => {
            expect(window.location.pathname).toEqual(`${expectedBasePath}/account`)
            expect(screen.getByTestId('account-detail-page')).toBeInTheDocument()
            expect(screen.getByText('Testing Tester')).toBeInTheDocument()
            expect(screen.getByText('customer@test.com')).toBeInTheDocument()
            expect(screen.getByText('(727) 555-1234')).toBeInTheDocument()
        })

        user.click(screen.getAllByText(/Log Out/)[0])
        await waitFor(() => {
            expect(window.location.pathname).toEqual(`${expectedBasePath}/login`)
        })
    })
})

describe('updating profile', function () {
    beforeEach(() => {
        global.server.use(
            rest.patch('*/customers/:customerId', (req, res, ctx) => {
                return res(
                    ctx.json({
                        ...mockedRegisteredCustomer,
                        firstName: 'Geordi',
                        phoneHome: '(567) 123-5585'
                    })
                )
            })
        )
    })
    test.skip('Allows customer to edit profile details', async () => {
        renderWithProviders(<MockedComponent />)
        expect(await screen.findByTestId('account-page')).toBeInTheDocument()
        expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()
        await waitFor(() => {
            const firstName = screen.getByText(/Testing Tester/i)
            expect(firstName).toBeInTheDocument()
        })
        const el = within(screen.getByTestId('sf-toggle-card-my-profile'))

        await act(async () => {
            user.click(el.getByText(/edit/i))
        })
        user.type(el.getByLabelText(/first name/i), 'Geordi')
        user.type(el.getByLabelText(/Phone Number/i), '5671235585')

        await act(async () => {
            user.click(el.getByText(/save/i))
        })
        expect(await screen.findByText('Geordi Tester')).toBeInTheDocument()
        expect(await screen.findByText('(567) 123-5585')).toBeInTheDocument()
    })
})

describe('updating password', function () {
    beforeEach(() => {
        global.server.use(
            rest.put('*/password', (req, res, ctx) => {
                return res(ctx.json())
            })
        )
    })
    test.skip('Allows customer to update password', async () => {
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
})
