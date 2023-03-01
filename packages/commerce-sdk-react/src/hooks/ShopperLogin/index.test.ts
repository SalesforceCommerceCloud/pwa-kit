/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperLogin} from 'commerce-sdk-isomorphic'
import {getUnimplementedEndpoints} from '../../test-utils'
import {cacheUpdateMatrix} from './cache'
import * as queries from './query'

describe('Shopper Login hooks', () => {
    test('all endpoints have hooks', () => {
        const unimplemented = getUnimplementedEndpoints(ShopperLogin, queries, cacheUpdateMatrix)
        expect(unimplemented).toEqual([
            'authenticateCustomer',
            'logoutCustomer', // TODO: Implement
            'authorizeCustomer',
            'getTrustedAgentAuthorizationToken',
            'getPasswordResetToken'
        ])
    })
})
