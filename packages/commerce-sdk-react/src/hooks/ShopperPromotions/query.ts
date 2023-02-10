/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryOptions, UseQueryResult} from '@tanstack/react-query'
import {ApiClients, Argument, DataType, MergedOptions} from '../types'
import useCommerceApi from '../useCommerceApi'
import {useQuery} from '../useQuery'

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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getPromotions']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getPromotions']>> => {
    const {shopperPromotions: client} = useCommerceApi()
    const method = (arg: Argument<Client['getPromotions']>) => client.getPromotions(arg)
    const requiredParameters = ['organizationId', 'siteId', 'ids'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({parameters}: MergedOptions<Client, Argument<Client['getPromotions']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/promotions',
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
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
    queryOptions: Omit<
        UseQueryOptions<DataType<Client['getPromotionsForCampaign']>>,
        'queryFn'
    > = {}
): UseQueryResult<DataType<Client['getPromotionsForCampaign']>> => {
    const {shopperPromotions: client} = useCommerceApi()
    const method = (arg: Argument<Client['getPromotionsForCampaign']>) =>
        client.getPromotionsForCampaign(arg)
    const requiredParameters = ['organizationId', 'campaignId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getPromotionsForCampaign']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/promotions/campaigns/',
            parameters.campaignId,
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
    })
}
