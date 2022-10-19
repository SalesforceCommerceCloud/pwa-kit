/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
import path from 'path'
import '@testing-library/jest-dom'
import {mockHttpResponses, renderWithProviders} from '../../test-utils'
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
                <p>{createPaymentInstrument.data}</p>
                <p>CreatePayment:isSuccess:{createPaymentInstrument.isSuccess.toString()}</p>
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
                    const button = screen.getByText('Create Payment')
                    fireEvent.click(button)
                })
            }
            // {
            //     name: 'update payment mutate',
            //     assertions: async () => {
            //         renderWithProviders(<ShopperOrdersMutationComponent />)
            //     }
            // },
            // {
            //     name: 'remove payment mutate',
            //     assertions: async () => {
            //         renderWithProviders(<ShopperOrdersMutationComponent />)
            //     }
            // }
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
