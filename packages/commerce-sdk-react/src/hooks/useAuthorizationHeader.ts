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

        // Build headers - only include Authorization if we have a token
        // In CDN simulator mode on client, tokens are in httpOnly cookies
        // and the proxy will inject the Authorization header
        const headers: Record<string, string> = {...options.headers}
        if (access_token) {
            headers.Authorization = `Bearer ${access_token}`
        }

        return await method({
            ...options,
            headers
        }).catch(async (error) => {
            const {access_token} = await handleInvalidToken(error, auth, logger)

            // Build retry headers
            const retryHeaders: Record<string, string> = {...options.headers}
            if (access_token) {
                retryHeaders.Authorization = `Bearer ${access_token}`
            }

            // Retry again after resetting auth state
            return await method({
                ...options,
                headers: retryHeaders
            })
        })
    }
}
