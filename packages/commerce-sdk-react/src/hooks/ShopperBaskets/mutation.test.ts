/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {act} from '@testing-library/react'
import nock from 'nock'
import {DEFAULT_TEST_HOST, renderHookWithProviders} from '../../test-utils'
import {useShopperBasketsMutation} from './mutation'
import {useBasket} from './query'
import {useCustomerBaskets} from '../ShopperCustomers/query'

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

test('success', async () => {
    // NOTE: for _all_ tests
    nock(DEFAULT_TEST_HOST)
        .patch((uri) => {
            return uri.includes('/checkout/shopper-baskets/')
        })
        .reply(200, {test: 'new data'})
        .put((uri) => {
            return uri.includes('/checkout/shopper-baskets/')
        })
        .reply(200, {test: 'new data'})
        .post((uri) => {
            return uri.includes('/checkout/shopper-baskets/')
        })
        .reply(200, {test: 'new data'})
        .delete((uri) => {
            return uri.includes('/checkout/shopper-baskets/')
        })
        .reply(204)

    // NOTE: for individual tests only
    nock(DEFAULT_TEST_HOST)
        .get((uri) => {
            return uri.includes('/checkout/shopper-baskets/')
        })
        .reply(200, {test: 'old data'})
        // TODO: split them up
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
        const mutation = useShopperBasketsMutation('updateBasket')

        return {
            queries,
            mutation
        }
    })

    await waitForValueToChange(() => result.current.queries.basket.data)

    act(() => {
        result.current.mutation.mutate({parameters: {basketId: BASKET_ID}, body: {currency: 'USD'}})
    })

    await waitForValueToChange(() => result.current.mutation.data)

    expect(result.current.mutation.data).toEqual({test: 'new data'})
    expect(result.current.mutation.isSuccess).toBe(true)

    // basket query should be updated without a refetch
    expect(result.current.queries.basket.data).toEqual({test: 'new data'})
    expect(result.current.queries.basket.isRefetching).toBe(false)

    // customerBaskets query should be invalidated and refetching
    expect(result.current.queries.customerBaskets.data).toEqual({test: 'old data'})
    expect(result.current.queries.customerBaskets.isRefetching).toBe(true)
})
