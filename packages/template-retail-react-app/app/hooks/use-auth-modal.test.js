/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {screen, within, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders, createPathWithDefaults} from '../utils/test-utils'
import {AuthModal, useAuthModal} from './use-auth-modal'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '../pages/account'
import {rest} from 'msw'

jest.mock('../commerce-api/einstein')

const mockPasswordToken = {
    email: 'foo@test.com',
    expiresInMinutes: 10,
    login: 'foo@test.com',
    resetToken: 'testresettoken'
}

const mockRegisteredCustomer = {
    authType: 'registered',
    customerId: 'registeredCustomerId',
    customerNo: 'testno',
    email: 'customer@test.com',
    firstName: 'Tester',
    lastName: 'Testing',
    login: 'customer@test.com'
}

const mockLogin = jest.fn()

jest.mock('../commerce-api/auth', () => {
    return jest.fn().mockImplementation(() => {
        return {
            login: mockLogin,
            isTokenValid: true
        }
    })
})

jest.mock('../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../commerce-api/utils')
    return {
        ...originalModule,
        isTokenExpired: jest.fn().mockReturnValue(false),
        hasSFRAAuthStateChanged: jest.fn().mockReturnValue(false),
        createGetTokenBody: jest.fn().mockReturnValue({
            grantType: 'test',
            code: 'test',
            usid: 'test',
            codeVerifier: 'test',
            redirectUri: 'http://localhost/test'
        })
    }
})

jest.mock('../commerce-api/pkce', () => {
    return {
        createCodeVerifier: jest.fn().mockReturnValue('codeverifier'),
        generateCodeChallenge: jest.fn().mockReturnValue('codechallenge')
    }
})

let authModal = undefined
const MockedComponent = (props) => {
    const {initialView} = props
    authModal = initialView ? useAuthModal(initialView) : useAuthModal()
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

// Set up and clean up
beforeEach(() => {
    authModal = undefined
    global.server.use(
        rest.post('*/customers', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockRegisteredCustomer))
        }),
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockRegisteredCustomer))
        }),
        rest.post('*/customers/password/actions/create-reset-token', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockPasswordToken))
        })
    )
})
afterEach(() => {
    localStorage.clear()
    jest.resetModules()
})

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

test('Allows customer to sign in to their account', async () => {
    mockLogin.mockImplementationOnce(async () => {
        return {url: '/callback', customerId: 'registeredCustomerId'}
    })
    // render our test component
    renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    // enter credentials and submit
    user.type(screen.getByLabelText('Email'), 'customer@test.com')
    user.type(screen.getByLabelText('Password'), 'Password!1')
    user.click(screen.getByText(/sign in/i))

    // wait for successful toast to appear
    await waitFor(
        () => {
            expect(screen.getByText(/Welcome Tester/i)).toBeInTheDocument()
            expect(screen.getByText(/you're now signed in/i)).toBeInTheDocument()
        },
        {timeout: 20000}
    )
})

test('Renders error when given incorrect log in credentials', async () => {
    mockLogin.mockImplementationOnce(async () => {
        throw new Error('invalid credentials')
    })

    // render our test component
    renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    // enter credentials and submit
    user.type(screen.getByLabelText('Email'), 'bad@test.com')
    user.type(screen.getByLabelText('Password'), 'SomeFakePassword1!')
    user.click(screen.getByText(/sign in/i))

    // wait for login error alert to appear
    expect(
        await screen.findByText(/something's not right with your email or password\. try again\./i)
    ).toBeInTheDocument()
})

test('Allows customer to generate password token', async () => {
    // render our test component
    renderWithProviders(<MockedComponent initialView="password" />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)
    expect(authModal.isOpen).toBe(true)

    // enter credentials and submit
    const withinForm = within(screen.getByTestId('sf-auth-modal-form'))
    user.type(withinForm.getByLabelText('Email'), 'foo@test.com')
    user.click(withinForm.getByText(/reset password/i))

    // wait for success state
    await waitFor(() => {
        expect(screen.getByText(/password reset/i)).toBeInTheDocument()
        expect(screen.getByText(/foo@test.com/i)).toBeInTheDocument()
    })
})

test('Allows customer to open generate password token modal from everywhere', () => {
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

test('Allows customer to create an account', async () => {
    jest.setTimeout(30000)
    mockLogin.mockImplementationOnce(async () => {
        return {url: '/callback', customerId: 'registeredCustomerId'}
    })
    // render our test component
    renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText('Open Modal')

    user.click(trigger)

    // switch to 'create account' view
    user.click(screen.getByText(/create account/i))

    // fill out form and submit
    const withinForm = within(screen.getByTestId('sf-auth-modal-form'))

    user.paste(withinForm.getByLabelText('First Name'), 'Tester')
    user.paste(withinForm.getByLabelText('Last Name'), 'Tester')
    user.paste(withinForm.getByPlaceholderText(/you@email.com/i), 'customer@test.com')
    user.paste(withinForm.getAllByLabelText(/password/i)[0], 'Password!1')
    user.click(withinForm.getByText(/create account/i))

    await waitFor(
        () => {
            expect(screen.getAllByText(/customer@test.com/i).length).toEqual(1)
        },
        {timeout: 20000}
    )
})
