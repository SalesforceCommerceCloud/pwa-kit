/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {Route, Switch} from 'react-router-dom'
import {rest} from 'msw'
import {
    renderWithProviders,
    createPathWithDefaults
} from '@salesforce/retail-react-app/app/utils/test-utils'
import Confirmation from '@salesforce/retail-react-app/app/pages/checkout/confirmation'
import {
    mockOrder,
    mockProducts
} from '@salesforce/retail-react-app/app/pages/checkout/confirmation.mock'

const MockedComponent = () => {
    return (
        <Switch>
            <Route path={createPathWithDefaults('/checkout/confirmation/:orderNo')}>
                <Confirmation />
            </Route>
        </Switch>
    )
}

beforeEach(() => {
    global.server.use(
        rest.get('*/orders/:orderId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockOrder))
        }),
        rest.get('*/products', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockProducts))
        })
    )
    window.history.pushState(
        {},
        'Checkout',
        createPathWithDefaults('/checkout/confirmation/000123')
    )
})

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
    global.server.use(
        rest.post('*/customers', (_, res, ctx) => {
            const failedAccountCreation = {
                title: 'Login Already In Use',
                type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/login-already-in-use',
                detail: 'The login is already in use.'
            }
            return res(ctx.status(400), ctx.json(failedAccountCreation))
        })
    )

    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {isGuest: true}
    })

    const createAccountButton = await screen.findByRole('button', {name: /create account/i})
    const passwordEl = await screen.findByLabelText('Password')
    await user.type(passwordEl, 'P4ssword!')
    await user.click(createAccountButton)
    const alert = await screen.findByRole('alert')
    expect(alert).toBeInTheDocument()
})

test('Create Account form - successful submission results in redirect to the Account page', async () => {
    global.server.use(
        rest.post('*/customers', (_, res, ctx) => {
            return res(ctx.status(200))
        })
    )

    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {isGuest: true}
    })

    const createAccountButton = await screen.findByRole('button', {name: /create account/i})
    const password = screen.getByLabelText('Password')

    await user.type(password, 'P4ssword!')
    await user.click(createAccountButton)

    await waitFor(() => {
        expect(window.location.pathname).toBe('/uk/en-GB/account')
    })
})
