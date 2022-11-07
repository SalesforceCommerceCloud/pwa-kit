/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import path from 'path'
import {mockHttpResponses, renderWithProviders} from '../../test-utils'
import {useOrder} from './query'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {useQueryClient} from '@tanstack/react-query'
import {ShopperLoginHelpers, useShopperLoginHelper} from '../ShopperLogin'
import {ShopperBasketsMutations, useShopperBasketsMutation} from '../ShopperBaskets'
import {ShopperOrdersMutations, useShopperOrdersMutation} from './mutation'
import nock from 'nock'

const {withMocks} = mockHttpResponses({directory: path.join(__dirname, '../../../mock-responses')})

const BASKET_ID = 'a10ff320829cb0eef93ca5310a'

const OrderMutationComponent = () => {
    //Log into registered account when the component is mounted
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
    const createOrder = useShopperOrdersMutation(ShopperOrdersMutations.CreateOrder)
    const createBasket = useShopperBasketsMutation(ShopperBasketsMutations.CreateBasket)

    React.useEffect(() => {
        loginRegisteredUser.mutate({username: 'alex@test.com', password: 'Test1234#'})
    }, [])

    //Need to create a prepared basket in order to create an order with basketID
    const createOrderFlow = async () => {
        const {data} = await createBasket.mutateAsync({body: {}})
        createOrder.mutate({
            body: {basketId: BASKET_ID}
        })
    }

    return (
        <>
            {loginRegisteredUser.isLoading ? (
                <span>Logging in...</span>
            ) : (
                <div>Logged in as {loginRegisteredUser?.variables?.username}</div>
            )}
            <div>
                <button onClick={() => createOrderFlow()}>Create Order</button>

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
                assertions: withMocks(async () => {
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
                            return uri.includes('/checkout/shopper-baskets/')
                        })
                        .reply(200, {
                            basketId: BASKET_ID,
                            customerInfo: {
                                email: 'alex@test.com'
                            }
                        })

                    // Mocking the server request
                    nock('http://localhost:3000')
                        .post((uri) => {
                            return uri.includes('/checkout/shopper-orders/')
                        })
                        .reply(200, {
                            orderNo: '000000410',
                            customerInfo: {
                                email: 'alex@test.com'
                            }
                        })

                    const button = screen.getByRole('button', {
                        name: /create order/i
                    })
                    fireEvent.click(button)
                    await waitFor(() => screen.getByText(/orderno/i))
                    expect(screen.getByText(/orderno/i)).toBeInTheDocument()
                })
            },
            {
                name: 'error',
                assertions: withMocks(async () => {
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
                            return uri.includes('/checkout/shopper-baskets/')
                        })
                        .reply(404)

                    const button = screen.getByRole('button', {
                        name: /create order/i
                    })
                    fireEvent.click(button)
                    await waitFor(() => screen.getByText(/error/i))
                    expect(screen.getByText(/error/i)).toBeInTheDocument()
                })
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
