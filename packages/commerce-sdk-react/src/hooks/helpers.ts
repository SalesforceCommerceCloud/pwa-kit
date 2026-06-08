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
 * Handles a bad response from SCAPI caused by an invalid/expired access token, returning a
 * token response the caller can use to retry the request once.
 *
 * - 400 `access_token_cookie_missing` (HttpOnly proxy): clear the stale expiry and refresh.
 * - 401 "Customer credentials changed after token was issued.": log out (clear login state).
 * - any other 401: clear the stale expiry and refresh — the refresh returns a token for the
 *   same identity, or falls back to a guest token if the refresh token is also dead.
 * - anything else: re-thrown unchanged.
 *
 * @param error - the error thrown by the SCAPI/SLAS call
 * @param auth - the Auth instance used to clear expiry / refresh / log out
 * @param logger - logger for diagnostic messages
 * @returns a token response ({@link Auth.data}) to retry with; throws if the error is not refreshable
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

    // SCAPI rejected the access token (revoked, tampered, or invalidated after a SLAS
    // key rotation) while the non-HttpOnly cc-at-expires indicator still read valid, so
    // ready() trusted the indicator and never refreshed. Clear the stale expiry FIRST so
    // _refreshAccessToken() can't short-circuit on the still-"valid" indicator, then
    // refresh so the request can be retried with a fresh token. A still-valid refresh
    // token (cc-nx) yields a new access token for the same identity; if the refresh token
    // is also dead, refreshAccessToken() falls back to a guest token (downgrading a dead
    // registered session to guest) rather than throwing — the same fallback ready() and
    // the 400 handler above already rely on. The caller retries exactly once, so a repeat
    // 401 still propagates.
    logger.warn('Access token rejected with a 401. Clearing expiry and refreshing token.')
    auth.clearAccessTokenExpiry()
    return await auth.refreshAccessToken()
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
