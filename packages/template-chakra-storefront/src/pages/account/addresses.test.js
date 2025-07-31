/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {act, screen, waitFor} from '@testing-library/react'
import {createPathWithDefaults, renderWithProviders} from '../../utils/test-utils'
import AccountAddresses from '../../pages/account/addresses'
import {
    mockedRegisteredCustomerWithNoAddress,
    mockedRegisteredCustomer
} from '../../../mocks/mock-data'
import {prependHandlersToServer} from '../../../jest-setup'

import {Route, Switch} from 'react-router-dom'
import mockConfig from '../../../config/mocks/mock-config'

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
    await act(async () => {
        await user.click(screen.getByText(/add address/i))
    })
    await act(async () => {
        await user.type(screen.getByLabelText('First Name'), 'Test')
        await user.type(screen.getByLabelText('Last Name'), 'McTester')
        await user.type(screen.getByLabelText('Phone'), '7275551234')
        await user.type(screen.getByLabelText('Address'), '123 Main St')
        await user.type(screen.getByLabelText('City'), 'Tampa')
    })

    await act(async () => {
        await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
        await user.type(screen.getByLabelText('Zip Code'), '33712')
    })

    prependHandlersToServer([
        {
            path: '*/customers/:customerId',
            method: 'get',
            delay: 0,
            status: 200,
            res: () => mockedRegisteredCustomer
        }
    ])
    await act(async () => {
        await user.click(screen.getByText(/^Save$/i))
    })
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
    prependHandlersToServer([
        {
            path: '*/customers/:customerId',
            method: 'get',
            delay: 0,
            status: 200,
            res: () => mockedRegisteredCustomer
        },
        {
            path: '*/customers/:customerId/addresses',
            method: 'post',
            delay: 0,
            status: 200,
            res: (req) => {
                mockCustomer.addresses = [req.body]
                return req.body
            }
        },
        {
            path: '*/customers/:customerId/addresses/:addressName',
            method: 'patch',
            delay: 0,
            status: 200,
            res: (req) => {
                mockCustomer.addresses[0] = req.body
                return req.body
            }
        },
        {
            path: '*/customers/:customerId/addresses/:addressName',
            method: 'delete',
            delay: 0,
            status: 200,
            res: () => {
                mockCustomer.addresses = undefined
                return {}
            }
        }
    ])
    window.history.pushState({}, 'Account', createPathWithDefaults('/account/addresses'))
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
})

test('Allows customer to add addresses', async () => {
    prependHandlersToServer([
        {
            path: '*/customers/:customerId',
            method: 'get',
            delay: 0,
            status: 200,
            res: () => mockedRegisteredCustomerWithNoAddress
        }
    ])
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', config: mockConfig}
    })

    await waitFor(() => {
        expect(screen.getByText(/no saved addresses/i)).toBeInTheDocument()
    })

    await act(async () => {
        // Add new address
        await user.click(screen.getByText(/add address/i))
    })
    // Address Form must be present
    expect(screen.getByLabelText('Address Form')).toBeInTheDocument()

    await act(async () => {
        await user.type(screen.getByLabelText('First Name'), 'Test')
        await user.type(screen.getByLabelText('Last Name'), 'McTester')
        await user.type(screen.getByLabelText('Phone'), '7275551234')
        await user.type(screen.getByLabelText('Address'), '123 Main St')
        await user.type(screen.getByLabelText('City'), 'Tampa')
        await user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
        await user.type(screen.getByLabelText('Zip Code'), '33712')
    })

    prependHandlersToServer([
        {
            path: '*/customers/:customerId',
            method: 'get',
            delay: 0,
            status: 200,
            res: () => mockedRegisteredCustomer
        }
    ])
    await waitFor(async () => {
        await user.click(screen.getByText(/^Save$/i))
    })

    expect(await screen.findByText(/123 Main St/i)).toBeInTheDocument()
})

test('Allows customer to remove addresses', async () => {
    prependHandlersToServer([
        {
            path: '*/customers/:customerId',
            method: 'get',
            delay: 0,
            status: 200,
            res: () => mockedRegisteredCustomer
        }
    ])
    const {user} = renderWithProviders(<MockedComponent />)
    await waitFor(() => expect(screen.getByText('123 Main St')).toBeInTheDocument())

    prependHandlersToServer([
        {
            path: '*/customers/:customerId',
            method: 'get',
            delay: 0,
            status: 200,
            res: () => mockedRegisteredCustomerWithNoAddress
        }
    ])

    await act(async () => {
        await user.click(screen.getByText(/remove/i))
    })
    expect(await screen.findByText(/no saved addresses/i)).toBeInTheDocument()
})

test('Handles focus for cancel/save buttons in address form correctly', async () => {
    prependHandlersToServer([
        {
            path: '*/customers/:customerId',
            method: 'get',
            delay: 0,
            status: 200,
            res: () => mockedRegisteredCustomerWithNoAddress
        }
    ])
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', config: mockConfig}
    })

    await waitFor(() => {
        expect(screen.getByText(/no saved addresses/i)).toBeInTheDocument()
    })

    // Focus is on heading when component initially renders
    expect(document.activeElement).toBe(screen.getByRole('heading', {name: /addresses/i}))

    await helperAddNewAddress(user)

    const editBtn = screen.getByRole('button', {name: /edit/i})

    await act(async () => {
        // hitting cancel button on edit form brings focus back to edit button
        await user.click(editBtn)
    })
    await act(async () => {
        await user.click(screen.getByRole('button', {name: /cancel/i}))
    })
    expect(document.activeElement).toBe(editBtn)

    await act(async () => {
        // hitting save button on edit form brings focus back to edit button
        await user.click(editBtn)
    })
    await act(async () => {
        await user.click(screen.getByRole('button', {name: /save/i}))
    })
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
