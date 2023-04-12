/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, within} from '@testing-library/react'
import user from '@testing-library/user-event'
import {createPathWithDefaults, renderWithProviders} from '../../utils/test-utils'
import ResetPassword from '.'
import mockConfig from '../../../config/mocks/default'
import {createServer} from '../../../jest-setup'
import {mockCustomerBaskets} from '../../mocks/mock-data'

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

const handlers = [
    {
        path: '*/customers',
        method: 'post',
        res: () => {
            return mockRegisteredCustomer
        }
    },
    {
        path: '*/customers/:customerId',
        res: () => {
            return mockRegisteredCustomer
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

    window.history.pushState({}, 'Reset Password', createPathWithDefaults('/reset-password'))
})

afterEach(() => {
    jest.resetModules()
    localStorage.clear()

    window.history.pushState({}, 'Reset Password', createPathWithDefaults('/reset-password'))
})

describe('Reset password', function () {
    const {prependHandlersToServer} = createServer(handlers)
    test('should allow customer to go to sign in page', async () => {
        // render our test component
        await renderWithProviders(<MockedComponent />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })

        user.click(await screen.findByText('Sign in'))

        await waitFor(() => {
            expect(window.location.pathname).toEqual('/uk/en-GB/login')
        })
    })

    test('should allow customer to generate password token', async () => {
        prependHandlersToServer([
            {
                path: '*/create-reset-token',
                method: 'post',
                res: () => {
                    return {
                        email: 'foo@test.com',
                        expiresInMinutes: 10,
                        login: 'foo@test.com',
                        resetToken: 'testresettoken'
                    }
                }
            }
        ])
        // render our test component
        await renderWithProviders(<MockedComponent />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })

        // enter credentials and submit
        user.type(await screen.findByLabelText('Email'), 'foo@test.com')
        user.click(
            within(await screen.findByTestId('sf-auth-modal-form')).getByText(/reset password/i)
        )

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
        prependHandlersToServer([
            {
                path: '*/create-reset-token',
                method: 'post',
                status: 500,
                res: () => {
                    return {
                        detail: 'Something went wrong',
                        title: 'Error',
                        type: '/error'
                    }
                }
            }
        ])
        await renderWithProviders(<MockedComponent />)

        user.type(await screen.findByLabelText('Email'), 'foo@test.com')
        user.click(
            within(await screen.findByTestId('sf-auth-modal-form')).getByText(/reset password/i)
        )

        await waitFor(() => {
            expect(screen.getByText('500 Internal Server Error')).toBeInTheDocument()
        })
    })
})
