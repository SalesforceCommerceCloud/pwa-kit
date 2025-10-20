/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperPayments} from 'commerce-sdk-isomorphic'
import {getUnimplementedEndpoints} from '../../test-utils'
import {cacheUpdateMatrix} from './cache'
import * as queries from './query'

describe('Shopper Payments hooks', () => {
    test('all endpoints have hooks', () => {
        // unimplemented = SDK method exists, but no query hook or value in mutations enum
        const unimplemented = getUnimplementedEndpoints(ShopperPayments, queries)
        // If this test fails: create a new query hook, add the endpoint to the mutations enum,
        // or add it to the `expected` array with a comment explaining "TODO" or "never" (and why).
        expect(unimplemented).toEqual([])
    })
    test('all mutations have cache update logic', () => {
        // unimplemented = value in mutations enum, but no method in cache update matrix
        const unimplemented = new Set<string>()
        Object.entries(cacheUpdateMatrix).forEach(([method, implementation]) => {
            if (implementation) unimplemented.delete(method)
        })
        // If this test fails: add cache update logic, remove the endpoint from the mutations enum,
        // or add it to the `expected` array to indicate that it is still a TODO.
        expect([...unimplemented]).toEqual([])
    })
})
