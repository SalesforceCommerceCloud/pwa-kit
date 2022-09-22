/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, within, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders} from '../../utils/test-utils'
import Registration from '.'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '../account'
import mockConfig from '../../../config/mocks/default'

jest.setTimeout(60000)

jest.mock('../../commerce-api/einstein')

const mockRegisteredCustomer = {
    authType: 'registered',
    customerId: 'registeredCustomerId',
    customerNo: 'testno',
    email: 'darek@test.com',
    firstName: 'Tester',
    lastName: 'Testing',
    login: 'darek@test.com'
}

const mockLogin = jest.fn()

jest.mock('../../commerce-api/auth', () => {
    return jest.fn().mockImplementation(() => {
        return {
            login: mockLogin.mockImplementation(async () => {
                throw new Error('invalid credentials')
            }),
            getLoggedInToken: jest.fn().mockImplementation(async () => {
                return {customer_id: 'mockcustomerid'}
            })
        }
    })
})

jest.mock('commerce-sdk-isomorphic', () => {
    const sdk = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...sdk,
        ShopperLogin: class ShopperLoginMock extends sdk.ShopperLogin {
            async getAccessToken() {
                return {
                    access_token: 'accesstoken',
                    refresh_token: 'refreshtoken',
                    customer_id: 'customerId'
                }
            }
            authenticateCustomer() {
                return {url: '/callback'}
            }
        },
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
            async getResetPasswordToken() {
                return {
                    email: 'foo@test.com',
                    expiresInMinutes: 10,
                    login: 'foo@test.com',
                    resetToken: 'testresettoken'
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
            <Registration />
            <Route path={'/uk/en-GB/account'}>
                <Account match={match} />
            </Route>
        </Router>
    )
}

// Set up and clean up
// Set up and clean up
beforeEach(() => {
    jest.useFakeTimers()
})
afterEach(() => {
    localStorage.clear()
    jest.resetModules()
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
})

test('Allows customer to create an account', async () => {
    mockLogin.mockImplementationOnce(async () => {
        return {url: '/callback'}
    })

    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    // fill out form and submit
    const withinForm = within(screen.getByTestId('sf-auth-modal-form'))

    user.paste(withinForm.getByLabelText('First Name'), 'Tester')
    user.paste(withinForm.getByLabelText('Last Name'), 'Tester')
    user.paste(withinForm.getByPlaceholderText(/you@email.com/i), 'customer@test.com')
    user.paste(withinForm.getAllByLabelText(/password/i)[0], 'Password!1')
    user.click(withinForm.getByText(/create account/i))

    // wait for success state to appear
    await waitFor(() => {
        expect(screen.getAllByText(/My Account/).length).toEqual(2)
    })
})
