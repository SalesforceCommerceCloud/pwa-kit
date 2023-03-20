/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, CacheUpdateMatrix} from '../types'

const noop = () => ({})
const TODO = (method: string): undefined => {
    // This is kind of a hacky way of passing both the "not implemented" tests in mutations.test.ts
    // and the "all hooks have cache logic" test in index.test.ts. The former expects `undefined`
    // as a value and the latter expects the key to exist, both of which are satisfied by setting
    // an explicit `undefined`. So that's all that this does, plus logging a TODO warning.
    // Hacky, but temporary!
    console.warn(`Cache logic for '${method}' is not yet implemented.`)
    return undefined
}

export const cacheUpdateMatrix: CacheUpdateMatrix<ApiClients['shopperLogin']> = {
    authorizePasswordlessCustomer: noop,
    logoutCustomer: () => {
        return {
            clear: true
        }
    },
    getAccessToken: noop,
    getSessionBridgeAccessToken: noop,
    getTrustedSystemAccessToken: noop,
    getTrustedAgentAccessToken: noop,
    resetPassword: noop,
    getPasswordLessAccessToken: noop,
    revokeToken: noop,
    introspectToken: noop
}
