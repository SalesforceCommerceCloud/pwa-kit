/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {renderWithProviders, setupMockServer} from '../../utils/test-utils'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import PaymentMethods from './payments'

let mockCustomer = {}

const mockToastSpy = jest.fn()

jest.setTimeout(30000)

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

jest.mock('commerce-sdk-isomorphic', () => {
    const sdk = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...sdk,
        ShopperCustomers: class ShopperCustomersMock extends sdk.ShopperCustomers {
            async createCustomerPaymentInstrument() {
                mockCustomer.paymentInstruments = [
                    {
                        creationDate: '2021-05-04T12:35:03.711Z',
                        lastModified: '2021-05-04T12:35:03.711Z',
                        paymentBankAccount: {},
                        paymentCard: {
                            cardType: 'Visa',
                            creditCardExpired: false,
                            expirationMonth: 12,
                            expirationYear: 2022,
                            holder: 'Test Customer',
                            maskedNumber: '************1111',
                            numberLastDigits: '1111',
                            validFromMonth: 1,
                            validFromYear: 2020
                        },
                        paymentInstrumentId: '51227637631ec8db019208d8a4',
                        paymentMethodId: 'CREDIT_CARD'
                    }
                ]
                return {}
            }

            async deleteCustomerPaymentInstrument() {
                mockCustomer.paymentInstruments = undefined
                return {}
            }
        }
    }
})

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

const server = setupMockServer(
    rest.get('*/customers/:customerId', (req, res, ctx) =>
        res(ctx.delay(0), ctx.json(mockCustomer))
    )
)

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})
    mockCustomer = {
        authType: 'registered',
        customerId: 'registeredCustomerId',
        customerNo: '00151503',
        email: 'jkeane@64labs.com',
        firstName: 'John',
        lastName: 'Keane',
        login: 'jkeane@64labs.com'
    }
})
afterEach(() => {
    localStorage.clear()
    server.resetHandlers()
})
afterAll(() => server.close())

test('Allows customer to add and remove payment methods', async () => {
    renderWithProviders(<MockedComponent />)
    await waitFor(() => expect(screen.getByText('registeredCustomerId')).toBeInTheDocument())

    expect(screen.getByText(/no saved payment methods/i)).toBeInTheDocument()

    // add
    user.click(screen.getByText(/add payment method/i))
    user.type(screen.getByLabelText(/card number/i), '4111111111111111')
    user.type(screen.getByLabelText(/name on card/i), 'Test Customer')
    user.type(screen.getByLabelText(/expiration date/i), '1222')
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
