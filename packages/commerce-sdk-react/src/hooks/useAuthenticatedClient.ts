/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuth from './useAuth'
import useCommerceApi from './useCommerceApi'
import {ApiClients} from './types'

/**
 * This is a private method. It is a react hook that wraps queries / mutations with
 * authenticated API clients.
 *
 * @internal
 */
export default function useAuthenticatedClient<Vars, Data>(
    fn: (variables: Vars, apiClients: ApiClients) => Promise<Data>
) {
    const auth = useAuth()
    const apiClients = useCommerceApi()
    const clients = Object.values(apiClients)
    return async (variables: Vars) => {
        // TODO: Setting the Authorization header here means we set it every time
        // the hook is called, but we really only need it done once per "ready".
        const {access_token} = await auth.ready()
        clients.forEach((client) => {
            client.clientConfig.headers = {
                ...client.clientConfig.headers,
                Authorization: `Bearer ${access_token}`
            }
        })
        return await fn(variables, apiClients)
    }
}
