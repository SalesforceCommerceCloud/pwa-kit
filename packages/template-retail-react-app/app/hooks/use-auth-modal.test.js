/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {screen, within, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {
    renderWithProviders,
    createPathWithDefaults,
    guestToken,
    registerUserToken
} from '../utils/test-utils'
import {AuthModal, useAuthModal} from './use-auth-modal'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '../pages/account'
import {mockedRegisteredCustomer} from '../mocks/mock-data'
import {createServer} from '../../jest-setup'

jest.setTimeout(60000)

const mockPasswordToken = {
    email: 'foo@test.com',
    expiresInMinutes: 10,
    login: 'foo@test.com',
    resetToken: 'testresettoken'
}

let authModal = undefined
const MockedComponent = (props) => {
    const {initialView} = props
    authModal = useAuthModal(initialView || undefined)
    const match = {
        params: {pageName: 'profile'}
    }
    return (
        <Router>
            <button onClick={authModal.onOpen}>Open Modal</button>
            <AuthModal {...authModal} />
            <Route path={createPathWithDefaults('/account')}>
                <Account match={match} />
            </Route>
        </Router>
    )
}
MockedComponent.propTypes = {
    initialView: PropTypes.string
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
        path: '*/customers/password/actions/create-reset-token',
        method: 'post',
        res: () => {
            return mockPasswordToken
        }
    }
]
// Set up and clean up
beforeEach(() => {
    authModal = undefined
})
afterEach(() => {
    localStorage.clear()
    jest.resetModules()
})

describe('useAuthModal', function () {
    const {prependHandlersToServer} = createServer(handlers)
    test('Renders login modal by default', async () => {
        renderWithProviders(<MockedComponent />)

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        user.click(trigger)

        expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
        expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })

    // TODO: Fix flaky/broken test
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('Renders error when given incorrect log in credentials', async () => {
        // render our test component
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                bypassAuth: false
            }
        })

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        user.click(trigger)

        // enter credentials and submit
        user.type(screen.getByLabelText('Email'), 'bad@test.com')
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
                status: 404,
                res: () => {
                    return {message: 'Not Found.'}
                }
            }
        ])

        user.click(screen.getByText(/sign in/i))
        // give it some time to show the error in the form
        await waitFor(
            () => {
                // wait for login error alert to appear
                expect(
                    screen.getByText(
                        /something's not right with your email or password\. try again\./i
                    )
                ).toBeInTheDocument()
            },
            {
                timeout: 10000
            }
        )
    })

    // TODO: investigate why this test is failing when running with other tests
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('Allows customer to create an account', async () => {
        // render our test component
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                bypassAuth: true
            }
        })

        // open the modal
        const trigger = screen.getByText('Open Modal')

        user.click(trigger)
        let form
        await waitFor(() => {
            form = screen.queryByTestId('sf-auth-modal-form')
            expect(form).toBeInTheDocument()
        })
        const createAccount = screen.getByText(/create account/i)
        user.click(createAccount)
        let registerForm
        await waitFor(() => {
            registerForm = screen.getByTestId('sf-auth-modal-form-register')
            expect(registerForm).toBeInTheDocument()
        })

        const withinForm = within(registerForm)
        // fill out form and submit
        await waitFor(() => {
            const firstName = withinForm.getByLabelText(/First Name/i)
            expect(firstName).toBeInTheDocument()
        })

        user.paste(withinForm.getByLabelText('First Name'), 'Tester')
        user.paste(withinForm.getByLabelText('Last Name'), 'Tester')
        user.paste(withinForm.getByPlaceholderText(/you@email.com/i), 'customer@test.com')
        user.paste(withinForm.getAllByLabelText(/password/i)[0], 'Password!1')

        // login with credentials
        prependHandlersToServer([
            {
                path: '*/oauth2/login',
                method: 'post',
                res: () => {
                    return mockedRegisteredCustomer
                }
            },
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
            },
            {
                path: '*/customers/:customerId',
                res: () => {
                    return mockedRegisteredCustomer
                }
            }
        ])
        const submitButton = withinForm.getByText(/create account/i)
        user.click(submitButton)

        await waitFor(() => {
            expect(form).not.toBeInTheDocument()
        })
        // wait for success state to appear
        await waitFor(
            () => {
                expect(window.location.pathname).toBe('/uk/en-GB/account')
                const myAccount = screen.getAllByText(/My Account/)
                expect(myAccount).toHaveLength(2)
            },
            {
                timeout: 5000
            }
        )
    })

    // TODO: investingate why this test is failing when running with other tests
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('Allows customer to sign in to their account', async () => {
        // render our test component
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                bypassAuth: false
            }
        })

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        user.click(trigger)

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

        // allow time to transition to account page
        await waitFor(
            () => {
                expect(window.location.pathname).toBe('/uk/en-GB/account')
                expect(screen.getByText(/My Profile/i)).toBeInTheDocument()
            },
            {timeout: 5000}
        )
    })

    describe('Reset password', function () {
        test.skip('Allows customer to generate password token', async () => {
            prependHandlersToServer([
                {
                    path: '*/customers/password/actions/create-reset-token',
                    method: 'post',
                    res: () => {
                        return mockPasswordToken
                    }
                }
            ])
            // render our test component
            renderWithProviders(<MockedComponent initialView="password" />, {
                wrapperProps: {
                    bypassAuth: false
                }
            })

            // open the modal
            const trigger = screen.getByText(/open modal/i)
            user.click(trigger)
            expect(authModal.isOpen).toBe(true)

            // enter credentials and submit
            // const withinForm = within(screen.getByTestId('sf-auth-modal-form'))

            let resetPwForm = await screen.findByTestId('sf-auth-modal-form-reset-pw')
            expect(resetPwForm).toBeInTheDocument()
            const withinForm = within(resetPwForm)
            user.type(withinForm.getByLabelText('Email'), 'foo@test.com')
            user.click(withinForm.getByText(/reset password/i))

            // wait for success state
            await waitFor(() => {
                expect(screen.getByText(/password reset/i)).toBeInTheDocument()
                expect(screen.getByText(/foo@test.com/i)).toBeInTheDocument()
            })
        })

        // TODO: Fix flaky/broken test
        // eslint-disable-next-line jest/no-disabled-tests
        test.skip('Allows customer to open generate password token modal from everywhere', () => {
            // render our test component
            renderWithProviders(<MockedComponent initialView="password" />)

            // open the modal
            const trigger = screen.getByText(/open modal/i)
            user.click(trigger)
            expect(authModal.isOpen).toBe(true)

            const withinForm = within(screen.getByTestId('sf-auth-modal-form'))

            expect(withinForm.getByText(/Reset Password/i)).toBeInTheDocument()

            // close the modal
            const switchToSignIn = screen.getByText(/Sign in/i)
            user.click(switchToSignIn)

            // check that the modal is closed
            expect(authModal.isOpen).toBe(false)
        })
    })
})
