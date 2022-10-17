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
import {screen, waitFor} from '@testing-library/react'
import {ShopperLoginHelpers, useShopperLoginHelper} from '../ShopperLogin'
import {useOrder, usePaymentMethodsForOrder} from './query'

const {withMocks} = mockHttpResponses({
    directory: path.join(__dirname, '../../../mock-responses')
})

const OrderComponent = ({orderNo}: {orderNo: string}): ReactElement => {
    // log into register account before fetching any order information when the component is mounted
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
    React.useEffect(() => {
        loginRegisteredUser.mutate({username: 'alex@test.com', password: 'Test1234#'})
    }, [])

    const {data, isLoading, error} = useOrder(
        {
            orderNo
        },
        {
            // wait until the access_token is back before fetching order
            enabled: !!loginRegisteredUser?.data?.access_token
        }
    )
    return (
        <>
            <h1>Order Information</h1>
            {loginRegisteredUser.isLoading ? (
                <span>Logging in...</span>
            ) : (
                <div>Logged in as {loginRegisteredUser?.variables?.username}</div>
            )}
            {isLoading && <div>Loading...</div>}
            {data && <div>{data.customerName}</div>}
            {error && <span>error</span>}
        </>
    )
}

const PaymentMethodsComponent = ({orderNo}: {orderNo: string}): ReactElement => {
    // log into register account before fetching any order information when the component is mounted
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
    React.useEffect(() => {
        loginRegisteredUser.mutate({username: 'alex@test.com', password: 'Test1234#'})
    }, [])

    const {data, isLoading, error} = usePaymentMethodsForOrder(
        {
            orderNo
        },
        {
            // wait until the access_token is back before fetching order
            enabled: !!loginRegisteredUser?.data?.access_token
        }
    )
    return (
        <>
            {loginRegisteredUser.isLoading ? (
                <span>Logging in...</span>
            ) : (
                <div>Logged in as {loginRegisteredUser?.variables?.username}</div>
            )}
            {isLoading && <div>Loading...</div>}
            {data && (
                <div>
                    {data.applicablePaymentMethods?.map(({id}) => (
                        <div key={id}>{id}</div>
                    ))}
                </div>
            )}
            {error && <span>error</span>}
        </>
    )
}

const tests = [
    {
        hook: 'useOrder',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    const orderNo = '00014202'
                    renderWithProviders(<OrderComponent orderNo={orderNo} />)

                    await waitFor(() => screen.getByText(/alex@test.com/))
                    expect(screen.queryByText(/alex@test.com/)).toBeInTheDocument()
                    await waitFor(() => screen.getByText(/Alex V/))

                    expect(screen.queryByText(/Alex V/)).toBeInTheDocument()
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    const invalidOrderNo = 'abcdef'
                    renderWithProviders(<OrderComponent orderNo={invalidOrderNo} />)

                    await waitFor(() => screen.getByText(/alex@test.com/))
                    expect(screen.queryByText(/alex@test.com/)).toBeInTheDocument()

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                })
            }
        ]
    },
    {
        hook: 'usePaymentMethodsForOrder',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    const orderNo = '00014202'
                    renderWithProviders(<PaymentMethodsComponent orderNo={orderNo} />)

                    await waitFor(() => screen.getByText(/alex@test.com/))
                    expect(screen.queryByText(/alex@test.com/)).toBeInTheDocument()

                    await waitFor(() => screen.getByText('PayPal'))
                    expect(screen.getByText('PayPal')).toBeInTheDocument()
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    const invalidOrderNo = 'abcdef'
                    renderWithProviders(<PaymentMethodsComponent orderNo={invalidOrderNo} />)

                    await waitFor(() => screen.getByText(/alex@test.com/))
                    expect(screen.queryByText(/alex@test.com/)).toBeInTheDocument()

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                })
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
