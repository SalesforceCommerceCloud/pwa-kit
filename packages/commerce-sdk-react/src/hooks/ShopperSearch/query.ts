/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ApiClients, ApiQueryKey, ApiQueryOptions, Argument, DataType} from '../types'
import useCommerceApi from '../useCommerceApi'
import {useQuery} from '../useQuery'
import {mergeOptions} from '../utils'

type Client = ApiClients['shopperSearch']

/**
 * A hook for `ShopperSearch#productSearch`.
 * Provides keyword and refinement search functionality for products. Only returns the product ID, link, and name in
the product search hit. The search result contains only products that are online and assigned to site catalog.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-search?meta=productSearch} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppersearch.shoppersearch-1.html#productsearch} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useProductSearch = (
    apiOptions: Argument<Client['productSearch']>,
    queryOptions: ApiQueryOptions<Client['productSearch']> = {}
): UseQueryResult<DataType<Client['productSearch']>> => {
    const {shopperSearch: client} = useCommerceApi()
    const method = async (options: Argument<Client['productSearch']>) =>
        await client.productSearch(options)
    const requiredParameters = ['organizationId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/product-search',
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['productSearch']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
/**
 * A hook for `ShopperSearch#getSearchSuggestions`.
 * Provides keyword search functionality for products, categories, and brands suggestions. Returns suggested products, suggested categories, and suggested brands for the given search phrase.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-search?meta=getSearchSuggestions} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppersearch.shoppersearch-1.html#getsearchsuggestions} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useSearchSuggestions = (
    apiOptions: Argument<Client['getSearchSuggestions']>,
    queryOptions: ApiQueryOptions<Client['getSearchSuggestions']> = {}
): UseQueryResult<DataType<Client['getSearchSuggestions']>> => {
    const {shopperSearch: client} = useCommerceApi()
    const method = async (options: Argument<Client['getSearchSuggestions']>) =>
        await client.getSearchSuggestions(options)
    const requiredParameters = ['organizationId', 'siteId', 'q'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/search-suggestions',
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getSearchSuggestions']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
