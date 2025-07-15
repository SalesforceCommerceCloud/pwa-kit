/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {act, screen, waitFor, within} from '@testing-library/react'
import {createPathWithDefaults, renderWithProviders} from '../../utils/test-utils'
import {rest} from 'msw'
import AccountDetail from '../../pages/account/profile'
import {mockedRegisteredCustomerWithNoNumber, mockedRegisteredCustomer} from '../../mocks/mock-data'
import Toaster, {toaster} from '../../components/toaster'

import {Route, Switch} from 'react-router-dom'
import mockConfig from '../../mock-config'
import * as sdk from '@salesforce/commerce-sdk-react'

const MockedComponent = () => {
    return (
        <>
            <Switch>
                <Route path={createPathWithDefaults('/account')}>
                    <AccountDetail />
                </Route>
            </Switch>
            <Toaster toaster={toaster} />
        </>
    )
}

jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useCustomerType: jest.fn()
}))

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        ),
        rest.patch('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(req.body))
        })
    )
    window.history.pushState({}, 'Account', createPathWithDefaults('/account/addresses'))
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
})

test('Allows customer to edit phone number', async () => {
    sdk.useCustomerType.mockReturnValue({isRegistered: true, isExternal: false})

    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomerWithNoNumber))
        )
    )
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig}
    })

    await waitFor(() => {
        expect(screen.getByText(/Account Details/i)).toBeInTheDocument()
    })

    const profileCard = screen.getByTestId('sf-toggle-card-my-profile')
    await act(async () => {
        // Change phone number
        await user.click(within(profileCard).getByText(/edit/i))
    })

    // Profile Form must be present
    expect(screen.getByLabelText('Profile Form')).toBeInTheDocument()

    await act(async () => {
        await user.type(screen.getByLabelText('Phone Number'), '7275551234')
    })
    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        )
    )

    await act(async () => {
        await user.click(screen.getByText(/^Save$/i))
    })
    await waitFor(() => {
        // Toast messages are rendered in a portal, so we need to search within document.body
        expect(within(document.body).getByText(/Profile updated/i)).toBeInTheDocument()
        expect(screen.getByText(/555-1234/i)).toBeInTheDocument()
    })
})

test('Non ECOM user cannot see the password card', async () => {
    sdk.useCustomerType.mockReturnValue({isRegistered: true, isExternal: true})

    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomerWithNoNumber))
        )
    )
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig}
    })

    await waitFor(() => {
        expect(screen.getByText(/Account Details/i)).toBeInTheDocument()
    })

    await screen.getByTestId('sf-toggle-card-my-profile')

    // Edit functionality should NOT be available
    expect(screen.queryByText(/edit/i)).not.toBeInTheDocument()

    expect(screen.queryByText(/Password/i)).not.toBeInTheDocument()
})
