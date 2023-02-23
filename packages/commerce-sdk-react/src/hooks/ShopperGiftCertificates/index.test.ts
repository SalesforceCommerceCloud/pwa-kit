/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperGiftCertificates} from 'commerce-sdk-isomorphic'
import {getUnimplementedEndpoints} from '../../test-utils'
import * as queries from './query'

describe('Shopper GiftCertificates hooks', () => {
    test('all endpoints have hooks', () => {
        const unimplemented = getUnimplementedEndpoints(ShopperGiftCertificates, queries)
        expect(unimplemented).toEqual([])
    })
})
