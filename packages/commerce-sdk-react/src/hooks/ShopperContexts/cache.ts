/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, CacheUpdateMatrix} from '../types'

type Client = ApiClients['shopperContexts']

/** Logs a warning to console (on startup) and returns nothing (method is unimplemented). */
const TODO = (method: keyof Client) => {
    console.warn(`Cache logic for '${method}' is not yet implemented.`)
    return undefined
}
export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    updateShopperContext: TODO('updateShopperContext'),
    createShopperContext: TODO('createShopperContext'),
    deleteShopperContext: TODO('deleteShopperContext')
}
