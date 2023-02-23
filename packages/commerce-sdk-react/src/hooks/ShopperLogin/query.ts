/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ApiClients, ApiQueryOptions, Argument, DataType} from '../types'
import useCommerceApi from '../useCommerceApi'
import {useQuery} from '../useQuery'
import {mergeOptions, pick} from '../utils'

type Client = ApiClients['shopperLogin']

/**
 * A hook for `ShopperLogin#retrieveCredQualityUserInfo`.
 * Get credential quality statistics for a user.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=retrieveCredQualityUserInfo} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#retrievecredqualityuserinfo} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCredQualityUserInfo = (
    apiOptions: Argument<Client['retrieveCredQualityUserInfo']>,
    queryOptions: ApiQueryOptions<Client['retrieveCredQualityUserInfo']> = {}
): UseQueryResult<DataType<Client['retrieveCredQualityUserInfo']>> => {
    type Options = Argument<Client['retrieveCredQualityUserInfo']>
    type Data = DataType<Client['retrieveCredQualityUserInfo']>
    const {shopperLogin: client} = useCommerceApi()
    const method = async (options: Options) => await client.retrieveCredQualityUserInfo(options)
    const requiredParameters = ['organizationId', 'username'] as const
    const allParameters = [...requiredParameters] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    // `client.clientConfig` can have parameters that are not relevant to this endpoint, so we must
    // exclude them when generating the query key.
    const parameters = pick(netOptions.parameters, allParameters)
    const queryKey = [
        '/organizations/',
        parameters.organizationId,
        '/cred-qual/user',
        parameters
    ] as const

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * A hook for `ShopperLogin#getUserInfo`.
 * Returns a JSON listing of claims about the currently authenticated user.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getUserInfo} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#getuserinfo} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useUserInfo = (
    apiOptions: Argument<Client['getUserInfo']>,
    queryOptions: ApiQueryOptions<Client['getUserInfo']> = {}
): UseQueryResult<DataType<Client['getUserInfo']>> => {
    type Options = Argument<Client['getUserInfo']>
    type Data = DataType<Client['getUserInfo']>
    const {shopperLogin: client} = useCommerceApi()
    const method = async (options: Options) => await client.getUserInfo(options)
    const requiredParameters = ['organizationId'] as const
    const allParameters = [...requiredParameters, 'channel_id'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    // `client.clientConfig` can have parameters that are not relevant to this endpoint, so we must
    // exclude them when generating the query key.
    const parameters = pick(netOptions.parameters, allParameters)
    const queryKey = [
        '/organizations/',
        parameters.organizationId,
        '/oauth2/userinfo',
        parameters
    ] as const

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * A hook for `ShopperLogin#getWellknownOpenidConfiguration`.
 * Returns a JSON listing of the OpenID/OAuth endpoints, supported scopes and claims, public keys used to sign the tokens, and other details.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getWellknownOpenidConfiguration} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#getwellknownopenidconfiguration} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useWellknownOpenidConfiguration = (
    apiOptions: Argument<Client['getWellknownOpenidConfiguration']>,
    queryOptions: ApiQueryOptions<Client['getWellknownOpenidConfiguration']> = {}
): UseQueryResult<DataType<Client['getWellknownOpenidConfiguration']>> => {
    type Options = Argument<Client['getWellknownOpenidConfiguration']>
    type Data = DataType<Client['getWellknownOpenidConfiguration']>
    const {shopperLogin: client} = useCommerceApi()
    const method = async (options: Options) => await client.getWellknownOpenidConfiguration(options)
    const requiredParameters = ['organizationId'] as const
    const allParameters = [...requiredParameters] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    // `client.clientConfig` can have parameters that are not relevant to this endpoint, so we must
    // exclude them when generating the query key.
    const parameters = pick(netOptions.parameters, allParameters)
    const queryKey = [
        '/organizations/',
        parameters.organizationId,
        '/oauth2/.well-known/openid-configuration',
        parameters
    ] as const

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * A hook for `ShopperLogin#getJwksUri`.
 * Returns a JSON Web Key Set (JWKS) containing the current, past, and future public keys. The key set enables clients to validate the Shopper JSON Web Token (JWT) issued by SLAS.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login?meta=getJwksUri} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperlogin.shopperlogin-1.html#getjwksuri} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useJwksUri = (
    apiOptions: Argument<Client['getJwksUri']>,
    queryOptions: ApiQueryOptions<Client['getJwksUri']> = {}
): UseQueryResult<DataType<Client['getJwksUri']>> => {
    type Options = Argument<Client['getJwksUri']>
    type Data = DataType<Client['getJwksUri']>
    const {shopperLogin: client} = useCommerceApi()
    const method = async (options: Options) => await client.getJwksUri(options)
    const requiredParameters = ['organizationId'] as const
    const allParameters = [...requiredParameters] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    // `client.clientConfig` can have parameters that are not relevant to this endpoint, so we must
    // exclude them when generating the query key.
    const parameters = pick(netOptions.parameters, allParameters)
    const queryKey = [
        '/organizations/',
        parameters.organizationId,
        '/oauth2/jwks',
        parameters
    ] as const

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
