/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperContextsTypes} from 'commerce-sdk-isomorphic'
import {ApiClients, CacheUpdateMatrix} from '../types'
import {getShopperContext} from './queryKeyHelpers'

type Client = ApiClients['shopperContexts']

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    createShopperContext(customerId, {parameters}) {
        return {
            invalidate: [{queryKey: getShopperContext.queryKey(parameters)}]
        }
    },
    updateShopperContext(_customerId, {parameters}, response) {
        return {
            update: [
                {
                    queryKey: getShopperContext.queryKey(parameters)
                }
            ]
        }
    },
    deleteShopperContext(_customerId, {parameters}) {
        return {
            remove: [
                {
                    queryKey: getShopperContext.queryKey(parameters)
                }
            ]
        }
    }
}
