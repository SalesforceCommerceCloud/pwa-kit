/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {act} from '@testing-library/react'
import nock from 'nock'
import {DEFAULT_TEST_HOST, mockMutationEndpoints, renderHookWithProviders} from '../../test-utils'
import {
    getCacheUpdateMatrix,
    ShopperBasketMutationType,
    useShopperBasketsMutation
} from './mutation'
import {useBasket} from './query'
import {useCustomerBaskets} from '../ShopperCustomers/query'
import {CacheUpdateMatrixElement, QueryMap} from './utils'

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
                    mockRelatedQueries()

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

                    // On successful mutation, the query cache gets updated too. Let's assert it.
                    const cacheUpdateMatrix = getCacheUpdateMatrix(CUSTOMER_ID)
                    // @ts-ignore
                    const matrixElement = cacheUpdateMatrix[mutationName](payload, {})
                    const {invalidate, update, remove}: CacheUpdateMatrixElement = matrixElement

                    update?.forEach(({name}) => {
                        // query should be updated without a refetch
                        // @ts-ignore
                        expect(result.current.queries[name].data).toEqual({test: 'new data'})
                        // @ts-ignore
                        expect(result.current.queries[name].isRefetching).toBe(false)
                    })

                    invalidate?.forEach(({name}) => {
                        // query should be invalidated and refetching
                        // @ts-ignore
                        expect(result.current.queries[name].data).toEqual({
                            test: 'old data'
                        })
                        // @ts-ignore
                        expect(result.current.queries[name].isRefetching).toBe(true)
                    })

                    remove?.forEach(({name}) => {
                        // @ts-ignore
                        expect(result.current.queries[name].data).not.toBeDefined()
                    })
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

const mockRelatedQueries = () => {
    const basketEndpoint = '/checkout/shopper-baskets/'
    const customerEndpoint = '/customer/shopper-customers/'

    // The queries would initially respond with 'old data'.
    // And then subsequent responses would have 'new data' because of the cache updates.

    // For get basket
    nock(DEFAULT_TEST_HOST)
        .get((uri) => {
            return uri.includes(basketEndpoint)
        })
        .reply(200, {test: 'old data'})
    nock(DEFAULT_TEST_HOST)
        .persist()
        .get((uri) => {
            return uri.includes(basketEndpoint)
        })
        .reply(200, {test: 'new data'})

    // For get customer basket
    nock(DEFAULT_TEST_HOST)
        .get((uri) => {
            return uri.includes(customerEndpoint)
        })
        .reply(200, {test: 'old data'})
    nock(DEFAULT_TEST_HOST)
        .persist()
        .get((uri) => {
            return uri.includes(customerEndpoint)
        })
        .reply(200, {test: 'new data'})
}
