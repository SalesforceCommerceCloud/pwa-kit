/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, within} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {createPathWithDefaults, renderWithProviders} from '../../utils/test-utils'
import ResetPassword from '.'
import mockConfig from '../../../config/mocks/default'

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

const MockedComponent = () => {
    return (
        <div>
            <ResetPassword />
        </div>
    )
}

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    window.history.pushState({}, 'Reset Password', createPathWithDefaults('/reset-password'))
    global.server.use(
        rest.post('*/customers', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockRegisteredCustomer))
        }),
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            const {customerId} = req.params
            if (customerId === 'customerId') {
                return res(
                    ctx.delay(0),
                    ctx.status(200),
                    ctx.json({
                        authType: 'guest',
                        customerId: 'customerid'
                    })
                )
            }
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockRegisteredCustomer))
        })
    )
})
afterEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
    window.history.pushState({}, 'Reset Password', createPathWithDefaults('/reset-password'))
})

test('Allows customer to go to sign in page', async () => {
    // render our test component
    await renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    user.click(await screen.findByText('Sign in'))

    await waitFor(() => {
        expect(window.location.pathname).toEqual('/uk/en-GB/login')
    })
})

test('Allows customer to generate password token', async () => {
    global.server.use(
        rest.post('*/create-reset-token', (req, res, ctx) =>
            res(
                ctx.delay(0),
                ctx.json({
                    email: 'foo@test.com',
                    expiresInMinutes: 10,
                    login: 'foo@test.com',
                    resetToken: 'testresettoken'
                })
            )
        )
    )
    // render our test component
    await renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    // enter credentials and submit
    user.type(await screen.findByLabelText('Email'), 'foo@test.com')
    user.click(within(await screen.findByTestId('sf-auth-modal-form')).getByText(/reset password/i))

    expect(await screen.findByText(/password reset/i, {}, {timeout: 12000})).toBeInTheDocument()

    await waitFor(() => {
        expect(screen.getByText(/foo@test.com/i)).toBeInTheDocument()
    })

    await waitFor(() => {
        user.click(screen.getByText('Back to Sign In'))
    })

    await waitFor(() => {
        expect(window.location.pathname).toEqual('/uk/en-GB/login')
    })
})

test('Renders error message from server', async () => {
    global.server.use(
        rest.post('*/create-reset-token', (req, res, ctx) =>
            res(
                ctx.delay(0),
                ctx.status(500),
                ctx.json({
                    detail: 'Something went wrong',
                    title: 'Error',
                    type: '/error'
                })
            )
        )
    )
    await renderWithProviders(<MockedComponent />)

    user.type(await screen.findByLabelText('Email'), 'foo@test.com')
    user.click(within(await screen.findByTestId('sf-auth-modal-form')).getByText(/reset password/i))

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
})
