/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {CommerceApiContext} from '../provider'
import {ApiClients} from './types'

/**
 * Access a set of initialized Commerce API clients, which are initialized using the configurations passed to the CommerceApiProvider.
 *
 * @group Helpers
 *
 * @returns Commerce API clients
 */
function useCommerceApi(): ApiClients
/**
 * Access a specific initialized Commerce API client with validation.
 *
 * @param clientName - The name of the client to retrieve
 * @returns The specified Commerce API client (guaranteed to be non-null)
 * @throws Error if the specified client is not initialized
 */
function useCommerceApi<T extends keyof ApiClients>(clientName: T): NonNullable<ApiClients[T]>
function useCommerceApi<T extends keyof ApiClients>(clientName?: T) {
    const api = React.useContext(CommerceApiContext)
    
    // If no client name is provided, return the full API object (backwards compatibility)
    if (clientName === undefined) {
        return api
    }
    
    // If a client name is provided, validate and return the specific client
    const client = api[clientName]
    if (!client) {
        throw new Error(
            `Missing required client: ${String(clientName)}. ` +
                `Please initialize ${String(
                    clientName
                )} class and provide it in CommerceApiProvider's apiClients prop.`
        )
    }
    return client
}

export default useCommerceApi
