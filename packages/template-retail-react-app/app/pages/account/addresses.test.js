/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {
    createPathWithDefaults,
    renderWithProviders
} from '@salesforce/retail-react-app/app/utils/test-utils'
import {rest} from 'msw'
import AccountAddresses from '@salesforce/retail-react-app/app/pages/account/addresses'
import {
    mockedRegisteredCustomerWithNoAddress,
    mockedRegisteredCustomer
} from '@salesforce/retail-react-app/app/mocks/mock-data'

import {Route, Switch} from 'react-router-dom'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

let mockCustomer = {}

const MockedComponent = () => {
    return (
        <Switch>
            <Route path={createPathWithDefaults('/account/addresses')}>
                <AccountAddresses />
            </Route>
        </Switch>
    )
}

const helperAddNewAddress = async (user) => {
    await user.click(screen.getByText(/add address/i))
    await user.type(screen.getByLabelText('First Name'), 'Test')
    await user.type(screen.getByLabelText('Last Name'), 'McTester')
    await user.type(screen.getByLabelText('Phone'), '7275551234')
    await user.type(screen.getByLabelText('Address'), '123 Main St')
    await user.type(screen.getByLabelText('City'), 'Tampa')
    await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
    await user.type(screen.getByLabelText('Zip Code'), '33712')

    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        )
    )
    await user.click(screen.getByText(/^Save$/i))
}

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    mockCustomer = {
        authType: 'registered',
        customerId: 'registeredCustomerId',
        customerNo: '00151503',
        email: 'jkeane@64labs.com',
        firstName: 'John',
        lastName: 'Keane',
        login: 'jkeane@64labs.com'
    }
    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        ),
        rest.post('*/customers/:customerId/addresses', (req, res, ctx) => {
            mockCustomer.addresses = [req.body]
            return res(ctx.delay(0), ctx.status(200), ctx.json(req.body))
        }),
        rest.patch('*/customers/:customerId/addresses/:addressName', (req, res, ctx) => {
            mockCustomer.addresses[0] = req.body
            return res(ctx.delay(0), ctx.status(200), ctx.json(req.body))
        }),
        rest.delete('*/customers/:customerId/addresses/:addressName', (req, res, ctx) => {
            mockCustomer.addresses = undefined
            return res(ctx.delay(0), ctx.status(200))
        })
    )
    window.history.pushState({}, 'Account', createPathWithDefaults('/account/addresses'))
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
})

test('Allows customer to add addresses', async () => {
    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomerWithNoAddress))
        )
    )
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    await waitFor(() => {
        expect(screen.getByText(/no saved addresses/i)).toBeInTheDocument()
    })

    // Add new address
    await user.click(screen.getByText(/add address/i))

    // Address Form must be present
    expect(screen.getByLabelText('Address Form')).toBeInTheDocument()

    await user.type(screen.getByLabelText('First Name'), 'Test')
    await user.type(screen.getByLabelText('Last Name'), 'McTester')
    await user.type(screen.getByLabelText('Phone'), '7275551234')
    await user.type(screen.getByLabelText('Address'), '123 Main St')
    await user.type(screen.getByLabelText('City'), 'Tampa')
    await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
    await user.type(screen.getByLabelText('Zip Code'), '33712')

    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        )
    )
    await user.click(screen.getByText(/^Save$/i))

    expect(await screen.findByText(/123 Main St/i)).toBeInTheDocument()
})

test('Allows customer to remove addresses', async () => {
    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        )
    )
    const {user} = renderWithProviders(<MockedComponent />)
    await waitFor(() => expect(screen.getByText('123 Main St')).toBeInTheDocument())

    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomerWithNoAddress))
        )
    )

    await user.click(screen.getByText(/remove/i))
    expect(await screen.findByText(/no saved addresses/i)).toBeInTheDocument()
})

test('Handles focus for cancel/save buttons in address form correctly', async () => {
    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomerWithNoAddress))
        )
    )
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    await waitFor(() => {
        expect(screen.getByText(/no saved addresses/i)).toBeInTheDocument()
    })

    // Focus is on heading when component initially renders
    expect(document.activeElement).toBe(screen.getByRole('heading', {name: /addresses/i}))

    await helperAddNewAddress(user)

    const editBtn = screen.getByRole('button', {name: /edit/i})

    // hitting cancel button on edit form brings focus back to edit button
    await user.click(editBtn)
    await user.click(screen.getByRole('button', {name: /cancel/i}))
    expect(document.activeElement).toBe(editBtn)

    // hitting save button on edit form brings focus back to edit button
    await user.click(editBtn)
    await user.click(screen.getByRole('button', {name: /save/i}))
    expect(document.activeElement).toBe(editBtn)
})

test('Edit/Remove buttons have descriptive accessibility label', async () => {
    renderWithProviders(<MockedComponent />)
    const address = '123 Main St'
    await waitFor(() => expect(screen.getByText(address)).toBeInTheDocument())
    const editBtnByLabel = screen.getByLabelText(`Edit ${address}`)
    const removeBtnByLabel = screen.getByLabelText(`Remove ${address}`)
    expect(editBtnByLabel).toBeInTheDocument()
    expect(removeBtnByLabel).toBeInTheDocument()
})
