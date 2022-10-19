/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
import path from 'path'
import '@testing-library/jest-dom'
import {mockHttpResponses, renderWithProviders, PAYMENT_EXPECTED_RETURN} from '../../test-utils'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {ShopperLoginHelpers, useShopperLoginHelper} from '../ShopperLogin'
import {useShopperOrdersMutation, ShopperOrdersMutations} from './mutation'

const {withMocks} = mockHttpResponses({
    directory: path.join(__dirname, '../../../mock-responses')
})

const ShopperOrdersMutationComponent = () => {
    // log into register account before fetching any order information when the component is mounted
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
    React.useEffect(() => {
        loginRegisteredUser.mutate({username: 'alex@test.com', password: 'Test1234#'})
    }, [])
    const ORDER_NO = '00014103'

    const createPaymentInstrument = useShopperOrdersMutation(
        ShopperOrdersMutations.CreatePaymentInstrumentForOrder
    )
    const updatePaymentInstrument = useShopperOrdersMutation(
        ShopperOrdersMutations.UpdatePaymentInstrumentForOrder
    )
    const removePaymentInstrument = useShopperOrdersMutation(
        ShopperOrdersMutations.RemovePaymentInstrumentFromOrder
    )

    return (
        <>
            {loginRegisteredUser.isLoading ? (
                <span>Logging in...</span>
            ) : (
                <div>Logged in as {loginRegisteredUser?.variables?.username}</div>
            )}
            <div>
                <button
                    onClick={() => {
                        createPaymentInstrument.mutate({
                            parameters: {orderNo: ORDER_NO},
                            body: {
                                amount: 700,
                                paymentMethodId: 'GIFT_CERTIFICATE',
                                bankRoutingNumber: '123456'
                            }
                        })
                    }}
                >
                    Create Payment
                </button>
                <p>{createPaymentInstrument.data?.customerName}</p>
                <p>CreatePayment:isSuccess:{createPaymentInstrument.isSuccess.toString()}</p>
            </div>
            <div>
                <button
                    onClick={() => {
                        updatePaymentInstrument.mutate({
                            parameters: {
                                orderNo: ORDER_NO,
                                paymentInstrumentId: '5db799461deeaccf700ea4f125'
                            },
                            body: {
                                bankRoutingNumber: '000000'
                            }
                        })
                    }}
                >
                    Update Payment
                </button>
                <p>UpdatePayment:isSuccess:{updatePaymentInstrument.isSuccess.toString()}</p>
            </div>
            <div>
                <button
                    onClick={() => {
                        removePaymentInstrument.mutate({
                            parameters: {
                                orderNo: ORDER_NO,
                                paymentInstrumentId: '5db799461deeaccf700ea4f125'
                            }
                        })
                    }}
                >
                    Remove Payment
                </button>
                <p>RemovePayment:isSuccess:{removePaymentInstrument.isSuccess.toString()}</p>
            </div>
        </>
    )
}

const tests = [
    {
        hook: 'useShopperOrdersMutation',
        cases: [
            {
                name: 'create payment mutate',
                assertions: withMocks(async () => {
                    renderWithProviders(<ShopperOrdersMutationComponent />)
                    await waitFor(() => screen.getByText(/alex@test.com/))
                    expect(screen.queryByText(/alex@test.com/)).toBeInTheDocument()

                    const button = screen.getByText('Create Payment')
                    fireEvent.click(button)
                    await waitFor(() => screen.getByText('CreatePayment:isSuccess:true'))
                    expect(screen.getByText('CreatePayment:isSuccess:true')).toBeInTheDocument()
                    expect(screen.getByText(/Alex V/)).toBeInTheDocument()
                }, PAYMENT_EXPECTED_RETURN)
            },
            // {
            //     name: 'update payment mutate',
            //     assertions: withMocks(async () => {
            //         renderWithProviders(<ShopperOrdersMutationComponent />)
            //         await waitFor(() => screen.getByText(/alex@test.com/))
            //         expect(screen.queryByText(/alex@test.com/)).toBeInTheDocument()
            //         //first create the payment
            //         const createButton = screen.getByText('Create Payment')
            //         fireEvent.click(createButton)
            //         await waitFor(() => screen.getByText('CreatePayment:isSuccess:true'))
            //         //then update
            //         const button = screen.getByText('Update Payment')
            //         fireEvent.click(button)
            //         await waitFor(() => screen.getByText('UpdatePayment:isSuccess:true'))
            //         // expect(screen.getByText('UpdatePayment:isSuccess:true')).toBeInTheDocument()
            //     }, PAYMENT_EXPECTED_RETURN),
            // },
            {
                name: 'remove payment mutate',
                assertions: withMocks(async () => {
                    renderWithProviders(<ShopperOrdersMutationComponent />)
                    await waitFor(() => screen.getByText(/alex@test.com/))
                    expect(screen.queryByText(/alex@test.com/)).toBeInTheDocument()

                    //first create the payment
                    const createButton = screen.getByText('Create Payment')
                    fireEvent.click(createButton)
                    await waitFor(() => screen.getByText('CreatePayment:isSuccess:true'))
                    //then remove
                    const removeButton = screen.getByText('Remove Payment')
                    fireEvent.click(removeButton)
                    await waitFor(() => screen.getByText('RemovePayment:isSuccess:true'))
                    expect(screen.getByText('RemovePayment:isSuccess:true')).toBeInTheDocument()
                }, PAYMENT_EXPECTED_RETURN)
            }
        ]
    }
]

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        afterEach(() => {
            jest.clearAllMocks()
        })
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})
