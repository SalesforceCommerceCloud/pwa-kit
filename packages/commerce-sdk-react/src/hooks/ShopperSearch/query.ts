/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType} from '../types'
import {useAsync} from '../useAsync'
import useCommerceApi from '../useCommerceApi'
import {UseQueryResult} from '@tanstack/react-query'

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
    arg: Argument<Client['productSearch']>
): UseQueryResult<DataType<Client['productSearch']>, Error> => {
    const {shopperSearch: client} = useCommerceApi()
    return useAsync(['product-search', arg], () => client.productSearch(arg))
}
/**
 * A hook for `ShopperSearch#getSearchSuggestions`.
 * Provides keyword search functionality for products, categories, and brands suggestions. Returns suggested products, suggested categories, and suggested brands for the given search phrase.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-search?meta=getSearchSuggestions} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppersearch.shoppersearch-1.html#getsearchsuggestions} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useSearchSuggestions = (
    arg: Argument<Client['getSearchSuggestions']>
): UseQueryResult<DataType<Client['getSearchSuggestions']>, Error> => {
    const {shopperSearch: client} = useCommerceApi()
    return useAsync(['search-suggestions', arg], () => client.getSearchSuggestions(arg))
}
