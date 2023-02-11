/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {screen, within, waitFor, act} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders, createPathWithDefaults} from '../utils/test-utils'
import {AuthModal, useAuthModal} from './use-auth-modal'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '../pages/account'
import {rest} from 'msw'
// import {useCustomerType} from 'commerce-sdk-react-preview'
import {mockedRegisteredCustomer} from '../commerce-api/mock-data'
jest.mock('../commerce-api/einstein')
const flushPromises = () => new Promise(setImmediate)

const mockPasswordToken = {
    email: 'foo@test.com',
    expiresInMinutes: 10,
    login: 'foo@test.com',
    resetToken: 'testresettoken'
}

jest.mock('commerce-sdk-react-preview', () => {
    const originModule = jest.requireActual('commerce-sdk-react-preview')
    return {
        ...originModule,
        useCustomerId: jest.fn().mockReturnValue('customer_id'),
        useCustomerType: jest
            .fn()
            .mockReturnValue({isRegistered: false, isGuest: true, customerType: 'guest'})
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
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        }),
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        }),
        rest.post('*/customers/password/actions/create-reset-token', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockPasswordToken))
        }),
        rest.post('*/customers/action/login', (req, res, ctx) => {
            console.log('login-----------------')
            return res(
                ctx.delay(0),
                ctx.status(200),
                ctx.json({
                    authType: 'registered',
                    customerId: 'customerid'
                })
            )
        })
    )
})
afterEach(() => {
    localStorage.clear()
    jest.resetModules()
})

test('Renders login modal by default', async () => {
    renderWithProviders(<MockedComponent />)

    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    await flushPromises()
    await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
        expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })
})

//TODO: fix this when useCustomerType and useCustomerId are aware of multi-site
test.skip('Allows customer to sign in to their account', async () => {
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
    await waitFor(() => {
        screen.logTestingPlaygroundURL()
        expect(screen.getByText(/Welcome Tester/i)).toBeInTheDocument()
        expect(screen.getByText(/you're now signed in/i)).toBeInTheDocument()
    })
})

describe('Render errors', function () {
    beforeAll(async () => {
        global.server.use(
            rest.post('*/oauth2/login', (req, res, ctx) =>
                res(ctx.delay(0), ctx.status(401), ctx.json({message: 'Invalid Credentials.'}))
            )
        )
    })
    test.skip('Renders error when given incorrect log in credentials', async () => {
        // render our test component
        await act(async () => {
            renderWithProviders(<MockedComponent />)
        })
        // open the modal
        const trigger = screen.getByText(/open modal/i)
        user.click(trigger)

        // enter credentials and submit
        user.type(screen.getByLabelText('Email'), 'bad@test.com')
        user.type(screen.getByLabelText('Password'), 'SomeFakePassword1!')
        user.click(screen.getByText(/sign in/i))

        // wait for login error alert to appear
        expect(
            await screen.findByText(
                /something's not right with your email or password\. try again\./i
            )
        ).toBeInTheDocument()
    })
})
test('Allows customer to generate password token', async () => {
    // render our test component
    renderWithProviders(<MockedComponent initialView="password" />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    await waitFor(() => {
        expect(authModal.isOpen).toBe(true)
        screen.logTestingPlaygroundURL()
    })

    // enter credentials and submit
    const withinForm = within(screen.getByTestId('sf-auth-modal-form'))
    user.type(withinForm.getByLabelText('Email'), 'foo@test.com')
    user.click(withinForm.getByText(/reset password/i))

    await flushPromises()
    // wait for success state
    await waitFor(() => {
        expect(screen.getByText(/password reset/i)).toBeInTheDocument()
        expect(
            screen.getByText(
                /You will receive an email at with a link to reset your password shortly./i
            )
        ).toBeInTheDocument()
    })
})

test('Allows customer to open generate password token modal from everywhere', async () => {
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
    await flushPromises()
    await waitFor(() => {
        // check that the modal is closed
        expect(authModal.isOpen).toBe(false)
    })
})

//TODO: fix this when useCustomerType and useCustomerId are aware of multi-site
test.skip('Allows customer to create an account', async () => {
    // render our test component
    renderWithProviders(<MockedComponent />)
    // open the modal
    const trigger = screen.getByText('Open Modal')

    user.click(trigger)
    expect(authModal.isOpen).toBe(true)

    // switch to 'create account' view
    user.click(screen.getByText(/create account/i))

    // fill out form and submit
    const withinForm = within(screen.getByTestId('sf-auth-modal-form'))

    user.paste(withinForm.getByLabelText('First Name'), 'Tester')
    user.paste(withinForm.getByLabelText('Last Name'), 'Tester')
    user.paste(withinForm.getByPlaceholderText(/you@email.com/i), 'customer@test.com')
    user.paste(withinForm.getAllByLabelText(/password/i)[0], 'Password!1')
    user.click(withinForm.getByText(/create account/i))

    await waitFor(() => {
        // successfully navigate to account page after registration
        expect(screen.getAllByText(/account details/i).length).toBeGreaterThan(0)
    })
})
