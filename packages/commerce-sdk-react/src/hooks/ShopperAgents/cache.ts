/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, CacheUpdateMatrix} from '../types'
import {CLIENT_KEYS} from '../../constant'

const noop = () => ({})

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_AGENTS
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    postSessionInit: noop
}
