/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders, queryClient, mockAuthCalls} from '../../test-utils'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {ShopperLoginHelpers, useShopperLoginHelper} from '../ShopperLogin'
import {
    useShopperOrdersMutation,
    shopperOrdersQueryKeysMatrix,
    ShopperOrdersMutationType
} from './mutation'
import nock from 'nock'
import {QueryKey} from '@tanstack/react-query'
import {CombinedMutationTypes} from '../utils'

// Valid id of prepared basket
const BASKET_ID = '753b796f71aaaef79b0adde657'

type TestActionsArgs = {
    [key in ShopperOrdersMutationType]?: {body: any; parameters: any}
}

const testActionsArgs: TestActionsArgs = {
    createOrder: {
        body: {basketId: BASKET_ID},
        parameters: {}
    }
}

interface OrderMutationComponentParams {
    action: CombinedMutationTypes
}

const OrderMutationComponent = ({action}: OrderMutationComponentParams) => {
    //Log into registered account when the component is mounted
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)

    React.useEffect(() => {
        loginRegisteredUser.mutate({
            username: 'kobe@test.com',
            password: 'Test1234!'
        })
    }, [])

    const mutationHook = useShopperOrdersMutation(action)

    return (
        <>
            {loginRegisteredUser.isLoading ? (
                <span>Logging in...</span>
            ) : (
                <div>Logged in as {loginRegisteredUser?.variables?.username}</div>
            )}
            <div>
                <button onClick={() => mutationHook.mutate(testActionsArgs[action])}>
                    {action}
                </button>

                {mutationHook.error?.message && (
                    <p style={{color: 'red'}}>Error: {mutationHook.error?.message}</p>
                )}
                <hr />
                {mutationHook.isSuccess && <span>isSuccess</span>}
            </div>
        </>
    )
}

const tests = (Object.keys(testActionsArgs) as ShopperOrdersMutationType[]).map((key) => {
    return {
        hook: key,
        cases: [
            {
                name: 'success',
                assertions: async () => {
                    mockAuthCalls()

                    // Mocking the server request
                    nock('http://localhost:3000')
                        .persist()
                        .post((uri) => {
                            return uri.includes('/checkout/shopper-orders/')
                        })
                        .reply(200, {})

                    renderWithProviders(
                        <OrderMutationComponent action={key as CombinedMutationTypes} />
                    )

                    await waitFor(() => screen.getByText(/kobe@test.com/))
                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: key
                        })
                    )

                    const {invalidate, update, remove} = shopperOrdersQueryKeysMatrix[key](
                        // @ts-ignore
                        testActionsArgs[key],
                        {}
                    )

                    invalidate?.forEach((queryKey: QueryKey) => {
                        queryClient.setQueryData(queryKey, {})
                    })
                    update?.forEach((queryKey: QueryKey) => {
                        queryClient.setQueryData(queryKey, {})
                    })
                    remove?.forEach((queryKey: QueryKey) => {
                        queryClient.setQueryData(queryKey, {})
                    })

                    const button = screen.getByRole('button', {
                        name: key
                    })

                    fireEvent.click(button)
                    await waitFor(() => screen.getByText(/isSuccess/i))
                    expect(screen.getByText(/isSuccess/i)).toBeInTheDocument()

                    // Assert changes in cache
                    update?.forEach((queryKey: QueryKey) => {
                        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBeFalsy()
                    })
                    invalidate?.forEach((queryKey: QueryKey) => {
                        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBeTruthy()
                    })
                    remove?.forEach((queryKey: QueryKey) => {
                        expect(queryClient.getQueryState(queryKey)).toBeFalsy()
                    })
                }
            },
            {
                name: 'error',
                assertions: async () => {
                    mockAuthCalls()

                    // Mocking the server request
                    nock('http://localhost:3000')
                        .post((uri) => {
                            return uri.includes('/checkout/shopper-orders/')
                        })
                        .reply(500)

                    renderWithProviders(
                        <OrderMutationComponent action={key as CombinedMutationTypes} />
                    )
                    await waitFor(() => screen.getByText(/kobe@test.com/))
                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: key
                        })
                    )

                    const button = screen.getByRole('button', {
                        name: key
                    })
                    fireEvent.click(button)
                    await waitFor(() => screen.getByText(/error/i))
                    expect(screen.getByText(/error/i)).toBeInTheDocument()
                }
            }
        ]
    }
})

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        beforeEach(() => {
            jest.clearAllMocks()
            queryClient.clear()
        })
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})
