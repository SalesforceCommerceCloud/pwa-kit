/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {renderWithProviders, createPathWithDefaults, setupMockServer} from '../../utils/test-utils'
import Login from '.'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '../account'
import Registration from '../registration'
import ResetPassword from '../reset-password'
import mockConfig from '../../../config/mocks/default'

jest.setTimeout(60000)

const mockRegisteredCustomer = {
    authType: 'registered',
    customerId: 'registeredCustomerId',
    customerNo: 'testno',
    email: 'darek@test.com',
    firstName: 'Tester',
    lastName: 'Testing',
    login: 'darek@test.com'
}

const mockMergedBasket = {
    basketId: 'a10ff320829cb0eef93ca5310a',
    currency: 'USD',
    customerInfo: {
        customerId: 'registeredCustomerId',
        email: 'darek@test.com'
    }
}

jest.mock('commerce-sdk-isomorphic', () => {
    const sdk = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...sdk,
        ShopperCustomers: class ShopperCustomersMock extends sdk.ShopperCustomers {
            async registerCustomer() {
                return mockRegisteredCustomer
            }

            async getCustomer(args) {
                if (args.parameters.customerId === 'customerid') {
                    return {
                        authType: 'guest',
                        customerId: 'customerid'
                    }
                }
                return mockRegisteredCustomer
            }

            async authorizeCustomer() {
                return {
                    headers: {
                        get(key) {
                            return {authorization: 'guestToken'}[key]
                        }
                    },
                    json: async () => ({
                        authType: 'guest',
                        customerId: 'customerid'
                    })
                }
            }
        }
    }
})

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true),
        createGetTokenBody: jest.fn().mockReturnValue({
            grantType: 'test',
            code: 'test',
            usid: 'test',
            codeVerifier: 'test',
            redirectUri: 'http://localhost/test'
        })
    }
})

jest.mock('../../commerce-api/pkce', () => {
    return {
        createCodeVerifier: jest.fn().mockReturnValue('codeverifier'),
        generateCodeChallenge: jest.fn().mockReturnValue('codechallenge')
    }
})

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

const server = setupMockServer()

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    server.listen({
        onUnhandledRequest: 'error'
    })
})
afterEach(() => {
    localStorage.clear()
    server.resetHandlers()
})
afterAll(() => server.close())

test('Allows customer to sign in to their account', async () => {
    server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.json({authType: 'registered', email: 'darek@test.com'}))
        ),
        rest.post('*/baskets/actions/merge', (req, res, ctx) => {
            res(ctx.delay(0), ctx.json(mockMergedBasket))
        })
    )
    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: 'en-GB', appConfig: mockConfig.app}
    })

    // enter credentials and submit
    user.type(screen.getByLabelText('Email'), 'darek@test.com')
    user.type(screen.getByLabelText('Password'), 'Password!1')
    user.click(screen.getByText(/sign in/i))

    // wait for success state to appear
    expect(await screen.findByText(/Welcome Back/i, {}, {timeout: 30000})).toBeInTheDocument()
    expect(await screen.findByText(/darek@test.com/i, {}, {timeout: 30000})).toBeInTheDocument()
})

test('Renders error when given incorrect log in credentials', async () => {
    // mock failed auth request
    server.use(
        rest.post('*/oauth2/login', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(401), ctx.json({message: 'Invalid Credentials.'}))
        )
    )

    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: 'en-GB', appConfig: mockConfig.app}
    })

    // enter credentials and submit
    user.type(screen.getByLabelText('Email'), 'foo@test.com')
    user.type(screen.getByLabelText('Password'), 'SomeFakePassword1!')
    user.click(screen.getByText(/sign in/i))

    // wait for login error alert to appear
    expect(
        await screen.findByText(
            /Incorrect username or password, please try again./i,
            {},
            {timeout: 12000}
        )
    ).toBeInTheDocument()
})

test('should navigate to sign in page when the user clicks Create Account', async () => {
    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: 'en-GB', appConfig: mockConfig.app}
    })
    user.click(screen.getByText(/Create Account/i))

    // wait for sign up page to appear
    expect(await screen.findByText(/Let's get started/i, {}, {timeout: 12000})).toBeInTheDocument()
})

test('should navigate to reset password page when the user clicks Forgot Password', async () => {
    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: 'en-GB', appConfig: mockConfig.app}
    })
    user.click(screen.getByText(/forgot password/i))

    // wait for sign up page to appear
    expect(
        await screen.findByText(
            /Enter your email to receive instructions on how to reset your password/i,
            {},
            {timeout: 12000}
        )
    ).toBeInTheDocument()
})
