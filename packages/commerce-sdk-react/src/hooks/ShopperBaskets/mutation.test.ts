/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {act} from '@testing-library/react'
import nock from 'nock'
import {DEFAULT_TEST_HOST, renderHookWithProviders} from '../../test-utils'
import {getQueryKeysMatrix, ShopperBasketMutationType, useShopperBasketsMutation} from './mutation'
import {useBasket} from './query'
import {useCustomerBaskets} from '../ShopperCustomers/query'
import useCustomerId from '../useCustomerId'

const CUSTOMER_ID = 'CUSTOMER_ID'
const BASKET_ID = 'BASKET_ID'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: '123'})
    }))
})

jest.mock('../useCustomerId.ts', () => {
    return jest.fn().mockReturnValue(CUSTOMER_ID)
})

const mockMutationEndpoints = (matchingPath: string, options?: {errorResponse: number}) => {
    const responseStatus = options?.errorResponse ? options.errorResponse : 200

    nock(DEFAULT_TEST_HOST)
        .patch((uri) => {
            return uri.includes(matchingPath)
        })
        .reply(responseStatus, {test: 'new data'})
        .put((uri) => {
            return uri.includes(matchingPath)
        })
        .reply(responseStatus, {test: 'new data'})
        .post((uri) => {
            return uri.includes(matchingPath)
        })
        .reply(responseStatus, {test: 'new data'})
        .delete((uri) => {
            return uri.includes(matchingPath)
        })
        .reply(options?.errorResponse ? options.errorResponse : 204)
}

type MutationPayloads = {
    [key in ShopperBasketMutationType]?: {body: any; parameters: any}
}
const mutationPayloads: MutationPayloads = {
    updateBasket: {parameters: {basketId: BASKET_ID}, body: {}},
    updateBillingAddressForBasket: {parameters: {basketId: BASKET_ID}, body: {}},
    deleteBasket: {parameters: {basketId: BASKET_ID}, body: {}}

    // TODO: add more payloads
}

const tests = (Object.keys(mutationPayloads) as ShopperBasketMutationType[]).map((mutationName) => {
    const payload = mutationPayloads[mutationName]

    return {
        hook: mutationName,
        cases: [
            {
                name: 'success',
                assertions: async () => {
                    mockMutationEndpoints('/checkout/shopper-baskets/')

                    // for get basket
                    nock(DEFAULT_TEST_HOST)
                        .persist()
                        .get((uri) => {
                            return uri.includes('/checkout/shopper-baskets/')
                        })
                        .reply(200, {test: 'old data'})

                    // for get customer basket
                    nock(DEFAULT_TEST_HOST)
                        .persist()
                        .get((uri) => {
                            return uri.includes('/customer/shopper-customers/')
                        })
                        .reply(200, {test: 'old data'})
                        .get((uri) => {
                            return uri.includes('/customer/shopper-customers/')
                        })
                        .reply(200, {test: 'new data'})

                    const {result, waitForValueToChange} = renderHookWithProviders(() => {
                        const queries = {
                            basket: useBasket({basketId: BASKET_ID}),
                            customerBaskets: useCustomerBaskets({customerId: CUSTOMER_ID})
                        }
                        const mutation = useShopperBasketsMutation(mutationName)

                        return {
                            queries,
                            mutation
                        }
                    })

                    await waitForValueToChange(() => result.current.queries.basket.data)

                    act(() => {
                        result.current.mutation.mutate(payload)
                    })

                    await waitForValueToChange(() => result.current.mutation.isSuccess)
                    expect(result.current.mutation.isSuccess).toBe(true)

                    const queryKeysMatrix = getQueryKeysMatrix(CUSTOMER_ID)
                    // @ts-ignore
                    const {invalidate, update, remove} = queryKeysMatrix[mutationName](payload, {})

                    // TODO: do not assume that `update` will deal with basket query
                    if (update) {
                        // basket query should be updated without a refetch
                        expect(result.current.queries.basket.data).toEqual({test: 'new data'})
                        expect(result.current.queries.basket.isRefetching).toBe(false)
                    }

                    if (invalidate) {
                        // customerBaskets query should be invalidated and refetching
                        expect(result.current.queries.customerBaskets.data).toEqual({
                            test: 'old data'
                        })
                        expect(result.current.queries.customerBaskets.isRefetching).toBe(true)
                    }

                    if (remove) {
                        expect(result.current.queries.basket.data).not.toBeDefined()
                    }
                }
            },
            {
                name: 'error',
                assertions: async () => {
                    mockMutationEndpoints('/checkout/shopper-baskets/', {errorResponse: 500})

                    const {result, waitForNextUpdate} = renderHookWithProviders(() => {
                        return useShopperBasketsMutation(mutationName)
                    })

                    act(() => {
                        result.current.mutate(payload)
                    })

                    await waitForNextUpdate()

                    expect(result.current.error).toBeDefined()
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
