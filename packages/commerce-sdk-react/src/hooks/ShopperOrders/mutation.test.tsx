/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders, DEFAULT_TEST_HOST, createQueryClient} from '../../test-utils'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {useShopperOrdersMutation, ShopperOrdersMutation} from './mutation'
import nock from 'nock'
import {ApiClients, Argument} from '../types'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: '123'})
    }))
})

const BASKET_ID = '12345'

type MutationPayloads = {
    [Mutation in ShopperOrdersMutation]?: Argument<ApiClients['shopperOrders'][Mutation]>
}

const mutationPayloads: MutationPayloads = {
    createOrder: {
        body: {basketId: BASKET_ID},
        parameters: {}
    }
}

interface OrderMutationComponentParams {
    action: ShopperOrdersMutation
}

const OrderMutationComponent = ({action}: OrderMutationComponentParams) => {
    const mutationHook = useShopperOrdersMutation(action)
    const error = mutationHook.error as Error | undefined
    const payload = mutationPayloads[action]
    if (!payload) throw new Error(`Missing payload for ${action}`)

    return (
        <div>
            <button onClick={() => mutationHook.mutate(payload)}>{action}</button>

            {error?.message && <p>Error: {error.message}</p>}
            <hr />
            {mutationHook.isSuccess && <span>isSuccess</span>}
        </div>
    )
}

const tests = (Object.keys(mutationPayloads) as ShopperOrdersMutation[]).map((mutationName) => {
    return {
        hook: mutationName,
        cases: [
            {
                name: 'success',
                assertions: async () => {
                    nock(DEFAULT_TEST_HOST)
                        .post((uri) => {
                            return uri.includes('/checkout/shopper-orders/')
                        })
                        .reply(200, {})

                    const queryClient = createQueryClient()

                    const mutation = shopperOrdersCacheUpdateMatrix[mutationName]

                    const {invalidate, update, remove} = mutation(
                        mutationPayloads[mutationName],
                        {}
                    )

                    const queryKeys = [...(invalidate || []), ...(update || []), ...(remove || [])]

                    queryKeys.forEach(({key: queryKey}) => {
                        queryClient.setQueryData(queryKey, {test: true})
                    })

                    renderWithProviders(
                        <OrderMutationComponent action={mutationName as ShopperOrdersMutation} />,
                        {queryClient}
                    )

                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: mutationName
                        })
                    )

                    const button = screen.getByRole('button', {
                        name: mutationName
                    })

                    fireEvent.click(button)
                    await waitFor(() => screen.getByText(/isSuccess/i))
                    expect(screen.getByText(/isSuccess/i)).toBeInTheDocument()

                    // Assert changes in cache
                    update?.forEach(({key: queryKey}) => {
                        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBeFalsy()
                    })
                    invalidate?.forEach(({key: queryKey}) => {
                        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBeTruthy()
                    })
                    remove?.forEach(({key: queryKey}) => {
                        expect(queryClient.getQueryState(queryKey)).toBeFalsy()
                    })
                }
            },
            {
                name: 'error',
                assertions: async () => {
                    nock(DEFAULT_TEST_HOST)
                        .post((uri) => {
                            return uri.includes('/checkout/shopper-orders/')
                        })
                        .reply(500)

                    renderWithProviders(
                        <OrderMutationComponent action={mutationName as ShopperOrdersMutation} />
                    )
                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: mutationName
                        })
                    )

                    const button = screen.getByRole('button', {
                        name: mutationName
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
        })
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})

// TODO: Methods that haven't been implemented are no longer an explicit list,
// but are implicitly derived from their absence in the `cacheUpdateMatrix` of implementations.
test.each([])('%j - throws error when not implemented', (methodName) => {
    const action = methodName as ShopperOrdersMutation
    expect(() => {
        useShopperOrdersMutation(action)
    }).toThrowError('This method is not implemented.')
})
