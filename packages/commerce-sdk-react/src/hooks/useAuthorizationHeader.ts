/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiOptions, ApiMethod} from './types'
import useAuthContext from './useAuthContext'
import useConfig from './useConfig'
import {handleInvalidToken} from './helpers'
import {onClient} from '../utils'

/**
 * Creates a method that waits for authentication to complete and automatically includes an
 * Authorization header when making requests.
 *
 * Also inserts a retry if the authentication token was invalidated
 *
 * @param method Bound API method
 * @internal
 */
export const useAuthorizationHeader = <Options extends ApiOptions, Data>(
    method: ApiMethod<Options, Data>
): ApiMethod<Options, Data> => {
    const auth = useAuthContext()
    const config = useConfig()
    const logger = config.logger || console
    return async (options) => {
        const {access_token} = await auth.ready()
        // When HttpOnly session cookies are enabled on the client, the proxy injects the
        // Authorization header from the cookie — skip adding it here.
        const authHeaders =
            config.enableHttpOnlySessionCookies && onClient()
                ? {}
                : {Authorization: `Bearer ${access_token}`}
        return await method({
            ...options,
            headers: {
                ...authHeaders,
                ...options.headers
            }
        }).catch(async (error) => {
            const {access_token} = await handleInvalidToken(error, auth, logger)
            const retryAuthHeaders =
                config.enableHttpOnlySessionCookies && onClient()
                    ? {}
                    : {Authorization: `Bearer ${access_token}`}

            // Retry again after resetting auth state
            return await method({
                ...options,
                headers: {
                    ...retryAuthHeaders,
                    ...options.headers
                }
            })
        })
    }
}
