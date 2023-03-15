/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders} from '../../utils/test-utils'
import {rest} from 'msw'
import AccountAddresses from './addresses'
import {
    mockedRegisteredCustomerWithNoAddress,
    mockedRegisteredCustomer
} from '../../commerce-api/mock-data'
import {useCurrentCustomer} from '../../hooks/use-current-customer'

let mockCustomer = {}

const mockToastSpy = jest.fn()
jest.mock('@chakra-ui/toast', () => {
    return {
        useToast: jest.fn(() => mockToastSpy)
    }
})

const MockedComponent = () => {
    const {data: customer} = useCurrentCustomer()
    return (
        <div>
            <span>Customer Id:</span> {customer.customerId}
            <AccountAddresses />
        </div>
    )
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
})
afterEach(() => {
    localStorage.clear()
})

test('Allows customer to add addresses', async () => {
    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomerWithNoAddress))
        )
    )
    renderWithProviders(<MockedComponent />)

    await waitFor(() => {
        expect(screen.getByText(/no saved addresses/i)).toBeInTheDocument()
    })

    user.click(screen.getByText(/add address/i))
    user.type(screen.getByLabelText('First Name'), 'Test')
    user.type(screen.getByLabelText('Last Name'), 'McTester')
    user.type(screen.getByLabelText('Phone'), '7275551234')
    user.type(screen.getByLabelText('Address'), '123 Main St')
    user.type(screen.getByLabelText('City'), 'Tampa')
    user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
    user.type(screen.getByLabelText('Zip Code'), '33712')

    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        )
    )
    user.click(screen.getByText(/^Save$/i))
    expect(await screen.findByText(/123 Main St/i)).toBeInTheDocument()
})

test('Allows customer to remove addresses', async () => {
    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        )
    )
    renderWithProviders(<MockedComponent />)
    await waitFor(() => expect(screen.getByText('123 Main St')).toBeInTheDocument())

    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomerWithNoAddress))
        )
    )

    user.click(screen.getByText(/remove/i))
    expect(await screen.findByText(/no saved addresses/i)).toBeInTheDocument()
})
