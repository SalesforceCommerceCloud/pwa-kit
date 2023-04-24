/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {Route, Switch} from 'react-router-dom'
import {rest} from 'msw'
import {renderWithProviders, createPathWithDefaults} from '../../utils/test-utils'
import Confirmation from './confirmation'
import {mockOrder, mockProducts} from './confirmation.mock'
import {createServer} from '../../../jest-setup'

const MockedComponent = () => {
    return (
        <Switch>
            <Route path={createPathWithDefaults('/checkout/confirmation/:orderNo')}>
                <Confirmation />
            </Route>
        </Switch>
    )
}

const handlers = [
    {
        path: '*/orders/:orderId',
        res: () => {
            return mockOrder
        }
    },
    {
        path: '*/products',
        res: () => {
            return mockProducts
        }
    }
]

beforeEach(() => {
    window.history.pushState(
        {},
        'Checkout',
        createPathWithDefaults('/checkout/confirmation/000123')
    )
})

describe('Confirmation checkout', function () {
    const {prependHandlersToServer} = createServer(handlers)
    test('Renders the order detail', async () => {
        renderWithProviders(<MockedComponent />)
        const el = await screen.findByText(mockOrder.orderNo)
        expect(el).toBeInTheDocument()
    })

    test('Renders the Create Account form for guest customer', async () => {
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {isGuest: true}
        })

        const button = await screen.findByRole('button', {name: /create account/i})
        expect(button).toBeInTheDocument()

        // Email should already have been auto-filled
        const email = await screen.findByText(mockOrder.customerInfo.email)
        expect(email).toBeInTheDocument()

        const password = screen.getByLabelText('Password')
        expect(password).toBeInTheDocument()
    })

    test('Create Account form - renders error message', async () => {
        prependHandlersToServer([
            {
                path: '*/customers',
                method: 'post',
                status: 404,
                res: () => {
                    const failedAccountCreation = {
                        title: 'Login Already In Use',
                        type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/login-already-in-use',
                        detail: 'The login is already in use.'
                    }
                    return failedAccountCreation
                }
            }
        ])

        renderWithProviders(<MockedComponent />, {
            wrapperProps: {isGuest: true}
        })

        const createAccountButton = await screen.findByRole('button', {name: /create account/i})
        const passwordEl = await screen.findByLabelText('Password')
        user.type(passwordEl, 'P4ssword!')
        user.click(createAccountButton)
        const alert = await screen.findByRole('alert')
        expect(alert).toBeInTheDocument()
    })

    test('Create Account form - successful submission results in redirect to the Account page', async () => {
        prependHandlersToServer([
            {
                path: '*/customers',
                method: 'post',
                status: 200
            }
        ])

        renderWithProviders(<MockedComponent />, {
            wrapperProps: {isGuest: true}
        })

        const createAccountButton = await screen.findByRole('button', {name: /create account/i})
        const password = screen.getByLabelText('Password')

        user.type(password, 'P4ssword!')
        user.click(createAccountButton)

        await waitFor(() => {
            expect(window.location.pathname).toBe('/uk/en-GB/account')
        })
    })
})
