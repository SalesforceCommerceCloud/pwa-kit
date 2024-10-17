/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, ApiMethod, Argument, CacheUpdateGetter, DataType, MergedOptions} from '../types'
import {useMutation} from '../useMutation'
import {UseMutationResult} from '@tanstack/react-query'
import {NotImplementedError} from '../utils'
import useCommerceApi from '../useCommerceApi'
import {cacheUpdateMatrix} from './cache'

type Client = ApiClients['shopperLogin']

/**
 * Mutations available for Shopper Login
 * @group ShopperLogin
 * @category Mutation
 * @enum
 */
export const ShopperLoginMutations = {
    /**
     * Allows the customer to authenticate when their identity provider is down.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Login `authorizePasswordlessCustomer` endpoint.
     */
    AuthorizePasswordlessCustomer: 'authorizePasswordlessCustomer',
    /**
   * Log out a shopper. The shopper's access token and refresh token are revoked. If the shopper authenticated with a B2C Commerce (ECOM) instance, the OCAPI JWT is also revoked. This should be called for Registered users that have logged in using SLAS. his should be called for registered users that have logged in using SLAS. This endpoint is not for use with guest users.

Required header: Authorization header bearer token of the Shopper access token to logout.

Required parameters: `refresh token`, `channel_id`, and `client`.
   * @returns A TanStack Query mutation hook for interacting with the Shopper Login `logoutCustomer` endpoint.
   */
    LogoutCustomer: 'logoutCustomer',
    /**
     * Get an authorization code after authenticating a user against an identity provider (IDP). This is the first step of the OAuth 2.1 authorization code flow, where a user can log in via federation to the IDP configured for the client. After successfully logging in, the user gets an authorization code via a redirect URI.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Login `authorizeCustomer` endpoint.
     */
    AuthorizeCustomer: 'authorizeCustomer',
    /**
     * Get the shopper or guest JWT access token and a refresh token. This is the second step of the OAuth 2.1 authorization code flow.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Login `getAccessToken` endpoint.
     */
    GetAccessToken: 'getAccessToken',
    /**
   * Get a shopper JWT access token for a registered customer using session bridge.

For public client id requests the grant_type must be set to `session_bridge`.

For  private client_id and secret the grant_type must be set to `client_credentials` along with a basic authorization header.
   * @returns A TanStack Query mutation hook for interacting with the Shopper Login `getSessionBridgeAccessToken` endpoint.
   */
    GetSessionBridgeAccessToken: 'getSessionBridgeAccessToken',
    /**
   * Get a shopper JWT access token for a registered customer whose credentials are stored using a third party system.

For external trusted-system requests, a basic authorization header that includes a SLAS client ID and SLAS client secret can be used in place of the bearer token.

For internal trusted-system requests, the bearer token must be a C2C JWT.
   * @returns A TanStack Query mutation hook for interacting with the Shopper Login `getTrustedSystemAccessToken` endpoint.
   */
    GetTrustedSystemAccessToken: 'getTrustedSystemAccessToken',
    /**
   * Get a shopper JWT access token for a registered customer using a trusted agent (merchant).

If using a SLAS private client ID, you must also use an `_sfdc_client_auth` header. 

The value of the `_sfdc_client_auth` header must be a Base64-encoded string. The string is composed of a SLAS private client ID and client secret, separated by a colon (`:`). For example, `privateClientId:privateClientsecret` becomes `cHJpdmF0ZUNsaWVudElkOnByaXZhdGVDbGllbnRzZWNyZXQ=` after Base64 encoding.
   * @returns A TanStack Query mutation hook for interacting with the Shopper Login `getTrustedAgentAccessToken` endpoint.
   */
    GetTrustedAgentAccessToken: 'getTrustedAgentAccessToken',
    /**
     * Request a reset password token
     * @returns A TanStack Query mutation hook for interacting with the Shopper Login `getPasswordResetToken` endpoint.
     */
    GetPasswordResetToken: 'getPasswordResetToken',
    /**
     * Creates a new password
     * @returns A TanStack Query mutation hook for interacting with the Shopper Login `resetPassword` endpoint.
     */
    ResetPassword: 'resetPassword',
    /**
     * Issue a shopper token (JWT).
     * @returns A TanStack Query mutation hook for interacting with the Shopper Login `getPasswordLessAccessToken` endpoint.
     */
    GetPasswordLessAccessToken: 'getPasswordLessAccessToken',
    /**
     * Invalidate the refresh token. A basic auth header with Base64-encoded `clientId:secret` is required in the Authorization header, and the refresh token to be revoked is required in the body.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Login `revokeToken` endpoint.
     */
    RevokeToken: 'revokeToken',
    /**
     * Returns the token properties. A basic auth header with Base64-encoded `clientId:secret` is required in the Authorization header, as well as an access token or refresh token. Use `token_type_hint` to help identify the token.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Login `introspectToken` endpoint.
     */
    IntrospectToken: 'introspectToken'
} as const

/**
 * Mutation for Shopper Login.
 * @group ShopperLogin
 * @category Mutation
 */
export type ShopperLoginMutation =
    (typeof ShopperLoginMutations)[keyof typeof ShopperLoginMutations]

/**
 * Mutation hook for Shopper Login.
 * @group ShopperLogin
 * @category Mutation
 */
export function useShopperLoginMutation<Mutation extends ShopperLoginMutation>(
    mutation: Mutation
): UseMutationResult<DataType<Client[Mutation]>, unknown, Argument<Client[Mutation]>> {
    const getCacheUpdates = cacheUpdateMatrix[mutation]
    // TODO: Remove this check when all mutations are implemented.
    if (!getCacheUpdates) throw new NotImplementedError(`The '${mutation}' mutation`)

    // The `Options` and `Data` types for each mutation are similar, but distinct, and the union
    // type generated from `Client[Mutation]` seems to be too complex for TypeScript to handle.
    // I'm not sure if there's a way to avoid the type assertions in here for the methods that
    // use them. However, I'm fairly confident that they are safe to do, as they seem to be simply
    // re-asserting what we already have.
    const {shopperLogin: client} = useCommerceApi()
    type Options = Argument<Client[Mutation]>
    type Data = DataType<Client[Mutation]>
    return useMutation({
        client,
        method: (opts: Options) => (client[mutation] as ApiMethod<Options, Data>)(opts),
        getCacheUpdates: getCacheUpdates as CacheUpdateGetter<MergedOptions<Client, Options>, Data>
    })
}
