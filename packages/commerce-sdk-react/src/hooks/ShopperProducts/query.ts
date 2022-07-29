/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType, QueryResponse} from '../types'
import {useAsync} from '../useAsync'
import useCommerceApi from '../useCommerceApi'
import {ShopperProductsTypes} from 'commerce-sdk-isomorphic'

type Client = ApiClients['shopperProducts']
/**
 * A hook for `ShopperProducts#getProducts`.
 * Allows access to multiple products by a single request. Only products that are online and assigned to a site catalog are returned. The maximum number of productIDs that can be requested are 24. Along with product details, the availability, images, price, promotions, and variations for the valid products will be included, as appropriate.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProducts} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getproducts} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useProducts = (
    parameters: NonNullable<Argument<Client['getProducts']>>['parameters'],
    deps: unknown[] = [],
    opts?: {headers: NonNullable<Argument<Client['getProducts']>>['headers']; rawResponse: boolean}
): QueryResponse<DataType<Client['getProducts']> | Response> => {
    if (!parameters) {
        throw new Error('Missing ids in parameters to make request')
    }

    const {shopperProducts: client} = useCommerceApi()
    const {ids} = parameters
    // by default the source is the ids string
    let source: unknown[] = [ids]
    if (deps.length) {
        source = deps
    }
    return useAsync(
        () => client.getProducts({parameters, headers: opts?.headers}, opts?.rawResponse),
        source
    )
}
/**
 * A hook for `ShopperProducts#getProduct`.
 * Allows access to product details for a single product ID. Only products that are online and assigned to a site catalog are returned. Along with product details, the availability, images, price, bundled_products, set_products, recommedations, product options, variations, and promotions for the products will be included, as appropriate.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProduct} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getproduct} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useProduct = (
    parameters: NonNullable<Argument<Client['getProduct']>>['parameters'],
    deps: unknown[] = [],
    opts?: {headers: NonNullable<Argument<Client['getProduct']>>['headers']; rawResponse: boolean}
): QueryResponse<DataType<Client['getProduct']> | Response> => {
    if (!parameters) {
        throw new Error('useProducts requires product id ')
    }
    // by default the source is the ids string
    let source: unknown[] = [parameters.id]
    if (deps.length) {
        source = deps
    }
    const {shopperProducts: client} = useCommerceApi()
    return useAsync(
        () => client.getProduct({parameters, headers: opts?.headers}, opts?.rawResponse),
        source
    )
}
/**
 * A hook for `ShopperProducts#getCategories`.
 * When you use the URL template, the server returns multiple categories (a result object of category documents). You can use this template as a convenient way of obtaining multiple categories in a single request, instead of issuing separate requests for each category. You can specify up to 50 multiple IDs. You must enclose the list of IDs in parentheses. If a category identifier contains parenthesis or the separator sign, you must URL encode the character. The server only returns online categories.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getCategories} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getcategories} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCategories = (
    parameters: NonNullable<Argument<Client['getCategories']>>['parameters'],
    deps: unknown[] = [],
    opts?: {headers: NonNullable<Argument<Client['getProduct']>>['headers']; rawResponse: boolean}
): QueryResponse<DataType<Client['getCategories']> | Response> => {
    if (!parameters) {
        throw new Error('useCategories requires categories ids string ')
    }
    const {ids, levels = 1} = parameters
    let source: unknown[] = [ids, levels]
    if (deps.length) {
        source = deps
    }
    const {shopperProducts: client} = useCommerceApi()
    return useAsync(
        () => client.getCategories({parameters, headers: opts?.headers}, opts?.rawResponse),
        source
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
export const useCategory = (
    parameters: NonNullable<Argument<Client['getCategory']>>['parameters'],
    deps: unknown[] = [],
    opts?: {headers: NonNullable<Argument<Client['getCategory']>>['headers']; rawResponse: boolean}
): QueryResponse<DataType<Client['getCategory']> | Response> => {
    if (!parameters) {
        throw new Error('useCategory requires categories ids string in parameters ')
    }
    const {id, levels = 1} = parameters
    let source: unknown[] = [id, levels]
    if (deps.length) {
        source = deps
    }
    const {shopperProducts: client} = useCommerceApi()
    return useAsync(
        () => client.getCategory({parameters, headers: opts?.headers}, opts?.rawResponse),
        source
    )
}
