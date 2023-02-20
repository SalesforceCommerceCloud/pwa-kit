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
    type Options = Argument<Client['productSearch']>
    type Data = DataType<Client['productSearch']>
    const {shopperSearch: client} = useCommerceApi()
    const method = async (options: Options) => await client.productSearch(options)
    const requiredParameters = ['organizationId', 'siteId'] as const
    const allParameters = [
        ...requiredParameters,
        'q',
        'refine',
        'sort',
        'currency',
        'locale',
        'expand',
        'offset',
        'limit'
    ] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    // `client.clientConfig` can have parameters that are not relevant to this endpoint, so we must
    // exclude them when generating the query key.
    const parameters = pick(netOptions.parameters, allParameters)
    const queryKey = [
        '/organizations/',
        parameters.organizationId,
        '/product-search',
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
    type Options = Argument<Client['getSearchSuggestions']>
    type Data = DataType<Client['getSearchSuggestions']>
    const {shopperSearch: client} = useCommerceApi()
    const method = async (options: Options) => await client.getSearchSuggestions(options)
    const requiredParameters = ['organizationId', 'siteId', 'q'] as const
    const allParameters = [...requiredParameters, 'limit', 'currency', 'locale'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    // `client.clientConfig` can have parameters that are not relevant to this endpoint, so we must
    // exclude them when generating the query key.
    const parameters = pick(netOptions.parameters, allParameters)
    const queryKey = [
        '/organizations/',
        parameters.organizationId,
        '/search-suggestions',
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
