/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperBaskets} from 'commerce-sdk-isomorphic'
import {expectAllEndpointsHaveHooks} from '../../test-utils'
import {cacheUpdateMatrix} from './cache'
import {ShopperBasketsMutations} from './mutation'
import * as queries from './query'

describe('Shopper Baskets hooks', () => {
    test('all endpoints have hooks', () => {
        expectAllEndpointsHaveHooks(ShopperBaskets, queries, ShopperBasketsMutations)
    })

    test('all mutation hooks have cache update logic', () => {
        // If this test fails, add the missing mutation as a no-op or a TODO that throws NotYetImplemented
        const cacheUpdates = Object.keys(cacheUpdateMatrix).sort()
        const mutations = Object.values(ShopperBasketsMutations).sort()
        expect(cacheUpdates).toEqual(mutations)
    })
})
