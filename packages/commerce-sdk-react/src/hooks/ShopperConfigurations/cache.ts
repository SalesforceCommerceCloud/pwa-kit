/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {CLIENT_KEYS} from '../../constant'
import {ApiClients, CacheUpdateMatrix} from '../types'

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_CONFIGURATIONS
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

// ShopperConfigurations API is primarily for reading configuration data
// No mutations are currently supported
export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {}
