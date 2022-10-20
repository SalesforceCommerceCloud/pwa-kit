/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
import path from 'path'
import {mockHttpResponses, renderWithProviders} from '../../test-utils'
import {
    useCustomer,
    useCustomerAddress,
    useCustomerOrders,
    useCustomerBaskets,
    useCustomerProductList
} from './query'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {useQueryClient} from '@tanstack/react-query'
import {ShopperLoginHelpers, useShopperLoginHelper} from '../ShopperLogin'
import {useShopperCustomersMutation, ShopperCustomersMutations} from './mutation'

const {withMocks} = mockHttpResponses({directory: path.join(__dirname, '../../../mock-responses')})

const CUSTOMER_ID = 'abkehFwKoXkbcRmrFIlaYYwKtJ'
const RANDOM_STR = Math.random()
    .toString(36)
    .slice(2, 7)

const CustomerMutationComponent = () => {
    const queryClient = useQueryClient()
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)

    React.useEffect(() => {
        queryClient.invalidateQueries([{entity: 'customer'}])
        loginRegisteredUser.mutate({
            username: 'kobe@test.com',
            password: 'Test1234!'
        })
    }, [])

    const updateCustomer = useShopperCustomersMutation(ShopperCustomersMutations.UpdateCustomer)

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
                        updateCustomer.mutate({
                            parameters: {customerId: CUSTOMER_ID},
                            body: {firstName: `Kobe${RANDOM_STR}`}
                        })
                    }
                >
                    Update Customer
                </button>

                {updateCustomer.error?.message && (
                    <p style={{color: 'red'}}>Error: {updateCustomer.error?.message}</p>
                )}
                <hr />
                <div>{JSON.stringify(updateCustomer)}</div>
            </div>
        </>
    )
}

const tests = [
    {
        hook: 'useCustomer',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    renderWithProviders(<CustomerMutationComponent />)
                    await waitFor(() => screen.getByText(/kobe@test.com/))
                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: /update customer/i
                        })
                    )

                    const button = screen.getByRole('button', {
                        name: /update customer/i
                    })
                    fireEvent.click(button)

                    await waitFor(() => screen.getByText(/email/i))
                    screen.debug(undefined, Infinity)
                    expect(screen.getByText(/email/i)).toBeInTheDocument()
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
