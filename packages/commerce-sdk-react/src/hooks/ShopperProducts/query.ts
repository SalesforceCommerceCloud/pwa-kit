/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType} from '../types'
import {useQuery} from '../useQuery'
import useConfig from '../useConfig'
import {UseQueryOptions, UseQueryResult} from '@tanstack/react-query'

type Client = ApiClients['shopperProducts']

type UseProductsParameters = NonNullable<Argument<Client['getProducts']>>['parameters']
type UseProductsHeaders = NonNullable<Argument<Client['getProducts']>>['headers']
type UseProductsArg = {headers?: UseProductsHeaders; rawResponse?: boolean} & UseProductsParameters
/**
 * A hook for `ShopperProducts#getProducts`.
 * Allows access to multiple products by a single request. Only products that are online and assigned to a site catalog are returned. The maximum number of productIDs that can be requested are 24. Along with product details, the availability, images, price, promotions, and variations for the valid products will be included, as appropriate.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProducts} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getproducts} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useProducts(
    arg: Omit<UseProductsArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getProducts']> | Response, Error>
): UseQueryResult<DataType<Client['getProducts']>, Error>
function useProducts(
    arg: Omit<UseProductsArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getProducts']> | Response, Error>
): UseQueryResult<Response, Error>
function useProducts(
    arg: UseProductsArg,
    options?: UseQueryOptions<DataType<Client['getProducts']> | Response, Error>
): UseQueryResult<DataType<Client['getProducts']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    const {locale, currency} = useConfig()
    parameters.locale = parameters.locale || locale
    parameters.currency = parameters.currency || currency
    return useQuery(
        ['products', arg],
        (_, {shopperProducts}) => {
            return shopperProducts.getProducts({parameters, headers}, rawResponse)
        },
        options
    )
}

type UseProductParameters = NonNullable<Argument<Client['getProduct']>>['parameters']
type UseProductHeaders = NonNullable<Argument<Client['getProduct']>>['headers']
type UseProductArg = {headers?: UseProductHeaders; rawResponse?: boolean} & UseProductParameters
/**
 * A hook for `ShopperProducts#getProduct`.
 * Allows access to product details for a single product ID. Only products that are online and assigned to a site catalog are returned. Along with product details, the availability, images, price, bundled_products, set_products, recommedations, product options, variations, and promotions for the products will be included, as appropriate.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProduct} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getproduct} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useProduct(
    arg: Omit<UseProductArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getProduct']> | Response, Error>
): UseQueryResult<DataType<Client['getProduct']>, Error>
function useProduct(
    arg: Omit<UseProductArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getProduct']> | Response, Error>
): UseQueryResult<Response, Error>
function useProduct(
    arg: UseProductArg,
    options?: UseQueryOptions<DataType<Client['getProduct']> | Response, Error>
): UseQueryResult<DataType<Client['getProduct']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    const {locale, currency} = useConfig()
    parameters.locale = parameters.locale || locale
    parameters.currency = parameters.currency || currency
    return useQuery(
        ['product', arg],
        (_, {shopperProducts}) => {
            return shopperProducts.getProduct({parameters, headers}, rawResponse)
        },
        options
    )
}

type UseCategoriesParameters = NonNullable<Argument<Client['getCategories']>>['parameters']
type UseCategoriesHeaders = NonNullable<Argument<Client['getCategories']>>['headers']
type UseCategoriesArg = {
    headers?: UseCategoriesHeaders
    rawResponse?: boolean
} & UseCategoriesParameters
/**
 * A hook for `ShopperProducts#getCategories`.
 * When you use the URL template, the server returns multiple categories (a result object of category documents). You can use this template as a convenient way of obtaining multiple categories in a single request, instead of issuing separate requests for each category. You can specify up to 50 multiple IDs. You must enclose the list of IDs in parentheses. If a category identifier contains parenthesis or the separator sign, you must URL encode the character. The server only returns online categories.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getCategories} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getcategories} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useCategories(
    arg: Omit<UseCategoriesArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getCategories']> | Response, Error>
): UseQueryResult<DataType<Client['getCategories']>, Error>
function useCategories(
    arg: Omit<UseCategoriesArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getCategories']> | Response, Error>
): UseQueryResult<Response, Error>
function useCategories(
    arg: UseCategoriesArg,
    options?: UseQueryOptions<DataType<Client['getCategories']> | Response, Error>
): UseQueryResult<DataType<Client['getCategories']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    const {locale} = useConfig()
    parameters.locale = parameters.locale || locale
    return useQuery(
        ['categories', arg],
        (_, {shopperProducts}) => {
            return shopperProducts.getCategories({parameters, headers}, rawResponse)
        },
        options
    )
}

type UseCategoryParameters = NonNullable<Argument<Client['getCategory']>>['parameters']
type UseCategoryHeaders = NonNullable<Argument<Client['getCategory']>>['headers']
type UseCategoryArg = {
    headers?: UseCategoryHeaders
    rawResponse?: boolean
} & UseCategoryParameters
/**
 * A hook for `ShopperProducts#getCategory`.
 * When you use the URL template below, the server returns a category identified by its ID; by default, the server
 also returns the first level of subcategories, but you can specify another level by setting the levels
 parameter. The server only returns online categories.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getCategory} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getcategory} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useCategory(
    arg: Omit<UseCategoryArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getCategory']> | Response, Error>
): UseQueryResult<DataType<Client['getCategory']>, Error>
function useCategory(
    arg: Omit<UseCategoryArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getCategory']> | Response, Error>
): UseQueryResult<Response, Error>
function useCategory(
    arg: UseCategoryArg,
    options?: UseQueryOptions<DataType<Client['getCategory']> | Response, Error>
): UseQueryResult<DataType<Client['getCategory']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    const {locale} = useConfig()
    parameters.locale = parameters.locale || locale
    return useQuery(
        ['category', arg],
        (_, {shopperProducts}) => {
            return shopperProducts.getCategory({parameters, headers}, rawResponse)
        },
        options
    )
}

export {useProducts, useProduct, useCategories, useCategory}
