/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as queryKeyHelpers from './queryKeyHelpers'
import {createUseQuery} from '../createUseQuery'

/**
 * Returns a JSON listing of claims about the currently authenticated user.
 * @group ShopperLogin
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Login `getUserInfo` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getUserInfo| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#getuserinfo | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useUserInfo = createUseQuery({
    clientKey: 'shopperLogin',
    methodName: 'getUserInfo',
    displayName: 'useUserInfo',
    queryKeyHelper: queryKeyHelpers.getUserInfo
})
/**
 * Returns a JSON listing of the OpenID/OAuth endpoints, supported scopes and claims, public keys used to sign the tokens, and other details.
 * @group ShopperLogin
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Login `getWellknownOpenidConfiguration` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getWellknownOpenidConfiguration| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#getwellknownopenidconfiguration | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useWellknownOpenidConfiguration = createUseQuery({
    clientKey: 'shopperLogin',
    methodName: 'getWellknownOpenidConfiguration',
    displayName: 'useWellknownOpenidConfiguration',
    queryKeyHelper: queryKeyHelpers.getWellknownOpenidConfiguration
})

/**
 * Returns a JSON Web Key Set (JWKS) containing the current, past, and future public keys. The key set enables clients to validate the Shopper JSON Web Token (JWT) issued by SLAS.
 * @group ShopperLogin
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Login `getJwksUri` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getJwksUri| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#getjwksuri | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useJwksUri = createUseQuery({
    clientKey: 'shopperLogin',
    methodName: 'getJwksUri',
    displayName: 'useJwksUri',
    queryKeyHelper: queryKeyHelpers.getJwksUri
})
