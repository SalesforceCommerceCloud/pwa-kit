/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, CacheUpdateMatrix} from '../types'
import {getShopperContext} from './queryKeyHelpers'
import {CLIENT_KEYS} from '../../constant'

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_CONTEXTS
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

// TODO: Complete cache invalidation https://gus.lightning.force.com/lightning/_classic/%2Fa07EE00001NoYplYAF
export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    createShopperContext(customerId, {parameters}) {
        return {
            invalidate: [{queryKey: getShopperContext.queryKey(parameters)}]
        }
    },
    updateShopperContext(_customerId, {parameters}) {
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
