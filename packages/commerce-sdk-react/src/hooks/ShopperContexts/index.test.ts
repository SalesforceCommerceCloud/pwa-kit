/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperContexts} from 'commerce-sdk-isomorphic'
import {expectAllEndpointsHaveHooks} from '../../test-utils'
import {cacheUpdateMatrix} from './cache'
import {ShopperContextsMutations} from './mutation'
import * as queries from './query'

describe('Shopper Contexts hooks', () => {
    test('all endpoints have hooks', () => {
        expectAllEndpointsHaveHooks(ShopperContexts, queries, ShopperContextsMutations)
    })

    test('all mutation hooks have cache update logic', () => {
        const cacheUpdates = Object.keys(cacheUpdateMatrix).sort()
        const mutations = Object.values(ShopperContextsMutations).sort()
        // If this test fails, add the missing mutation as a no-op with a TODO note
        expect(cacheUpdates).toEqual(mutations)
    })
})
