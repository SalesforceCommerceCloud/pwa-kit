/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType, QueryResponse} from '../types'
import {useAsync} from '../useAsync'
import useCommerceApi from '../useCommerceApi'
import {getDependencySource} from '../../utils/util'

type Client = ApiClients['shopperProducts']
/**
 * A hook for `ShopperProducts#getProducts`.
 * Allows access to multiple products by a single request. Only products that are online and assigned to a site catalog are returned. The maximum number of productIDs that can be requested are 24. Along with product details, the availability, images, price, promotions, and variations for the valid products will be included, as appropriate.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProducts} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getproducts} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useProducts(
    parameters: NonNullable<Argument<Client['getProducts']>>['parameters'],
    deps?: unknown[],
    headers?: NonNullable<Argument<Client['getProducts']>>['headers'],
    rawResponse?: false
): QueryResponse<DataType<Client['getProducts']>>
function useProducts(
    parameters: NonNullable<Argument<Client['getProducts']>>['parameters'],
    deps?: unknown[],
    headers?: NonNullable<Argument<Client['getProducts']>>['headers'],
    rawResponse?: true
): QueryResponse<Response>
function useProducts(
    parameters: NonNullable<Argument<Client['getProducts']>>['parameters'],
    deps: unknown[] = [],
    headers?: NonNullable<Argument<Client['getProducts']>>['headers'],
    rawResponse?: boolean
): QueryResponse<DataType<Client['getProducts']> | Response> {
    const source = getDependencySource(parameters, deps, ['ids'])
    const {shopperProducts: client} = useCommerceApi()
    return useAsync(() => client.getProducts({parameters, headers}, rawResponse), source)
}
/**
 * A hook for `ShopperProducts#getProduct`.
 * Allows access to product details for a single product ID. Only products that are online and assigned to a site catalog are returned. Along with product details, the availability, images, price, bundled_products, set_products, recommedations, product options, variations, and promotions for the products will be included, as appropriate.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProduct} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getproduct} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useProduct(
    parameters: NonNullable<Argument<Client['getProduct']>>['parameters'],
    deps?: unknown[],
    headers?: NonNullable<Argument<Client['getProduct']>>['headers'],
    rawResponse?: false
): QueryResponse<DataType<Client['getProduct']>>
function useProduct(
    parameters: NonNullable<Argument<Client['getProduct']>>['parameters'],
    deps?: unknown[],
    headers?: NonNullable<Argument<Client['getProduct']>>['headers'],
    rawResponse?: true
): QueryResponse<Response>
function useProduct(
    parameters: NonNullable<Argument<Client['getProduct']>>['parameters'],
    deps: unknown[] = [],
    headers?: NonNullable<Argument<Client['getProduct']>>['headers'],
    rawResponse?: boolean
): QueryResponse<DataType<Client['getProduct']> | Response> {
    const source = getDependencySource(parameters, deps, ['id'])
    const {shopperProducts: client} = useCommerceApi()
    return useAsync(() => client.getProduct({parameters, headers}, rawResponse), source)
}
/**
 * A hook for `ShopperProducts#getCategories`.
 * When you use the URL template, the server returns multiple categories (a result object of category documents). You can use this template as a convenient way of obtaining multiple categories in a single request, instead of issuing separate requests for each category. You can specify up to 50 multiple IDs. You must enclose the list of IDs in parentheses. If a category identifier contains parenthesis or the separator sign, you must URL encode the character. The server only returns online categories.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getCategories} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getcategories} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useCategories(
    parameters: NonNullable<Argument<Client['getCategories']>>['parameters'],
    deps?: unknown[],
    headers?: NonNullable<Argument<Client['getProduct']>>['headers'],
    rawResponse?: false
): QueryResponse<DataType<Client['getCategories']>>
function useCategories(
    parameters: NonNullable<Argument<Client['getCategories']>>['parameters'],
    deps?: unknown[],
    headers?: NonNullable<Argument<Client['getProduct']>>['headers'],
    rawResponse?: true
): QueryResponse<Response>
function useCategories(
    parameters: NonNullable<Argument<Client['getCategories']>>['parameters'],
    deps: unknown[] = [],
    headers?: NonNullable<Argument<Client['getProduct']>>['headers'],
    rawResponse?: boolean
): QueryResponse<DataType<Client['getCategories']> | Response> {
    const source = getDependencySource(parameters, deps, ['ids'], ['levels'])
    const {shopperProducts: client} = useCommerceApi()
    return useAsync(() => client.getCategories({parameters, headers}, rawResponse), source)
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
function useCategory(
    parameters: NonNullable<Argument<Client['getCategory']>>['parameters'],
    deps?: unknown[],
    headers?: NonNullable<Argument<Client['getCategory']>>['headers'],
    rawResponse?: false
): QueryResponse<DataType<Client['getCategory']>>
function useCategory(
    parameters: NonNullable<Argument<Client['getCategory']>>['parameters'],
    deps?: unknown[],
    headers?: NonNullable<Argument<Client['getCategory']>>['headers'],
    rawResponse?: true
): QueryResponse<Response>
function useCategory(
    parameters: NonNullable<Argument<Client['getCategory']>>['parameters'],
    deps: unknown[] = [],
    headers?: NonNullable<Argument<Client['getCategory']>>['headers'],
    rawResponse?: boolean
): QueryResponse<DataType<Client['getCategory']> | Response> {
    const source = getDependencySource(parameters, deps, ['id'], ['levels'])
    const {shopperProducts: client} = useCommerceApi()
    return useAsync(() => client.getCategory({parameters, headers}, rawResponse), source)
}

export {useProducts, useProduct, useCategories, useCategory}
