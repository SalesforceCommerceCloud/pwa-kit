/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {act} from '@testing-library/react'
import nock from 'nock'
import {createQueryClient, DEFAULT_TEST_HOST, renderHookWithProviders} from '../../test-utils'
import {useShopperBasketsMutation} from './mutation'
import {useBasket} from './query'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: '123'})
    }))
})

test('success', async () => {
    nock(DEFAULT_TEST_HOST)
        .get((uri) => {
            return uri.includes('/checkout/shopper-baskets/')
        })
        .reply(200, {})
        .patch((uri) => {
            return uri.includes('/checkout/shopper-baskets/')
        })
        .reply(200, {})
        .put((uri) => {
            return uri.includes('/checkout/shopper-baskets/')
        })
        .reply(200, {})
        .post((uri) => {
            return uri.includes('/checkout/shopper-baskets/')
        })
        .reply(200, {})
        .delete((uri) => {
            return uri.includes('/checkout/shopper-baskets/')
        })
        .reply(204, {})

    const queryClient = createQueryClient()

    const {result, waitForValueToChange} = renderHookWithProviders(() => {
        // TODO: also, useCustomerBaskets()
        const query = useBasket({basketId: '12345'})
        const mutation = useShopperBasketsMutation('updateBasket')

        return {
            query,
            mutation
        }
    })

    await waitForValueToChange(() => result.current.query.data)

    act(() => {
        result.current.mutation.mutate({parameters: {basketId: 'FOO'}, body: {currency: 'USD'}})
    })

    await waitForValueToChange(() => result.current.mutation.data)

    expect(result.current.mutation.data).toBeDefined()
    expect(result.current.mutation.isLoading).toBe(false)

    expect(result.current.query.data).toBeDefined()
    expect(result.current.query.isLoading).toBe(false)

    // TODO: test the query cache before and after
})
