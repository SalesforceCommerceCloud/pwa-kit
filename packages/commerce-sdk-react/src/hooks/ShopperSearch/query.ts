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
import {mergeOptions} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'

type Client = ApiClients['shopperSearch']

/**
 * Provides keyword and refinement search functionality for products. Only returns the product ID, link, and name in
the product search hit. The search result contains only products that are online and assigned to site catalog.
 * @returns A TanStack Query query hook with data from the Shopper Search `productSearch` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-search?meta=productSearch| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppersearch.shoppersearch-1.html#productsearch | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useProductSearch = (
    apiOptions: Argument<Client['productSearch']>,
    queryOptions: ApiQueryOptions<Client['productSearch']> = {}
): UseQueryResult<DataType<Client['productSearch']>> => {
    type Options = Argument<Client['productSearch']>
    type Data = DataType<Client['productSearch']>
    const {shopperSearch: client} = useCommerceApi()
    const methodName = 'productSearch'
    const requiredParameters = ['organizationId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Provides keyword search functionality for products, categories, and brands suggestions. Returns suggested products, suggested categories, and suggested brands for the given search phrase.
 * @returns A TanStack Query query hook with data from the Shopper Search `getSearchSuggestions` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-search?meta=getSearchSuggestions| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppersearch.shoppersearch-1.html#getsearchsuggestions | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useSearchSuggestions = (
    apiOptions: Argument<Client['getSearchSuggestions']>,
    queryOptions: ApiQueryOptions<Client['getSearchSuggestions']> = {}
): UseQueryResult<DataType<Client['getSearchSuggestions']>> => {
    type Options = Argument<Client['getSearchSuggestions']>
    type Data = DataType<Client['getSearchSuggestions']>
    const {shopperSearch: client} = useCommerceApi()
    const methodName = 'getSearchSuggestions'
    const requiredParameters = ['organizationId', 'siteId', 'q'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
