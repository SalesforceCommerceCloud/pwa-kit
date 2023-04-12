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
import AccountAddresses from './addresses'
import {
    mockedRegisteredCustomerWithNoAddress,
    mockedRegisteredCustomer
} from '../../mocks/mock-data'
import {useCurrentCustomer} from '../../hooks/use-current-customer'
import {createServer} from '../../../jest-setup'

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

const handlers = [
    {
        path: '*/customers/:customerId/addresses',
        res: () => {
            return mockedRegisteredCustomerWithNoAddress
        }
    }
]

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})
afterEach(() => {
    localStorage.clear()
})

describe('Account addresses page', function () {
    const {prependHandlersToServer} = createServer([
        ...handlers,
        {
            path: '*/customers/:customerId/addresses',
            method: 'post',
            res: (req) => {
                return req.body
            }
        },
        {
            path: '*/customers/:customerId/addresses/:addressName',
            method: 'patch',
            res: (req) => {
                return req.body
            }
        },
        {
            path: '*/customers/:customerId/addresses/:addressName',
            method: 'delete'
        }
    ])
    test('Allows customer to add addresses', async () => {
        // override default handlers
        prependHandlersToServer([
            {
                path: '*/customers/:customerId',
                res: () => {
                    return mockedRegisteredCustomerWithNoAddress
                }
            }
        ])
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

        user.click(screen.getByText(/^Save$/i))

        prependHandlersToServer([
            {
                path: '*/customers/:customerId',
                res: () => {
                    return mockedRegisteredCustomer
                }
            }
        ])
        await waitFor(() => {
            expect(screen.getByText(/123 Main St/i)).toBeInTheDocument()
        })
    })

    test('Allows customer to remove addresses', async () => {
        prependHandlersToServer([
            {
                path: '*/customers/:customerId',
                res: () => {
                    return mockedRegisteredCustomer
                }
            }
        ])
        renderWithProviders(<MockedComponent />)
        await waitFor(() => expect(screen.getByText('123 Main St')).toBeInTheDocument())
        prependHandlersToServer([
            {
                path: '*/customers/:customerId',
                res: () => {
                    return mockedRegisteredCustomerWithNoAddress
                }
            }
        ])

        user.click(screen.getByText(/remove/i))
        expect(await screen.findByText(/no saved addresses/i)).toBeInTheDocument()
    })
})
