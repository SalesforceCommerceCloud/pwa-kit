/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, DataType, ScapiActionResponse} from '../types'
import {useAsyncCallback} from '../useAsync'
import useCommerceApi from '../useCommerceApi'

type Client = ApiClients['shopperLogin']

export enum ShopperLoginActions {
    /**
     * Get authorization code after authenticating a user using an ECOM instance.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=authenticateCustomer} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#authenticatecustomer} for more information on the parameters and returned data type.
     */
    AuthenticateCustomer = 'authenticateCustomer',
    /**
     * Allows the customer to authenticate when their identity provider is down.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=authorizePasswordlessCustomer} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#authorizepasswordlesscustomer} for more information on the parameters and returned data type.
     */
    AuthorizePasswordlessCustomer = 'authorizePasswordlessCustomer',
    /**
     * Get the shopper or guest JWT access token and a refresh token. This is the second step of the OAuth 2.0 authorization code flow where a client appplication is able to get an access token for the shopper through the back channel (a trusted server) by passing in the client credentials and the authorization code retrieved from the `authorize` endpoint.\<br /\>\<br /\>As a guest user, get the shopper JWT access token and a refresh token. This is where a client appplication is able to get an access token for the guest user through the back channel (a trusted server) by passing in the client credentials.\<br /\>\<br /\>When refreshing the access token with a private client ID and client secret the refresh token is _not_ regenerated. However, when refreshing the access token with a public client ID, the refresh token is _always_ regenerated. The old refresh token is voided with every refresh call, so the refresh token on the client needs to be replaced to always store the new refresh token.\<br /\>\<br /\>See the Body section for required parameters, including `grant_type` and others, depending on the value of `grant_type`.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getAccessToken} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#getaccesstoken} for more information on the parameters and returned data type.
     */
    GetAccessToken = 'getAccessToken',
    /**
     * Get a shopper JWT access token for a registered customer whose credentials are stored using a third party system.\<br /\>\<br /\>For external trusted-system requests, a basic authorization header that includes a SLAS client ID and SLAS client secret can be used in place of the bearer token.\<br /\>\<br /\>For internal trusted-system requests, the bearer token must be a C2C JWT.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getTrustedSystemAccessToken} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#gettrustedsystemaccesstoken} for more information on the parameters and returned data type.
     */
    GetTrustedSystemAccessToken = 'getTrustedSystemAccessToken',
    /**
     * Request a reset password token
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getPasswordResetToken} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#getpasswordresettoken} for more information on the parameters and returned data type.
     */
    GetPasswordResetToken = 'getPasswordResetToken',
    /**
     * Creates a new password
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=resetPassword} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#resetpassword} for more information on the parameters and returned data type.
     */
    ResetPassword = 'resetPassword',
    /**
     * Issue a shopper token (JWT).
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getPasswordLessAccessToken} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#getpasswordlessaccesstoken} for more information on the parameters and returned data type.
     */
    GetPasswordLessAccessToken = 'getPasswordLessAccessToken',
    /**
     * Invalidate the refresh token. A basic auth header with base64 encoded `clientId:secret` is required in the Authorization header, and the refresh token to be revoked is required in the body.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=revokeToken} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#revoketoken} for more information on the parameters and returned data type.
     */
    RevokeToken = 'revokeToken',
    /**
     * Returns the token properties. A basic auth header with base64 encoded `clientId:secret` is required in the Authorization header, as well as an access token or refresh token. Use `token_type_hint` to help identify the token.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=introspectToken} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#introspecttoken} for more information on the parameters and returned data type.
     */
    IntrospectToken = 'introspectToken'
}

/**
 * A hook for performing actions with the Shopper Login API.
 */
// TODO: Why does prettier not like "extends `${Actions}`"?
// eslint-disable-next-line prettier/prettier
export function useShopperLoginAction<Action extends `${ShopperLoginActions}`>(
    action: Action
): ScapiActionResponse<Parameters<Client[Action]>, DataType<Client[Action]>, Action> {
    type Arg = Parameters<Client[Action]>
    type Data = DataType<Client[Action]>
    // Directly calling `client[action](arg)` doesn't work, because the methods don't fully
    // overlap. Adding in this type assertion fixes that, but I don't understand why. I'm fairly
    // confident, though, that it is safe, because it seems like we're mostly re-defining what we
    // already have.
    // In addition to the assertion required to get this to work, I have also simplified the
    // overloaded SDK method to a single signature that just returns the data type. This makes it
    // easier to work with when passing to other mapped types.
    function assertMethod(fn: unknown): asserts fn is (arg: Arg) => Promise<Data> {
        if (typeof fn !== 'function') throw new Error(`Unknown action: ${action}`)
    }
    const {shopperLogin: client} = useCommerceApi()
    const method = client[action]
    assertMethod(method)

    const hook = useAsyncCallback((...args: Arg) => method.call(client, args))
    // TypeScript loses information when using a computed property name - it assumes `string`, but
    // we know it's `Action`. This type assertion just restores that lost information.
    const namedAction = {[action]: hook.execute} as Record<Action, typeof hook.execute>
    return {...hook, ...namedAction}
}
