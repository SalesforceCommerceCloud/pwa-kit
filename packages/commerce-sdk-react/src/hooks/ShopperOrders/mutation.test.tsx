/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders, mockAuthCalls} from '../../test-utils'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {ShopperLoginHelpers, useShopperLoginHelper} from '../ShopperLogin'
import {ShopperOrdersMutations, useShopperOrdersMutation} from './mutation'
import nock from 'nock'

// Valid id of prepared basket
const BASKET_ID = '753b796f71aaaef79b0adde657'

const OrderMutationComponent = () => {
    //Log into registered account when the component is mounted
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
    const createOrder = useShopperOrdersMutation(ShopperOrdersMutations.CreateOrder)

    React.useEffect(() => {
        loginRegisteredUser.mutate({username: 'alex@test.com', password: 'Test1234#'})
    }, [])

    return (
        <>
            {loginRegisteredUser.isLoading ? (
                <span>Logging in...</span>
            ) : (
                <div>Logged in as {loginRegisteredUser?.variables?.username}</div>
            )}
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

                {createOrder.error?.message && (
                    <p style={{color: 'red'}}>Error: {createOrder.error?.message}</p>
                )}
                <hr />
                <div>{JSON.stringify(createOrder)}</div>
            </div>
        </>
    )
}

const tests = [
    {
        hook: 'createOrder',
        cases: [
            {
                name: 'success',
                assertions: async () => {
                    mockAuthCalls()
                    renderWithProviders(<OrderMutationComponent />)

                    await waitFor(() => screen.getByText(/alex@test.com/))
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

                    // Mocking the server request
                    nock('http://localhost:3000')
                        .persist()
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
                    mockAuthCalls()
                    renderWithProviders(<OrderMutationComponent />)
                    await waitFor(() => screen.getByText(/alex@test.com/))
                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: /create order/i
                        })
                    )

                    // Mocking the server request
                    nock('http://localhost:3000')
                        .post((uri) => {
                            return uri.includes('/checkout/shopper-orders/')
                        })
                        .reply(404)

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
