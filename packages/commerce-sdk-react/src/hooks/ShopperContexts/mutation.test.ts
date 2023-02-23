/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {NotImplementedError} from '../utils'
import {ShopperContextsMutation, useShopperContextsMutation} from './mutation'

describe('Shopper Contexts mutation hooks', () => {
    // Not implemented checks are temporary to make sure we don't forget to add tests when adding
    // implentations. When all mutations are added, the "not implemented" tests can be removed.
    const notImplTestCases: ShopperContextsMutation[] = [
        'createShopperContext',
        'deleteShopperContext',
        'updateShopperContext'
    ]
    test.each(notImplTestCases)('`%s` is not yet implemented', async (mutationName) => {
        expect(() => useShopperContextsMutation(mutationName)).toThrow(NotImplementedError)
    })
})
