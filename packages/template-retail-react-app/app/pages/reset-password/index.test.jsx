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

const mockUseRouteMatch = jest.fn(() => ({path: '/'}))

jest.mock('react-router', () => {
    const original = jest.requireActual('react-router')
    return {
        ...original,
        useRouteMatch: () => mockUseRouteMatch()
    }
})

const MockedComponent = () => {
    return (
        <div>
            <ResetPassword />
        </div>
    )
}

// Set up and clean up
beforeEach(() => {
    // Reset useRouteMatch mock to return path based on window.location.pathname
    mockUseRouteMatch.mockImplementation(() => ({
        path: typeof window !== 'undefined' && window.location ? window.location.pathname : '/'
    }))
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

test.each([
    ['no callback_uri is registered for client', 'This feature is not currently available.'],
    [
        'Too many password reset requests were made. Please try again later.',
        'You reached the limit for password resets. For your security, wait 10 minutes and try again.'
    ],
    ['unexpected error message', 'Something went wrong. Try again!']
])(
    'displays correct error message when password reset fails with "%s"',
    async (apiErrorMessage, expectedMessage) => {
        global.server.use(
            rest.post('*/oauth2/password/reset', (req, res, ctx) =>
                res(ctx.delay(0), ctx.status(400), ctx.json({message: apiErrorMessage}))
            )
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
            expect(screen.getByText(expectedMessage)).toBeInTheDocument()
        })
    }
)

test.each([
    ['base path', '/reset-password-landing'],
    ['path with site and locale', '/uk/en-GB/reset-password-landing']
])('renders reset password landing page when using %s', async (_, landingPath) => {
    window.history.pushState({}, 'Reset Password', createPathWithDefaults(landingPath))

    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    // check if the landing page is rendered
    await waitFor(() => {
        expect(screen.getByText(/confirm new password/i)).toBeInTheDocument()
    })
})
