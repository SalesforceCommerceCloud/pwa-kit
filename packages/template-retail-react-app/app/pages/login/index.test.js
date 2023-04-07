/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {
    renderWithProviders,
    createPathWithDefaults,
    guestToken,
    registerUserToken
} from '../../utils/test-utils'
import Login from '.'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '../account'
import Registration from '../registration'
import ResetPassword from '../reset-password'
import mockConfig from '../../../config/mocks/default'
import {mockCustomerBaskets} from '../../mocks/mock-data'
import {createServer} from '../../../jest-setup'
const mockMergedBasket = {
    basketId: 'a10ff320829cb0eef93ca5310a',
    currency: 'USD',
    customerInfo: {
        customerId: 'registeredCustomerId',
        email: 'customer@test.com'
    }
}

const MockedComponent = () => {
    const match = {
        params: {pageName: 'profile'}
    }
    return (
        <Router>
            <Login />
            <Route path={createPathWithDefaults('/registration')}>
                <Registration />
            </Route>
            <Route path={createPathWithDefaults('/reset-password')}>
                <ResetPassword />
            </Route>
            <Route path={createPathWithDefaults('/account')}>
                <Account match={match} />
            </Route>
        </Router>
    )
}

const handlers = [
    {
        path: '*/oauth2/token',
        method: 'post',
        res: () => {
            return {
                customer_id: 'customerid',
                access_token: guestToken,
                refresh_token: 'testrefeshtoken',
                usid: 'testusid',
                enc_user_id: 'testEncUserId',
                id_token: 'testIdToken'
            }
        }
    },
    {
        path: '*/customers/:customerId/baskets',
        res: () => {
            return mockCustomerBaskets
        }
    }
]
// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
})

describe('Logging in tests', function () {
    const {prependHandlersToServer} = createServer([
        ...handlers,

        {
            path: '*/baskets/actions/merge',
            method: 'post',
            res: () => {
                return mockMergedBasket
            }
        }
    ])
    test('Allows customer to sign in to their account', async () => {
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app,
                bypassAuth: false
            }
        })

        // enter credentials and submit
        user.type(screen.getByLabelText('Email'), 'customer@test.com')
        user.type(screen.getByLabelText('Password'), 'Password!1')

        // login with credentials
        prependHandlersToServer([
            {
                path: '*/oauth2/token',
                method: 'post',
                res: () => {
                    return {
                        customer_id: 'customerid_1',
                        access_token: registerUserToken,
                        refresh_token: 'testrefeshtoken_1',
                        usid: 'testusid_1',
                        enc_user_id: 'testEncUserId_1',
                        id_token: 'testIdToken_1'
                    }
                }
            }
        ])

        user.click(screen.getByText(/sign in/i))
        await waitFor(() => {
            expect(window.location.pathname).toEqual('/uk/en-GB/account')
            expect(screen.getByText(/My Profile/i)).toBeInTheDocument()
        })
    })
})

describe('Error while logging in', function () {
    const {prependHandlersToServer} = createServer(handlers)

    test('Renders error when given incorrect log in credentials', async () => {
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app,
                bypassAuth: false
            }
        })

        // enter credentials and submit
        user.type(screen.getByLabelText('Email'), 'foo@test.com')
        user.type(screen.getByLabelText('Password'), 'SomeFakePassword1!')

        // mock failed auth request
        prependHandlersToServer([
            {
                path: '*/oauth2/login',
                method: 'post',
                status: 401,
                res: () => {
                    return {message: 'Unauthorized Credentials.'}
                }
            },
            {
                path: '*/customers',
                method: 'post',
                res: () => {
                    return {message: 'Not Found.'}
                }
            }
        ])
        user.click(screen.getByText(/sign in/i))
        // wait for login error alert to appear
        expect(
            await screen.findByText(/Incorrect username or password, please try again./i)
        ).toBeInTheDocument()
    })
})

describe('Navigate away from login page tests', function () {
    createServer(handlers)
    test('should navigate to sign up page when the user clicks Create Account', async () => {
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app,
                isGuest: true
            }
        })
        user.click(await screen.findByText(/Create Account/i))

        await waitFor(async () => {
            // wait for sign up page to appear
            expect(await screen.findByText(/Let's get started/i)).toBeInTheDocument()
        })
    })
    test('should navigate to reset password page when the user clicks Forgot Password', async () => {
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app,
                isGuest: true
            }
        })
        user.click(screen.getByText(/forgot password/i))

        // wait for sign up page to appear
        expect(
            await screen.findByText(
                /Enter your email to receive instructions on how to reset your password/i
            )
        ).toBeInTheDocument()
    })
})
