/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, within} from '@testing-library/react'
import {rest} from 'msw'
import {
    createPathWithDefaults,
    renderWithProviders
} from '@salesforce/retail-react-app/app/utils/test-utils'
import ResetPassword from '.'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

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
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
    jest.clearAllMocks()
    window.history.pushState({}, 'Reset Password', createPathWithDefaults('/reset-password'))
})

jest.setTimeout(20000)

test('Allows customer to go to sign in page', async () => {
    // render our test component
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    await user.click(await screen.findByText('Sign in'))

    await waitFor(() => {
        expect(window.location.pathname).toBe('/uk/en-GB/login')
    })
})

test('Allows customer to generate password token', async () => {
    global.server.use(
        rest.post('*/password/reset', (req, res, ctx) => res(ctx.delay(0), ctx.status(200)))
    )
    // render our test component
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    // enter credentials and submit
    await user.type(await screen.findByLabelText('Email'), 'foo@test.com')
    await user.click(
        within(await screen.findByTestId('sf-auth-modal-form')).getByText(/reset password/i)
    )

    await waitFor(() => {
        expect(screen.getByText(/you will receive an email/i)).toBeInTheDocument()
        expect(screen.getByText(/foo@test.com/i)).toBeInTheDocument()
    })

    await user.click(screen.getByText('Back to Sign In'))

    await waitFor(() => {
        expect(window.location.pathname).toBe('/uk/en-GB/login')
    })
})
