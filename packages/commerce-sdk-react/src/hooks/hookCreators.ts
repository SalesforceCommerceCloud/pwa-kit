/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {valueof, ApiClients} from './types'
import {useMutation} from './useMutation'
import {MutationFunction} from '@tanstack/react-query'

/**
 * This is a utility function that creates a "useMutation" hook.
 *
 * Generic Types:
 * Action - This type must be a enum, it must be a collection of method
 *          names of a particular API client. This type is used to support
 *          auto-complete to give hint of the available mutation methods.
 *
 * Client - Type of the API clients, i.e. ApiClients['shopperCustomer']
 *
 * @param client - string, i.e. shopperCustomer
 *
 * @Internal
 */
function createMutationHook<Action, Client extends valueof<ApiClients>>(client: keyof ApiClients) {
    return (action: Action) => {
        // @ts-ignore
        type Params = Argument<Client[Action]>
        // @ts-ignore
        type Data = DataType<Client[Action]>
        return useMutation<Data, Error, Params>((params, apiClients) => {
            // @ts-ignore
            const method = apiClients[client][action] as MutationFunction<Data, Params>
            return method.call(apiClients[client], params)
        })
    }
}

export {createMutationHook}
