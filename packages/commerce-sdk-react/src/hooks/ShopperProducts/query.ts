/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType} from '../types'
import {useAsync} from '../useAsync'
import useCommerceApi from '../useCommerceApi'
import {UseQueryOptions, UseQueryResult} from '@tanstack/react-query'
import {useQuery} from '@tanstack/react-query'

type Client = ApiClients['shopperProducts']
/**
 * A hook for `ShopperProducts#getProducts`.
 * Allows access to multiple products by a single request. Only products that are online and assigned to a site catalog are returned. The maximum number of productIDs that can be requested are 24. Along with product details, the availability, images, price, promotions, and variations for the valid products will be included, as appropriate.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProducts} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getproducts} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
type UseProductsParameters = NonNullable<Argument<Client['getProducts']>>['parameters']
type UseProductsHeaders = NonNullable<Argument<Client['getProducts']>>['headers']
function useProducts(
    parameters: UseProductsParameters,
    options?: {
        headers: UseProductsHeaders
        rawResponse: false
        queryOptions: UseQueryOptions<DataType<Client['getProducts']> | Response, Error>
    }
): UseQueryResult<DataType<Client['getProducts']>, Error>
function useProducts(
    parameters: UseProductsParameters,
    options?: {
        headers: UseProductsHeaders
        rawResponse: true
        queryOptions?: UseQueryOptions<DataType<Client['getProducts']> | Response, Error>
    }
): UseQueryResult<Response, Error>
function useProducts(
    parameters: UseProductsParameters,
    options?: {
        headers: UseProductsHeaders
        rawResponse: boolean
        queryOptions?: UseQueryOptions<DataType<Client['getProducts']> | Response, Error>
    }
): UseQueryResult<DataType<Client['getProducts']> | Response, Error>
function useProducts(
    parameters: UseProductsParameters,
    options?: {
        headers: UseProductsHeaders
        rawResponse: boolean
        queryOptions?: UseQueryOptions<DataType<Client['getProducts']> | Response, Error>
    }
) {
    if (!parameters) {
        throw new Error('parameters are required')
    }
    const {shopperProducts: client} = useCommerceApi()
    return useAsync(
        ['products', parameters],
        () => client.getProducts({parameters, headers: options?.headers}, options?.rawResponse),
        options?.queryOptions
    )
}
/**
 * A hook for `ShopperProducts#getProduct`.
 * Allows access to product details for a single product ID. Only products that are online and assigned to a site catalog are returned. Along with product details, the availability, images, price, bundled_products, set_products, recommedations, product options, variations, and promotions for the products will be included, as appropriate.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProduct} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getproduct} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
type UseProductParameters = NonNullable<Argument<Client['getProduct']>>['parameters']
type UseProductHeaders = NonNullable<Argument<Client['getProduct']>>['headers']
function useProduct(
    parameters: UseProductParameters,
    options?: {
        headers: UseProductHeaders
        rawResponse: false
        queryOptions: UseQueryOptions<DataType<Client['getProduct']> | Response, Error>
    }
): UseQueryResult<DataType<Client['getProduct']>, Error>
function useProduct(
    parameters: UseProductParameters,
    options?: {
        headers: UseProductHeaders
        rawResponse: true
        queryOptions: UseQueryOptions<DataType<Client['getProduct']> | Response, Error>
    }
): UseQueryResult<Response, Error>
function useProduct(
    parameters: UseProductParameters,
    options?: {
        headers: UseProductHeaders
        rawResponse: boolean
        queryOptions: UseQueryOptions<DataType<Client['getProduct']> | Response, Error>
    }
): UseQueryResult<DataType<Client['getProduct']> | Response, Error>
function useProduct(
    parameters: UseProductParameters,
    options?: {
        headers: UseProductHeaders
        rawResponse: boolean
        queryOptions: UseQueryOptions<DataType<Client['getProduct']> | Response, Error>
    }
): UseQueryResult<DataType<Client['getProduct']> | Response, Error> {
    const {shopperProducts: client} = useCommerceApi()
    return useAsync(
        ['product', parameters],
        () => client.getProduct({parameters, headers: options?.headers}, options?.rawResponse),
        options?.queryOptions
    )
}
/**
 * A hook for `ShopperProducts#getCategories`.
 * When you use the URL template, the server returns multiple categories (a result object of category documents). You can use this template as a convenient way of obtaining multiple categories in a single request, instead of issuing separate requests for each category. You can specify up to 50 multiple IDs. You must enclose the list of IDs in parentheses. If a category identifier contains parenthesis or the separator sign, you must URL encode the character. The server only returns online categories.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getCategories} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getcategories} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
type UseCategoriesParameters = NonNullable<Argument<Client['getCategories']>>['parameters']
type UseCategoriesHeaders = NonNullable<Argument<Client['getCategories']>>['headers']
function useCategories(
    parameters: UseCategoriesParameters,
    options?: {
        headers?: UseCategoriesHeaders
        rawResponse: false
        queryOptions: UseQueryOptions<DataType<Client['getCategories']> | Response, Error>
    }
): UseQueryResult<DataType<Client['getCategories']>, Error>
function useCategories(
    parameters: UseCategoriesParameters,
    options?: {
        headers?: UseCategoriesHeaders
        rawResponse: true
        queryOptions: UseQueryOptions<DataType<Client['getCategories']> | Response, Error>
    }
): UseQueryResult<Response, Error>
function useCategories(
    parameters: UseCategoriesParameters,
    options?: {
        headers?: UseCategoriesHeaders
        rawResponse?: boolean
        queryOptions: UseQueryOptions<DataType<Client['getCategories']> | Response, Error>
    }
): UseQueryResult<DataType<Client['getCategories']> | Response, Error>
function useCategories(
    parameters: UseCategoriesParameters,
    options?: {
        headers?: UseCategoriesHeaders
        rawResponse?: boolean
        queryOptions: UseQueryOptions<DataType<Client['getCategories']> | Response, Error>
    }
): UseQueryResult<DataType<Client['getCategories']> | Response, Error> {
    const {shopperProducts: client} = useCommerceApi()
    return useAsync(
        ['categories', parameters],
        () => client.getCategories({parameters, headers: options?.headers}, options?.rawResponse),
        options?.queryOptions
    )
}
/**
 * A hook for `ShopperProducts#getCategory`.
 * When you use the URL template below, the server returns a category identified by its ID; by default, the server
also returns the first level of subcategories, but you can specify another level by setting the levels
parameter. The server only returns online categories.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getCategory} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getcategory} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
type UseCategoryParameters = NonNullable<Argument<Client['getCategory']>>['parameters']
type UseCategoryHeaders = NonNullable<Argument<Client['getCategory']>>['headers']
function useCategory(
    parameters: UseCategoryParameters,
    options?: {
        headers?: UseCategoryHeaders
        rawResponse: false
        queryOptions: UseQueryOptions<DataType<Client['getCategory']> | Response, Error>
    }
): UseQueryResult<DataType<Client['getCategory']>, Error>
function useCategory(
    parameters: UseCategoryParameters,
    options?: {
        headers?: UseCategoryHeaders
        rawResponse: true
        queryOptions: UseQueryOptions<DataType<Client['getCategory']> | Response, Error>
    }
): UseQueryResult<Response, Error>
function useCategory(
    parameters: UseCategoryParameters,
    options?: {
        headers?: UseCategoryHeaders
        rawResponse?: boolean
        queryOptions: UseQueryOptions<DataType<Client['getCategory']> | Response, Error>
    }
): UseQueryResult<DataType<Client['getCategory']> | Response, Error>
function useCategory(
    parameters: UseCategoryParameters,
    options?: {
        headers?: UseCategoryHeaders
        rawResponse?: boolean
        queryOptions: UseQueryOptions<DataType<Client['getCategory']> | Response, Error>
    }
): UseQueryResult<DataType<Client['getCategory']> | Response, Error> {
    const {shopperProducts: client} = useCommerceApi()
    return useAsync(
        ['category', parameters],
        () => client.getCategory({parameters, headers: options?.headers}, options?.rawResponse),
        options?.queryOptions
    )
}

export {useProducts, useProduct, useCategories, useCategory}
