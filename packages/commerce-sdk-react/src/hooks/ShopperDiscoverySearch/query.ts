/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType, QueryResponse} from '../types'
import {useQuery} from '../useQuery'
import useCommerceApi from '../useCommerceApi'
import {UseQueryResult} from '@tanstack/react-query'

type Client = ApiClients['shopperDiscoverySearch']

/**
 * A hook for `ShopperDiscoverySearch#getSuggestions`.
 * This method gets suggestions for the user's search activity for a channel.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-discovery-search?meta=getSuggestions} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperdiscoverysearch.shopperdiscoverysearch-1.html#getsuggestions} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useSuggestions = (
    arg: Argument<Client['getSuggestions']>
): UseQueryResult<DataType<Client['getSuggestions']>> => {
    const {shopperDiscoverySearch: client} = useCommerceApi()
    return useQuery(['suggestions', arg], () => client.getSuggestions(arg))
}
