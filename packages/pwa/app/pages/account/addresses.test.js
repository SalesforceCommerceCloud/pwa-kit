/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders} from '../../utils/test-utils'
import AccountAddresses from './addresses'
import useCustomer from '../../commerce-api/hooks/useCustomer'

const mockCustomer = {
    authType: 'registered',
    customerId: 'registeredCustomerId',
    customerNo: 'testno',
    email: 'darek@test.com',
    firstName: 'Tester',
    lastName: 'Testing',
    login: 'darek@test.com'
}

jest.setTimeout(30000)

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

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
        ShopperCustomers: class ShopperCustomersMock extends sdk.ShopperCustomers {
            async createCustomerAddress(address) {
                mockCustomer.addresses = [address.body]
                return {}
            }

            async updateCustomerAddress(address) {
                mockCustomer.addresses[0] = address.body
                return {}
            }

            async removeCustomerAddress() {
                mockCustomer.addresses = undefined
                return {}
            }

            async getCustomer() {
                return mockCustomer
            }
        }
    }
})

const mockToastSpy = jest.fn()
jest.mock('@chakra-ui/toast', () => {
    return {
        useToast: jest.fn(() => mockToastSpy)
    }
})

const WrappedAddress = () => {
    const customer = useCustomer()
    useEffect(() => {
        customer.login('test@test.com', 'password')
    }, [])
    return (
        <div>
            <div>{customer.customerId}</div>
            <AccountAddresses />
        </div>
    )
}

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})

test('Allows customer to add/edit/remove addresses', async () => {
    renderWithProviders(<WrappedAddress />)
    await waitFor(() => expect(screen.getByText('registeredCustomerId')).toBeInTheDocument())
    expect(screen.getByText(/no saved addresses/i)).toBeInTheDocument()

    // add
    user.click(screen.getByText(/add address/i))
    user.type(screen.getByLabelText('First Name'), 'Tyler')
    user.type(screen.getByLabelText('Last Name'), 'Glasnow')
    user.type(screen.getByLabelText('Phone'), '7277277727')
    user.type(screen.getByLabelText('Address'), 'Tropicana Field')
    user.type(screen.getByLabelText('City'), 'St Petersburg')
    user.selectOptions(screen.getByLabelText(/state/i), ['FL'])
    user.type(screen.getByLabelText('Zip Code'), '33701')
    user.click(screen.getByText(/^Save$/i))
    expect(await screen.findByText(/Tropicana Field/i)).toBeInTheDocument()

    // edit
    user.click(screen.getByText(/edit/i))
    user.type(screen.getByLabelText('Address'), '333 Main St')
    user.click(screen.getByLabelText(/set as default/i))
    user.click(screen.getByText(/Save$/i))
    expect(await screen.findByText(/333 main st/i)).toBeInTheDocument()
    expect(await screen.findByText(/default/i)).toBeInTheDocument()

    // remove
    user.click(screen.getByText(/remove/i))
    expect(await screen.findByText(/no saved addresses/i)).toBeInTheDocument()
})
