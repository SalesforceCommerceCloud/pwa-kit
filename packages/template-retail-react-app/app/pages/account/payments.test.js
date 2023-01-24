/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {screen, waitFor, waitForElementToBeRemoved} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {renderWithProviders} from '../../utils/test-utils'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import PaymentMethods from './payments'
import {mockedRegisteredCustomer} from '../../commerce-api/mock-data'

const mockToastSpy = jest.fn()

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
                            expirationYear: 2030,
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

// Set up and clean up
beforeEach(() => {
    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.json(mockCustomer))
        )
    )
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
    jest.resetModules()
    localStorage.clear()
})

test('Allows customer to add and remove payment methods', async () => {
    global.server.use(
        rest.post('*/payment-instruments', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        )
    )
    renderWithProviders(<MockedComponent />)
    await waitFor(() => expect(screen.getByText('customerid')).toBeInTheDocument())

    const updatedCustomer = {...mockedRegisteredCustomer}
    const newPayment = {
        creationDate: '2021-04-01T14:34:56.000Z',
        lastModified: '2021-04-01T14:34:56.000Z',
        paymentBankAccount: {},
        paymentCard: {
            cardType: 'Visa',
            creditCardExpired: false,
            expirationMonth: 12,
            expirationYear: 2030,
            holder: 'Test Customer',
            maskedNumber: '************1111',
            numberLastDigits: '1111',
            validFromMonth: 1,
            validFromYear: 2020
        },
        paymentInstrumentId: 'testcard2',
        paymentMethodId: 'CREDIT_CARD'
    }
    updatedCustomer.paymentInstruments.push(newPayment)
    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(updatedCustomer))
        )
    )

    user.click(screen.getByText(/add payment method/i))
    user.type(screen.getByLabelText(/card number/i), '4111111111111111')
    user.type(screen.getByLabelText(/name on card/i), 'Test Customer')
    user.type(screen.getByLabelText(/expiration date/i), '1230')
    user.type(screen.getByLabelText(/security code/i), '555')

    user.click(screen.getByText('Save'))
    expect(await screen.findByText('Visa')).toBeInTheDocument()
    expect(await screen.findByText('Test Customer')).toBeInTheDocument()

    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        )
    )
    // remove
    user.click(screen.getAllByText(/remove/i)[1])
    const loadingEl = await screen.getAllByText('Loading...')
    waitForElementToBeRemoved(loadingEl).then(() =>
        expect(screen.queryByText('Test Customer')).not.toBeInTheDocument()
    )
})
