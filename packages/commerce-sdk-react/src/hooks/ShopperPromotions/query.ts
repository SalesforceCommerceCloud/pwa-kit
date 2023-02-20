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

type Client = ApiClients['shopperPromotions']

/**
 * A hook for `ShopperPromotions#getPromotions`.
 * Returns an array of enabled promotions for a list of specified IDs. In the request URL, you can specify up to 50 IDs. If you specify an ID that contains either parentheses or the separator characters, you must URL encode these characters. Each request returns only enabled promotions as the server does not consider promotion qualifiers or schedules.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-promotions?meta=getPromotions} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperpromotions.shopperpromotions-1.html#getpromotions} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePromotions = (
    apiOptions: Argument<Client['getPromotions']>,
    queryOptions: ApiQueryOptions<Client['getPromotions']> = {}
): UseQueryResult<DataType<Client['getPromotions']>> => {
    type Options = Argument<Client['getPromotions']>
    type Data = DataType<Client['getPromotions']>
    const {shopperPromotions: client} = useCommerceApi()
    const method = async (options: Options) => await client.getPromotions(options)
    const requiredParameters = ['organizationId', 'siteId', 'ids'] as const
    const allParameters = [...requiredParameters, 'locale'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    // `client.clientConfig` can have parameters that are not relevant to this endpoint, so we must
    // exclude them when generating the query key.
    const parameters = pick(netOptions.parameters, allParameters)
    const queryKey = [
        '/organizations/',
        parameters.organizationId,
        '/promotions',
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
 * A hook for `ShopperPromotions#getPromotionsForCampaign`.
 * Handles get promotion by filter criteria. Returns an array of enabled promotions matching the specified filter
criteria. In the request URL, you must provide a campaign_id parameter, and you can optionally specify a date
range by providing start_date and end_date parameters. Both parameters are required to specify a date range, as 
omitting one causes the server to return a MissingParameterException fault. Each request returns only enabled
promotions, since the server does not consider promotion qualifiers or schedules.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-promotions?meta=getPromotionsForCampaign} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperpromotions.shopperpromotions-1.html#getpromotionsforcampaign} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePromotionsForCampaign = (
    apiOptions: Argument<Client['getPromotionsForCampaign']>,
    queryOptions: ApiQueryOptions<Client['getPromotionsForCampaign']> = {}
): UseQueryResult<DataType<Client['getPromotionsForCampaign']>> => {
    type Options = Argument<Client['getPromotionsForCampaign']>
    type Data = DataType<Client['getPromotionsForCampaign']>
    const {shopperPromotions: client} = useCommerceApi()
    const method = async (options: Options) => await client.getPromotionsForCampaign(options)
    const requiredParameters = ['organizationId', 'campaignId', 'siteId'] as const
    const allParameters = [...requiredParameters, 'startDate', 'endDate', 'currency'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    // `client.clientConfig` can have parameters that are not relevant to this endpoint, so we must
    // exclude them when generating the query key.
    const parameters = pick(netOptions.parameters, allParameters)
    const queryKey = [
        '/organizations/',
        parameters.organizationId,
        '/promotions/campaigns/',
        parameters.campaignId,
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
