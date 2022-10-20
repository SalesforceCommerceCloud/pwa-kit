/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType} from '../types'
import {useQuery} from '../useQuery'
import {UseQueryOptions, UseQueryResult} from '@tanstack/react-query'

type Client = ApiClients['shopperPromotions']

type UsePromotionsParameters = NonNullable<Argument<Client['getPromotions']>>['parameters']
type UsePromotionsHeaders = NonNullable<Argument<Client['getPromotions']>>['headers']
type UsePromotionsArg = {
    headers?: UsePromotionsHeaders
    rawResponse?: boolean
} & UsePromotionsParameters
/**
 * A hook for `ShopperPromotions#getPromotions`.
 * Returns an array of enabled promotions for a list of specified IDs. In the request URL, you can specify up to 50 IDs. If you specify an ID that contains either parentheses or the separator characters, you must URL encode these characters. Each request returns only enabled promotions as the server does not consider promotion qualifiers or schedules.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-promotions?meta=getPromotions} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperpromotions.shopperpromotions-1.html#getpromotions} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function usePromotions(
    arg: Omit<UsePromotionsArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getPromotions']> | Response, Error>
): UseQueryResult<DataType<Client['getPromotions']>, Error>
function usePromotions(
    arg: Omit<UsePromotionsArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getPromotions']> | Response, Error>
): UseQueryResult<Response, Error>
function usePromotions(
    arg: UsePromotionsArg,
    options?: UseQueryOptions<DataType<Client['getPromotions']> | Response, Error>
): UseQueryResult<DataType<Client['getPromotions']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    return useQuery(
        ['promotions', arg],
        (_, {shopperPromotions}) => {
            return shopperPromotions.getPromotions({parameters, headers}, rawResponse)
        },
        options
    )
}

type UsePromotionsForCampaignParameters = NonNullable<
    Argument<Client['getPromotionsForCampaign']>
>['parameters']
type UsePromotionsForCampaignHeaders = NonNullable<
    Argument<Client['getPromotionsForCampaign']>
>['headers']
type UsePromotionsForCampaignArg = {
    headers?: UsePromotionsForCampaignHeaders
    rawResponse?: boolean
} & UsePromotionsForCampaignParameters
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
function usePromotionsForCampaign(
    arg: Omit<UsePromotionsForCampaignArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getPromotionsForCampaign']> | Response, Error>
): UseQueryResult<DataType<Client['getPromotionsForCampaign']>, Error>
function usePromotionsForCampaign(
    arg: Omit<UsePromotionsForCampaignArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getPromotionsForCampaign']> | Response, Error>
): UseQueryResult<Response, Error>
function usePromotionsForCampaign(
    arg: UsePromotionsForCampaignArg,
    options?: UseQueryOptions<DataType<Client['getPromotionsForCampaign']> | Response, Error>
): UseQueryResult<DataType<Client['getPromotionsForCampaign']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    return useQuery(
        ['promotions-for-campaign', arg],
        (_, {shopperPromotions}) =>
            shopperPromotions.getPromotionsForCampaign({parameters, headers}, rawResponse),
        options
    )
}

export {usePromotions, usePromotionsForCampaign}
