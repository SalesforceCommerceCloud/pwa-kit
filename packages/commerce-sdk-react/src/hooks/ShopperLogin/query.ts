/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType, QueryResponse} from '../types'
import {useAsync} from '../useAsync'
import useCommerceApi from '../useCommerceApi'

type Client = ApiClients['shopperLogin']

/**
 * A hook for `ShopperLogin#retrieveCredQualityUserInfo`.
 * Get credential quality statistics for a user.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=retrieveCredQualityUserInfo} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#retrievecredqualityuserinfo} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useRetrieveCredQualityUserInfo = (
    arg: Argument<Client['retrieveCredQualityUserInfo']>
): QueryResponse<DataType<Client['retrieveCredQualityUserInfo']>> => {
    const {shopperLogin: client} = useCommerceApi()
    return useAsync(() => client.retrieveCredQualityUserInfo(arg), [arg])
}
/**
 * A hook for `ShopperLogin#logoutCustomer`.
 * Log out a shopper.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=logoutCustomer} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#logoutcustomer} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useLogoutCustomer = (
    arg: Argument<Client['logoutCustomer']>
): QueryResponse<DataType<Client['logoutCustomer']>> => {
    const {shopperLogin: client} = useCommerceApi()
    return useAsync(() => client.logoutCustomer(arg), [arg])
}
/**
 * A hook for `ShopperLogin#authorizeCustomer`.
 * Get an authorization code after authenticating a user against an identity provider (IDP). This is the first step of the OAuth 2.0 authorization code flow, where a user can log in via federation to the IDP configured for the client. After successfully logging in, the user gets an authorization code via a redirect URI.\<br /\>\<br /\>This endpoint can be called from the front channel (the browser).
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=authorizeCustomer} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#authorizecustomer} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useAuthorizeCustomer = (
    arg: Argument<Client['authorizeCustomer']>
): QueryResponse<DataType<Client['authorizeCustomer']>> => {
    const {shopperLogin: client} = useCommerceApi()
    return useAsync(() => client.authorizeCustomer(arg), [arg])
}
/**
 * A hook for `ShopperLogin#getUserInfo`.
 * Returns a JSON listing of claims about the currently authenticated user.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getUserInfo} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#getuserinfo} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useUserInfo = (
    arg: Argument<Client['getUserInfo']>
): QueryResponse<DataType<Client['getUserInfo']>> => {
    const {shopperLogin: client} = useCommerceApi()
    return useAsync(() => client.getUserInfo(arg), [arg])
}
/**
 * A hook for `ShopperLogin#getWellknownOpenidConfiguration`.
 * Returns a JSON listing of the OpenID/OAuth endpoints, supported scopes and claims, public keys used to sign the tokens, and other details.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getWellknownOpenidConfiguration} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#getwellknownopenidconfiguration} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useWellknownOpenidConfiguration = (
    arg: Argument<Client['getWellknownOpenidConfiguration']>
): QueryResponse<DataType<Client['getWellknownOpenidConfiguration']>> => {
    const {shopperLogin: client} = useCommerceApi()
    return useAsync(() => client.getWellknownOpenidConfiguration(arg), [arg])
}
/**
 * A hook for `ShopperLogin#getJwksUri`.
 * Returns a JSON Web Key Set (JWKS) containing public keys that enable clients to validate the Shopper JSON Web Token (JWT) issued by SLAS.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getJwksUri} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#getjwksuri} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useJwksUri = (
    arg: Argument<Client['getJwksUri']>
): QueryResponse<DataType<Client['getJwksUri']>> => {
    const {shopperLogin: client} = useCommerceApi()
    return useAsync(() => client.getJwksUri(arg), [arg])
}
