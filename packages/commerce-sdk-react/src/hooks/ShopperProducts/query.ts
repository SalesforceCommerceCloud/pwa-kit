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

type Client = ApiClients['shopperProducts']

/**
 * A hook for `ShopperProducts#getProducts`.
 * Allows access to multiple products by a single request. Only products that are online and assigned to a site catalog are returned. The maximum number of productIDs that can be requested are 24. Along with product details, the availability, product options, images, price, promotions, and variations for the valid products will be included, as appropriate.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProducts} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getproducts} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useProducts = (
    apiOptions: Argument<Client['getProducts']>,
    queryOptions: Omit<UseQueryOptions<DataType<Client['getProducts']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getProducts']>> => {
    const {shopperProducts: client} = useCommerceApi()
    const method = (arg: Argument<Client['getProducts']>) => client.getProducts(arg)
    const requiredParameters = ['organizationId', 'ids', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({parameters}: MergedOptions<Client, Argument<Client['getProducts']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/products',
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
 * A hook for `ShopperProducts#getProduct`.
 * Allows access to product details for a single product ID. Only products that are online and assigned to a site catalog are returned. Along with product details, the availability, images, price, bundled_products, set_products, recommedations, product options, variations, and promotions for the products will be included, as appropriate.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProduct} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getproduct} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useProduct = (
    apiOptions: Argument<Client['getProduct']>,
    queryOptions: Omit<UseQueryOptions<DataType<Client['getProduct']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getProduct']>> => {
    const {shopperProducts: client} = useCommerceApi()
    const method = (arg: Argument<Client['getProduct']>) => client.getProduct(arg)
    const requiredParameters = ['organizationId', 'id', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({parameters}: MergedOptions<Client, Argument<Client['getProduct']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/products/',
            parameters.id,
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
 * A hook for `ShopperProducts#getCategories`.
 * When you use the URL template, the server returns multiple categories (a result object of category documents). You can use this template as a convenient way of obtaining multiple categories in a single request, instead of issuing separate requests for each category. You can specify up to 50 multiple IDs. You must enclose the list of IDs in parentheses. If a category identifier contains parenthesis or the separator sign, you must URL encode the character. The server only returns online categories.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getCategories} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getcategories} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCategories = (
    apiOptions: Argument<Client['getCategories']>,
    queryOptions: Omit<UseQueryOptions<DataType<Client['getCategories']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getCategories']>> => {
    const {shopperProducts: client} = useCommerceApi()
    const method = (arg: Argument<Client['getCategories']>) => client.getCategories(arg)
    const requiredParameters = ['organizationId', 'ids', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({parameters}: MergedOptions<Client, Argument<Client['getCategories']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/categories',
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
 * A hook for `ShopperProducts#getCategory`.
 * When you use the URL template below, the server returns a category identified by its ID; by default, the server
also returns the first level of subcategories, but you can specify another level by setting the levels
parameter. The server only returns online categories.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getCategory} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperproducts.shopperproducts-1.html#getcategory} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCategory = (
    apiOptions: Argument<Client['getCategory']>,
    queryOptions: Omit<UseQueryOptions<DataType<Client['getCategory']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getCategory']>> => {
    const {shopperProducts: client} = useCommerceApi()
    const method = (arg: Argument<Client['getCategory']>) => client.getCategory(arg)
    const requiredParameters = ['organizationId', 'id', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({parameters}: MergedOptions<Client, Argument<Client['getCategory']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/categories/',
            parameters.id,
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
