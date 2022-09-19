/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType} from '../types'
import {useQuery} from '../useQuery'
import useCommerceApi from '../useCommerceApi'
import {UseQueryOptions, UseQueryResult} from '@tanstack/react-query'

type Client = ApiClients['shopperSearch']

type UseProductSearchParameters = NonNullable<Argument<Client['productSearch']>>['parameters']
type UseProductSearchHeaders = NonNullable<Argument<Client['productSearch']>>['headers']
type UseProductSearchArg = {
    headers?: UseProductSearchHeaders
    rawResponse?: boolean
} & UseProductSearchParameters
/**
 * A hook for `ShopperSearch#productSearch`.
 * Provides keyword and refinement search functionality for products. Only returns the product ID, link, and name in
the product search hit. The search result contains only products that are online and assigned to site catalog.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-search?meta=productSearch} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppersearch.shoppersearch-1.html#productsearch} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useProductSearch(
    arg: Omit<UseProductSearchArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['productSearch']> | Response, Error>
): UseQueryResult<DataType<Client['productSearch']>, Error>
function useProductSearch(
    arg: Omit<UseProductSearchArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['productSearch']> | Response, Error>
): UseQueryResult<Response, Error>
function useProductSearch(
    arg: UseProductSearchArg,
    options?: UseQueryOptions<DataType<Client['productSearch']> | Response, Error>
): UseQueryResult<DataType<Client['productSearch']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    return useQuery(
        ['productSearch', arg],
        ({shopperSearch}) => shopperSearch.productSearch({parameters, headers}, rawResponse),
        options
    )
}

type UseSearchSuggestionsParameters = NonNullable<
    Argument<Client['getSearchSuggestions']>
>['parameters']
type UseSearchSuggestionsHeaders = NonNullable<Argument<Client['getSearchSuggestions']>>['headers']
type UseSearchSuggestionsArg = {
    headers?: UseSearchSuggestionsHeaders
    rawResponse?: boolean
} & UseSearchSuggestionsParameters
/**
 * A hook for `ShopperSearch#getSearchSuggestions`.
 * Provides keyword search functionality for products, categories, and brands suggestions. Returns suggested products, suggested categories, and suggested brands for the given search phrase.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-search?meta=getSearchSuggestions} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppersearch.shoppersearch-1.html#getsearchsuggestions} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useSearchSuggestions(
    arg: Omit<UseSearchSuggestionsArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getSearchSuggestions']> | Response, Error>
): UseQueryResult<DataType<Client['getSearchSuggestions']>, Error>
function useSearchSuggestions(
    arg: Omit<UseSearchSuggestionsArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getSearchSuggestions']> | Response, Error>
): UseQueryResult<Response, Error>
function useSearchSuggestions(
    arg: UseSearchSuggestionsArg,
    options?: UseQueryOptions<DataType<Client['getSearchSuggestions']> | Response, Error>
): UseQueryResult<DataType<Client['getSearchSuggestions']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    return useQuery(
        ['search-suggestions', arg],
        ({shopperSearch}) => shopperSearch.getSearchSuggestions({parameters, headers}, rawResponse),
        options
    )
}

export {useProductSearch, useSearchSuggestions}
