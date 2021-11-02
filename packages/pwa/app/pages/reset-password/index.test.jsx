/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, within} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders} from '../../utils/test-utils'
import ResetPassword from '.'
import {ShopperCustomers} from 'commerce-sdk-isomorphic'

jest.setTimeout(60000)

const response = {
    email: 'foo@test.com',
    expiresInMinutes: 10,
    login: 'foo@test.com',
    resetToken: 'testresettoken'
}

const mockCustomer = {
    authType: 'registered',
    customerId: 'registeredCustomerId'
}

jest.mock('../../commerce-api/auth', () => {
    return class AuthMock {
        login() {
            return mockCustomer
        }
    }
})

jest.mock('commerce-sdk-isomorphic', () => {
    const sdk = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...sdk,
        ShopperCustomers: jest.fn()
    }
})

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})

test('Allows customer to generate password token', async () => {
    ShopperCustomers.mockImplementation(() => {
        return {
            async getResetPasswordToken() {
                return {
                    email: 'foo@test.com',
                    expiresInMinutes: 10,
                    login: 'foo@test.com',
                    resetToken: 'testresettoken'
                }
            }
        }
    })

    // render our test component
    renderWithProviders(<ResetPassword />)

    // enter credentials and submit
    user.type(screen.getByLabelText('Email'), 'foo@test.com')
    user.click(within(screen.getByTestId('sf-auth-modal-form')).getByText(/reset password/i))

    // wait for success state
    expect(await screen.findByText(/password reset/i)).toBeInTheDocument()
    expect(screen.getByText(/foo@test.com/i)).toBeInTheDocument()
})

test('Renders error message from server', async () => {
    ShopperCustomers.mockImplementation(() => {
        return {
            async getResetPasswordToken() {
                return {
                    detail: 'Something went wrong',
                    title: 'Error',
                    type: '/error'
                }
            }
        }
    })

    renderWithProviders(<ResetPassword />)

    user.type(screen.getByLabelText('Email'), 'foo@test.com')
    user.click(within(screen.getByTestId('sf-auth-modal-form')).getByText(/reset password/i))

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
})
