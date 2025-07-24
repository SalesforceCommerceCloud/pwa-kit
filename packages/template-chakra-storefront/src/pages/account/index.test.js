/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Route, Switch} from 'react-router-dom'
import {screen, act, waitFor, within} from '@testing-library/react'
import {renderWithProviders, createPathWithDefaults, guestToken} from '../../utils/test-utils'
import {
    mockOrderHistory,
    mockedGuestCustomer,
    mockedRegisteredCustomer,
    mockOrderProducts,
    mockPasswordUpdateFalure
} from '../../../mocks/mock-data'
import Account from '../../pages/account/index'
import Login from '../../pages/login'
import mockConfig from '../../../config/mocks/mock-config'
import {useCustomerType} from '@salesforce/commerce-sdk-react'
import {prependHandlersToServer} from '../../../jest-setup'

jest.setTimeout(60000)
jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useCustomerType: jest.fn()
}))

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

// Set up and clean up
beforeEach(() => {
    prependHandlersToServer([
        {
            path: '*/products',
            method: 'get',
            delay: 0,
            res: () => mockOrderProducts
        },
        {
            path: '*/customers/:customerId/orders',
            method: 'get',
            delay: 0,
            res: () => mockOrderHistory
        },
        {
            path: '*/oauth2/token',
            method: 'post',
            delay: 0,
            res: () => ({
                customer_id: 'customerid',
                access_token: guestToken,
                refresh_token: 'testrefeshtoken',
                usid: 'testusid',
                enc_user_id: 'testEncUserId',
                id_token: 'testIdToken'
            })
        }
    ])

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', createPathWithDefaults('/account'))
})
afterEach(() => {
    jest.resetModules()
    jest.restoreAllMocks()
})

const expectedBasePath = '/uk/en-GB'
describe('Test redirects', function () {
    beforeEach(() => {
        prependHandlersToServer([
            {
                path: '*/customers/:customerId',
                method: 'get',
                delay: 0,
                status: 200,
                res: () => mockedGuestCustomer
            }
        ])
    })
    test('Redirects to login page if the customer is not logged in', async () => {
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {siteAlias: 'uk', config: mockConfig, isGuest: true}
        })
        await waitFor(() => expect(window.location.pathname).toBe(`${expectedBasePath}/login`))
    })
})
describe('Page Navigation', () => {
    test('works for subpages', async () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})
        prependHandlersToServer([
            {
                path: '*/products',
                method: 'get',
                delay: 0,
                res: () => mockOrderProducts
            },
            {
                path: '*/customers/:customerId/orders',
                method: 'get',
                delay: 0,
                res: () => mockOrderHistory
            }
        ])
        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {siteAlias: 'uk', config: mockConfig}
        })
        expect(await screen.findByTestId('account-page')).toBeInTheDocument()

        const nav = within(screen.getByTestId('account-detail-nav'))
        await act(async () => {
            await user.click(nav.getByText('Addresses'))
        })
        await waitFor(() =>
            expect(window.location.pathname).toBe(`${expectedBasePath}/account/addresses`)
        )
        await act(async () => {
            await user.click(nav.getByText('Order History'))
        })
        await waitFor(() =>
            expect(window.location.pathname).toBe(`${expectedBasePath}/account/orders`)
        )
    })
})

describe('Render and logs out', function () {
    test('Renders account detail page by default for logged-in customer, and can log out', async () => {
        useCustomerType.mockReturnValue({
            isRegistered: true,
            isGuest: false,
            customerType: 'registered'
        })

        const {user} = renderWithProviders(<MockedComponent />)
        // Render user profile page
        await waitFor(() => {
            expect(window.location.pathname).toBe(`${expectedBasePath}/account`)
            expect(screen.getByTestId('account-detail-page')).toBeInTheDocument()
            expect(screen.getByText('Testing Tester')).toBeInTheDocument()
            expect(screen.getByText('customer@test.com')).toBeInTheDocument()
            expect(screen.getByText('(727) 555-1234')).toBeInTheDocument()
            const logOutIcons = screen.getAllByLabelText('signout')
            expect(logOutIcons[0]).toHaveAttribute('aria-hidden', 'true')
            expect(logOutIcons[1]).toHaveAttribute('aria-hidden', 'true')
        })
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true, customerType: 'guest'})

        await act(async () => {
            await user.click(screen.getAllByText(/Log Out/)[0])
        })

        // Check that logout redirects to login page
        await waitFor(() => {
            expect(window.location.pathname).toBe(`${expectedBasePath}/login`)
            expect(screen.getByTestId('login-page')).toBeInTheDocument()
        })
    })
})

