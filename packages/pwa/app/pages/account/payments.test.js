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
import useCustomer from '../../commerce-api/hooks/useCustomer'
import PaymentMethods from './payments'

const mockCustomer = {
    authType: 'registered',
    customerId: 'registeredCustomerId'
}

jest.setTimeout(30000)

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
            async createCustomerPaymentInstrument(paymentInstrument) {
                mockCustomer.paymentInstruments = [paymentInstrument.body]
                return {}
            }

            async deleteCustomerPaymentInstrument() {
                mockCustomer.paymentInstruments = undefined
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

const MockedComponent = () => {
    const customer = useCustomer()
    useEffect(() => {
        customer.login('test@test.com', 'password')
    }, [])
    return (
        <div>
            <div>{customer.customerId}</div>
            <PaymentMethods />
        </div>
    )
}

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})

test('Allows customer to add and remove payment methods', async () => {
    renderWithProviders(<MockedComponent />)
    await waitFor(() => expect(screen.getByText('registeredCustomerId')).toBeInTheDocument())

    expect(screen.getByText(/no saved payment methods/i)).toBeInTheDocument()

    // add
    user.click(screen.getByText(/add payment method/i))
    user.type(screen.getByLabelText(/card number/i), '4111111111111111')
    user.type(screen.getByLabelText(/name on card/i), 'Test Customer')
    user.type(screen.getByLabelText(/expiry date/i), '1222')
    user.type(screen.getByLabelText(/security code/i), '555')
    user.click(screen.getByText('Save'))
    expect(await screen.findByText('Visa')).toBeInTheDocument()
    expect(await screen.findByText('•••• 1111')).toBeInTheDocument()
    expect(await screen.findByText('12/2022')).toBeInTheDocument()
    expect(await screen.findByText('Test Customer')).toBeInTheDocument()

    // remove
    user.click(screen.getByText(/remove/i))
    expect(await screen.findByText(/no saved payment methods/i)).toBeInTheDocument()
})
