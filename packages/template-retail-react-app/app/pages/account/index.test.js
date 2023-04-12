/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Route, Switch} from 'react-router-dom'
import {screen, waitFor, within, act} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders, createPathWithDefaults} from '../../utils/test-utils'
import {mockOrderHistory, mockedRegisteredCustomer, mockOrderProducts} from '../../mocks/mock-data'
import Account from './index'
import Login from '../login'
import mockConfig from '../../../config/mocks/default'
import {createServer} from '../../../jest-setup'

const MockedComponent = () => {
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

const handlers = [
    {
        path: '*/products',
        res: () => {
            return {
                body: mockOrderProducts
            }
        }
    },
    {
        path: '*/customers/:customerId/orders',
        res: () => {
            return {
                body: mockOrderHistory
            }
        }
    }
]

// Set up and clean up
beforeEach(() => {
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
    createServer(handlers)
    test('Redirects to login page if the customer is not logged in', async () => {
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
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app, isGuest: true}
        })
        await waitFor(() => expect(window.location.pathname).toEqual(`${expectedBasePath}/login`))
    })

    test('Provides navigation for subpages', async () => {
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
    })

    test('Renders account detail page by default for logged-in customer, and can log out', async () => {
        renderWithProviders(<MockedComponent />)

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
    createServer([
        ...handlers,
        {
            path: '*/customers/:customerId',
            method: 'patch',
            res: () => {
                return {
                    ...mockedRegisteredCustomer,
                    firstName: 'Geordi',
                    phoneHome: '(567) 123-5585'
                }
            }
        }
    ])
    test('Allows customer to edit profile details', async () => {
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
    createServer([
        ...handlers,
        {
            path: '*/password',
            method: 'put',
            res: () => {
                return {}
            }
        }
    ])
    test('Allows customer to update password', async () => {
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
