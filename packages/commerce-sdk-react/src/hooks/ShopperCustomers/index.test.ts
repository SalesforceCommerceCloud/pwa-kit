/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperCustomers} from 'commerce-sdk-isomorphic'
import {getUnimplementedEndpoints} from '../../test-utils'
import {cacheUpdateMatrix} from './cache'
import * as queries from './query'

describe('Shopper Customers hooks', () => {
    test('all endpoints have hooks', () => {
        const unimplemented = getUnimplementedEndpoints(
            ShopperCustomers,
            queries,
            cacheUpdateMatrix
        )
        expect(unimplemented).toEqual([
            'invalidateCustomerAuth', // DEPRECATED, not included
            'authorizeCustomer', // DEPRECATED, not included
            'authorizeTrustedSystem', // DEPRECATED, not included
            'registerExternalProfile', // TODO: Implement when the endpoint exits closed beta
            'getExternalProfile', // TODO: Implement when the endpoint exits closed beta
            // The rest, we just haven't gotten to yet
            'updateCustomerPassword',
            'deleteCustomerProductList',
            'updateCustomerProductList'
        ])
    })
})
