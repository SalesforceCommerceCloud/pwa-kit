/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders, DEFAULT_TEST_HOST} from '../../test-utils'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {ShopperOrdersMutations, useShopperOrdersMutation} from './mutation'
import nock from 'nock'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: '123'})
    }))
})

const BASKET_ID = '12345'

const OrderMutationComponent = () => {
    const createOrder = useShopperOrdersMutation(ShopperOrdersMutations.CreateOrder)

    return (
        <div>
            <button
                onClick={() =>
                    createOrder.mutate({
                        body: {basketId: BASKET_ID}
                    })
                }
            >
                Create Order
            </button>

            {createOrder.error?.message && <p>Error: {createOrder.error?.message}</p>}
            <hr />
            <div>{JSON.stringify(createOrder.data)}</div>
        </div>
    )
}

const tests = [
    {
        hook: 'createOrder',
        cases: [
            {
                name: 'success',
                assertions: async () => {
                    renderWithProviders(<OrderMutationComponent />)

                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: /create order/i
                        })
                    )

                    const mockOrderResponse = {
                        orderNo: '00000410',
                        customerInfo: {
                            email: 'alex@test.com'
                        }
                    }

                    nock(DEFAULT_TEST_HOST)
                        .post((uri) => {
                            return uri.includes('/checkout/shopper-orders/')
                        })
                        .reply(200, mockOrderResponse)

                    const button = screen.getByRole('button', {
                        name: /create order/i
                    })
                    fireEvent.click(button)
                    await waitFor(() => screen.getByText(/orderno/i))
                    expect(screen.getByText(/orderno/i)).toBeInTheDocument()
                }
            },
            {
                name: 'error',
                assertions: async () => {
                    renderWithProviders(<OrderMutationComponent />)
                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: /create order/i
                        })
                    )

                    nock(DEFAULT_TEST_HOST)
                        .post((uri) => {
                            return uri.includes('/checkout/shopper-orders/')
                        })
                        .reply(500)

                    const button = screen.getByRole('button', {
                        name: /create order/i
                    })
                    fireEvent.click(button)
                    await waitFor(() => screen.getByText(/error/i))
                    expect(screen.getByText(/error/i)).toBeInTheDocument()
                }
            }
        ]
    }
]

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})
