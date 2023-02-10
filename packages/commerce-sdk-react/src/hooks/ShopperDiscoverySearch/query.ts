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

type Client = ApiClients['shopperDiscoverySearch']

/**
 * A hook for `ShopperDiscoverySearch#getSuggestions`.
 * This method gets suggestions for the user's search activity for a channel.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-discovery-search?meta=getSuggestions} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperdiscoverysearch.shopperdiscoverysearch-1.html#getsuggestions} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useSuggestions = (
    apiOptions: Argument<Client['getSuggestions']>,
    queryOptions: Omit<UseQueryOptions<DataType<Client['getSuggestions']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getSuggestions']>> => {
    const {shopperDiscoverySearch: client} = useCommerceApi()
    const method = (arg: Argument<Client['getSuggestions']>) => client.getSuggestions(arg)
    const requiredParameters = ['organizationId', 'channelId', 'suggestionTypes', 'locale'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({parameters}: MergedOptions<Client, Argument<Client['getSuggestions']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/channels/',
            parameters.channelId,
            '/suggestions',
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
