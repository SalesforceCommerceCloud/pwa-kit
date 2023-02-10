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
    queryOptions: Omit<UseQueryOptions<DataType<Client['productSearch']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['productSearch']>> => {
    const {shopperSearch: client} = useCommerceApi()
    const method = (arg: Argument<Client['productSearch']>) => client.productSearch(arg)
    const requiredParameters = ['organizationId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({parameters}: MergedOptions<Client, Argument<Client['productSearch']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/product-search',
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
 * A hook for `ShopperSearch#getSearchSuggestions`.
 * Provides keyword search functionality for products, categories, and brands suggestions. Returns suggested products, suggested categories, and suggested brands for the given search phrase.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-search?meta=getSearchSuggestions} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppersearch.shoppersearch-1.html#getsearchsuggestions} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useSearchSuggestions = (
    apiOptions: Argument<Client['getSearchSuggestions']>,
    queryOptions: Omit<UseQueryOptions<DataType<Client['getSearchSuggestions']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getSearchSuggestions']>> => {
    const {shopperSearch: client} = useCommerceApi()
    const method = (arg: Argument<Client['getSearchSuggestions']>) =>
        client.getSearchSuggestions(arg)
    const requiredParameters = ['organizationId', 'siteId', 'q'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getSearchSuggestions']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/search-suggestions',
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
