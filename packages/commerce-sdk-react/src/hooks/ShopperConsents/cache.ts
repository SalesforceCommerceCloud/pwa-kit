/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, CacheUpdateMatrix} from '../types'
import {getSubscriptions} from './queryKeyHelpers'
import {CLIENT_KEYS} from '../../constant'

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_CONSENTS
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    updateSubscription(customerId, {parameters}, response) {
        // When a subscription is updated, we invalidate the getSubscriptions query
        // to ensure the UI reflects the latest subscription state
        return {
            invalidate: [{queryKey: getSubscriptions.queryKey(parameters)}]
        }
    },
    updateSubscriptions(customerId, {parameters}, response) {
        // When multiple subscriptions are updated, we invalidate the getSubscriptions query
        // to ensure the UI reflects the latest subscription states
        return {
            invalidate: [{queryKey: getSubscriptions.queryKey(parameters)}]
        }
    }
}
