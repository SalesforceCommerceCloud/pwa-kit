/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders, DEFAULT_TEST_HOST, createQueryClient} from '../../test-utils'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {
    useShopperOrdersMutation,
    ShopperOrdersMutationType,
    shopperOrdersCacheUpdateMatrix,
    SHOPPER_ORDERS_NOT_IMPLEMENTED
} from './mutation'
import nock from 'nock'
import {QueryKey} from '@tanstack/react-query'
import {QueryKeyMap} from '../utils'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: '123'})
    }))
})

const BASKET_ID = '12345'

type MutationPayloads = {
    [key in ShopperOrdersMutationType]?: {body: any; parameters: any}
}

const mutationPayloads: MutationPayloads = {
    createOrder: {
        body: {basketId: BASKET_ID},
        parameters: {}
    }
}

interface OrderMutationComponentParams {
    action: ShopperOrdersMutationType
}

const OrderMutationComponent = ({action}: OrderMutationComponentParams) => {
    const mutationHook = useShopperOrdersMutation({action})

    return (
        <div>
            <button onClick={() => mutationHook.mutate(mutationPayloads[action])}>{action}</button>

            {mutationHook.error?.message && <p>Error: {mutationHook.error?.message}</p>}
            <hr />
            {mutationHook.isSuccess && <span>isSuccess</span>}
        </div>
    )
}

const tests = (Object.keys(mutationPayloads) as ShopperOrdersMutationType[]).map((mutationName) => {
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

                    const mutation: any = shopperOrdersCacheUpdateMatrix[mutationName]

                    const {invalidate, update, remove} = mutation(
                        mutationPayloads[mutationName],
                        {}
                    )

                    const queryKeys = [...(invalidate || []), ...(update || []), ...(remove || [])]

                    queryKeys.forEach(({key: queryKey}: QueryKeyMap) => {
                        queryClient.setQueryData(queryKey, {test: true})
                    })

                    renderWithProviders(
                        <OrderMutationComponent
                            action={mutationName as ShopperOrdersMutationType}
                        />,
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
                    update?.forEach(({key: queryKey}: QueryKeyMap) => {
                        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBeFalsy()
                    })
                    invalidate?.forEach(({key: queryKey}: QueryKeyMap) => {
                        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBeTruthy()
                    })
                    remove?.forEach(({key: queryKey}: QueryKeyMap) => {
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
                        <OrderMutationComponent
                            action={mutationName as ShopperOrdersMutationType}
                        />
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

test.each(SHOPPER_ORDERS_NOT_IMPLEMENTED)(
    '%j - throws error when not implemented',
    (methodName) => {
        const action = methodName as ShopperOrdersMutationType
        expect(() => {
            useShopperOrdersMutation({action})
        }).toThrowError('This method is not implemented.')
    }
)
