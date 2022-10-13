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
import {useOrder, usePaymentMethodsForOrder} from './query'
import {useShopperLoginHelper} from '../ShopperLogin/helper'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'

const {withMocks} = mockHttpResponses({directory: path.join(__dirname, '../../../mock-responses')})


const OrderComponent = ({orderNo}: {orderNo: string}): ReactElement => {
    const {data, isLoading, error} = useOrder({orderNo})
    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && <div>{data.name}</div>}
            {error && <span>error</span>}
        </div>
    )
}

const PaymentMethodsComponent = ({orderNo}: {orderNo: string}): ReactElement => {
    const {data, isLoading, error} = usePaymentMethodsForOrder({orderNo})
    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && <div>{data.name}</div>}
            {error && <span>error</span>}
        </div>
    )
}

const LogInComponent = () => {
    const loginRegisteredUser = useShopperLoginHelper('loginRegisteredUserB2C')
    return (
        <div>
            <button onClick={() =>
                loginRegisteredUser.mutate({username: 'alex@test.com', password: 'Test1234#'})}>Login
            </button>
            <p>{loginRegisteredUser.data}</p>
        </div>
    )
}

const tests = [
    {
        hook: 'useOrder',
        cases: [
            {
                name: 'returns order data',
                assertions: withMocks(async () => {
                    const orderNo = '00014103'
                    renderWithProviders(<OrderComponent orderNo={orderNo} />)
                    const orderItems = ['Ruffle Front Cardigan', 'Porcelain Straight Leg Pant', '2 Button Front Jacket']
                    const orderTotal = 229.11

                    expect(screen.queryByText(orderItems[0])).toBeNull()
                    expect(screen.queryByText(orderItems[1])).toBeNull()
                    expect(screen.queryByText(orderItems[2])).toBeNull()
                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    expect(screen.getByText(orderItems[0])).toBeInTheDocument()
                    expect(screen.getByText(orderItems[1])).toBeInTheDocument()
                    expect(screen.getByText(orderItems[2])).toBeInTheDocument()
                    expect(screen.getByText(orderTotal)).toBeInTheDocument()
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    renderWithProviders(<OrderComponent orderNo='abcdef' />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                })
            }
        ]
    },
    {
        hook: 'usePaymentMethodsForOrder',
        cases: [
            {
                name: 'returns payment methods data',
                assertions: withMocks(async () => {
                    const orderNo = '00014103'
                    renderWithProviders(<PaymentMethodsComponent orderNo={orderNo} />)
                    const paymentMethods = ['GIFT_CERTIFICATE', 'CREDIT_CARD', 'PayPal', 'BML']

                    expect(screen.queryByText(paymentMethods[0])).toBeNull()
                    expect(screen.queryByText(paymentMethods[1])).toBeNull()
                    expect(screen.queryByText(paymentMethods[2])).toBeNull()
                    expect(screen.queryByText(paymentMethods[3])).toBeNull()
                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    expect(screen.getByText(paymentMethods[0])).toBeInTheDocument()
                    expect(screen.getByText(paymentMethods[1])).toBeInTheDocument()
                    expect(screen.getByText(paymentMethods[2])).toBeInTheDocument()
                    expect(screen.getByText(paymentMethods[3])).toBeInTheDocument()
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    renderWithProviders(<PaymentMethodsComponent orderNo='abcdef' />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                })
            }
        ]
    }
]

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})