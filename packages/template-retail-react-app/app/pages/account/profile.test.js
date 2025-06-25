/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, within} from '@testing-library/react'
import {
    createPathWithDefaults,
    renderWithProviders
} from '@salesforce/retail-react-app/app/utils/test-utils'
import {rest} from 'msw'
import AccountDetail from '@salesforce/retail-react-app/app/pages/account/profile'
import {
    mockedRegisteredCustomerWithNoNumber,
    mockedRegisteredCustomer
} from '@salesforce/retail-react-app/app/mocks/mock-data'

import {Route, Switch} from 'react-router-dom'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import * as sdk from '@salesforce/commerce-sdk-react'

let mockCustomer = {}

const MockedComponent = () => {
    return (
        <Switch>
            <Route path={createPathWithDefaults('/account')}>
                <AccountDetail />
            </Route>
        </Switch>
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
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    await waitFor(() => {
        expect(screen.getByText(/Account Details/i)).toBeInTheDocument()
    })

    const profileCard = screen.getByTestId('sf-toggle-card-my-profile')
    // Change phone number
    await user.click(within(profileCard).getByText(/edit/i))

    // Profile Form must be present
    expect(screen.getByLabelText('Profile Form')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Phone Number'), '7275551234')

    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        )
    )
    await user.click(screen.getByText(/^Save$/i))

    await waitFor(() => {
        expect(screen.getByText(/Profile updated/i)).toBeInTheDocument()
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
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    await waitFor(() => {
        expect(screen.getByText(/Account Details/i)).toBeInTheDocument()
    })

    await screen.getByTestId('sf-toggle-card-my-profile')

    // Edit functionality should NOT be available
    expect(screen.queryByText(/edit/i)).not.toBeInTheDocument()

    expect(screen.queryByText(/Password/i)).not.toBeInTheDocument()
})
