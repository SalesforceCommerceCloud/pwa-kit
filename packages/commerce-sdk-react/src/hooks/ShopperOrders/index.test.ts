/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperOrders} from 'commerce-sdk-isomorphic'
import {getUnimplementedEndpoints} from '../../test-utils'
import {cacheUpdateMatrix} from './cache'
import {ShopperOrdersMutations as mutations} from './mutation'
import * as queries from './query'

describe('Shopper Orders hooks', () => {
    test('all endpoints have hooks', () => {
        // unimplemented = SDK method exists, but no query hook or value in mutations enum
        const unimplemented = getUnimplementedEndpoints(ShopperOrders, queries, mutations)
        // If this test fails: create a new query hook, add the endpoint to the mutations enum,
        // or add it to the `expected` array with a comment explaining "TODO" or "never" (and why).
        expect(unimplemented).toEqual(['guestOrderLookup'])
    })
    test('all mutations have cache update logic', () => {
        // unimplemented = value in mutations enum, but no method in cache update matrix
        const unimplemented = new Set<string>(Object.values(mutations))
        Object.entries(cacheUpdateMatrix).forEach(([method, implementation]) => {
            if (implementation) unimplemented.delete(method)
        })
        // If this test fails: add cache update logic, remove the endpoint from the mutations enum,
        // or add it to the `expected` array to indicate that it is still a TODO.
        expect([...unimplemented]).toEqual([])
    })
})