describe('updating profile', function () {
    beforeEach(() => {
        useCustomerType.mockReturnValue({isRegistered: true, isExternal: false})
        prependHandlersToServer([
            {
                path: '*/customers/:customerId',
                method: 'patch',
                res: () => ({
                    ...mockedRegisteredCustomer,
                    firstName: 'Geordi',
                    phoneHome: '(567) 123-5585'
                })
            }
        ])
    })
    test('Allows customer to edit profile details', async () => {
        useCustomerType.mockReturnValue({isRegistered: true, isExternal: false})
        const {user} = renderWithProviders(<MockedComponent />)
        expect(await screen.findByTestId('account-page')).toBeInTheDocument()
        expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()
        await waitFor(() => {
            const firstName = screen.getByText(/Testing Tester/i)
            expect(firstName).toBeInTheDocument()
        })
        const el = within(screen.getByTestId('sf-toggle-card-my-profile'))

        await act(async () => {
            await user.click(el.getByText(/edit/i))
        })
        await act(async () => {
            await user.type(el.getByLabelText(/first name/i), 'Geordi')
            await user.type(el.getByLabelText(/Phone Number/i), '5671235585')
        })

        await act(async () => {
            await user.click(el.getByText(/save/i))
        })

        expect(await screen.findByText('Geordi Tester')).toBeInTheDocument()
        expect(await screen.findByText('(567) 123-5585')).toBeInTheDocument()
    })
})

describe('updating password', function () {
    beforeEach(() => {
        useCustomerType.mockReturnValue({isRegistered: true, isExternal: false})
        prependHandlersToServer([
            {
                path: '*/oauth2/token',
                method: 'post',
                delay: 0,
                res: () => ({
                    customer_id: 'customerid',
                    access_token: guestToken,
                    refresh_token: 'testrefeshtoken',
                    usid: 'testusid',
                    enc_user_id: 'testEncUserId',
                    id_token: 'testIdToken'
                })
            }
        ])
    })
    test('Password update form is rendered correctly', async () => {
        const {user} = renderWithProviders(<MockedComponent />)
        expect(await screen.findByTestId('account-page')).toBeInTheDocument()
        expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()

        const el = within(screen.getByTestId('sf-toggle-card-password'))
        await act(async () => {
            await user.click(el.getByText(/edit/i))
        })

        expect(el.getByLabelText(/current password/i)).toBeInTheDocument()
        expect(el.getByLabelText(/new password/i)).toBeInTheDocument()
        expect(el.getByText(/forgot password/i)).toBeInTheDocument()
    })

    test('Allows customer to update password', async () => {
        prependHandlersToServer([
            {
                path: '*/password',
                method: 'put',
                status: 204,
                res: () => ({})
            }
        ])

        const {user} = renderWithProviders(<MockedComponent />)

        const el = within(screen.getByTestId('sf-toggle-card-password'))
        await act(async () => {
            await user.click(el.getByText(/edit/i))
        })

        await act(async () => {
            await user.type(el.getByLabelText(/current password/i), 'Password!12345')
            await user.type(el.getByLabelText(/new password/i), 'Password!98765')
        })
        await act(async () => {
            await user.click(el.getByText(/Forgot password/i))
            await user.click(el.getByText(/save/i))
        })
        expect(await screen.findByText('••••••••')).toBeInTheDocument()
    })

    test('Warns customer when updating password with invalid current password', async () => {
        prependHandlersToServer([
            {
                path: '*/password',
                method: 'put',
                status: 401,
                res: () => mockPasswordUpdateFalure
            }
        ])

        const {user} = renderWithProviders(<MockedComponent />)

        const el = within(screen.getByTestId('sf-toggle-card-password'))
        await act(async () => {
            await user.click(el.getByText(/edit/i))
        })
        await act(async () => {
            await user.type(el.getByLabelText(/current password/i), 'Password!123456')
            await user.type(el.getByLabelText(/new password/i), 'Password!98765')
        })

        await act(async () => {
            await user.click(el.getByText(/Forgot password/i))
            await user.click(el.getByText(/save/i))
        })

        expect(await screen.findByTestId('password-update-error')).toBeInTheDocument()
    })
})
