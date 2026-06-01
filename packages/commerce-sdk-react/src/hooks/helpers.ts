/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Auth from '../auth'
import {CommerceApiProviderProps} from '../provider'
import {Logger} from '../types'
import {CustomEndpointArg, OptionalCustomEndpointClientConfig, TMutationVariables} from './types'
import {onClient} from '../utils'

/**
 * A helper function for handling bad responses from SCAPI when an invalid access token is used.
 *
 * Re-throws the error if it is not caused by an invalid access token
 * @param error - the error
 * @returns a new guest access token
 */
export const handleInvalidToken = async (error: any, auth: Auth, logger: Logger) => {
    // The proxy returns a 400 with this message when the HttpOnly access token cookie
    // (cc-at_{siteId}) is missing. This can happen if the cookie was deleted externally
    // (e.g. via dev tools) while the non-HttpOnly expiry cookie (cc-at-expires) remained
    // valid, causing isAccessTokenExpired() to incorrectly report the token as not expired.
    // Clear the stale expiry cookie and trigger a token refresh.
    if (error?.response?.status === 400) {
        const response = await error?.response?.json()
        if (response?.message === 'access_token_cookie_missing') {
            logger.warn('Access token cookie missing. Clearing expiry and refreshing token.')
            auth.clearAccessTokenExpiry()
            return await auth.refreshAccessToken()
        }
    }

    if (error?.response?.status !== 401) {
        throw error
    }

    const response = await error?.response?.json()
    if (response?.detail === 'Customer credentials changed after token was issued.') {
        logger.info('Login was invalidated. Clearing login state.')
        return await auth.logout()
    }

    throw error
}

/**
 * A helper function for preparing a call to the SCAPI custom API endpoint
 */
export const generateCustomEndpointOptions = (
    options: OptionalCustomEndpointClientConfig,
    config: Omit<CommerceApiProviderProps, 'children'>,
    access_token: string,
    args?: TMutationVariables
): CustomEndpointArg => {
    const globalHeaders = config.headers || {}
    const globalClientConfig = {
        parameters: {
            clientId: config.clientId,
            siteId: config.siteId,
            organizationId: config.organizationId,
            shortCode: config.shortCode
        },
        proxy: config.proxy,
        throwOnBadResponse: true
    }

    return {
        ...options,
        options: {
            ...options.options,
            method: options.options?.method || 'GET',
            headers: {
                // When HttpOnly session cookies are enabled on the client, the proxy injects the
                // Authorization header from the cookie — skip adding it here.
                ...(config.enableHttpOnlySessionCookies && onClient()
                    ? {}
                    : {Authorization: `Bearer ${access_token}`}),
                // Note the order of the following de-structured objects is important.
                // Priority in ascending order: global config < query/mutation config < mutate func args
                ...globalHeaders,
                ...options.options?.headers,
                ...(args?.headers ? args.headers : {})
            }
        },
        clientConfig: {
            ...globalClientConfig,
            ...(options.clientConfig || {})
        }
    }
}
