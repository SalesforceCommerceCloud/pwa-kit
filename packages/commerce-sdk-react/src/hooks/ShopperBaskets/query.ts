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
import {mergeOptions} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'

type Client = ApiClients['shopperBaskets']

/**
 * A hook for `ShopperBaskets#getBasket`.
 * Gets a basket.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getbasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useBasket = (
    apiOptions: Argument<Client['getBasket']>,
    queryOptions: ApiQueryOptions<Client['getBasket']> = {}
): UseQueryResult<DataType<Client['getBasket']>> => {
    type Options = Argument<Client['getBasket']>
    type Data = DataType<Client['getBasket']>
    const {shopperBaskets: client} = useCommerceApi()
    const methodName = 'getBasket'
    const requiredParameters = ['organizationId', 'basketId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * A hook for `ShopperBaskets#getPaymentMethodsForBasket`.
 * Gets applicable payment methods for an existing basket considering the open payment amount only.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getPaymentMethodsForBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getpaymentmethodsforbasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePaymentMethodsForBasket = (
    apiOptions: Argument<Client['getPaymentMethodsForBasket']>,
    queryOptions: ApiQueryOptions<Client['getPaymentMethodsForBasket']> = {}
): UseQueryResult<DataType<Client['getPaymentMethodsForBasket']>> => {
    type Options = Argument<Client['getPaymentMethodsForBasket']>
    type Data = DataType<Client['getPaymentMethodsForBasket']>
    const {shopperBaskets: client} = useCommerceApi()
    const methodName = 'getPaymentMethodsForBasket'
    const requiredParameters = ['organizationId', 'basketId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * A hook for `ShopperBaskets#getPriceBooksForBasket`.
 * Gets applicable price books for an existing basket.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getPriceBooksForBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getpricebooksforbasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePriceBooksForBasket = (
    apiOptions: Argument<Client['getPriceBooksForBasket']>,
    queryOptions: ApiQueryOptions<Client['getPriceBooksForBasket']> = {}
): UseQueryResult<DataType<Client['getPriceBooksForBasket']>> => {
    type Options = Argument<Client['getPriceBooksForBasket']>
    type Data = DataType<Client['getPriceBooksForBasket']>
    const {shopperBaskets: client} = useCommerceApi()
    const methodName = 'getPriceBooksForBasket'
    const requiredParameters = ['organizationId', 'basketId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * A hook for `ShopperBaskets#getShippingMethodsForShipment`.
 * Gets the applicable shipping methods for a certain shipment of a basket.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getShippingMethodsForShipment} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getshippingmethodsforshipment} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useShippingMethodsForShipment = (
    apiOptions: Argument<Client['getShippingMethodsForShipment']>,
    queryOptions: ApiQueryOptions<Client['getShippingMethodsForShipment']> = {}
): UseQueryResult<DataType<Client['getShippingMethodsForShipment']>> => {
    type Options = Argument<Client['getShippingMethodsForShipment']>
    type Data = DataType<Client['getShippingMethodsForShipment']>
    const {shopperBaskets: client} = useCommerceApi()
    const methodName = 'getShippingMethodsForShipment'
    const requiredParameters = ['organizationId', 'basketId', 'shipmentId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * A hook for `ShopperBaskets#getTaxesFromBasket`.
 * This method gives you the external taxation data set by the PUT taxes API. This endpoint can be called only if external taxation mode was used for basket creation. See POST /baskets for more information.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getTaxesFromBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#gettaxesfrombasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useTaxesFromBasket = (
    apiOptions: Argument<Client['getTaxesFromBasket']>,
    queryOptions: ApiQueryOptions<Client['getTaxesFromBasket']> = {}
): UseQueryResult<DataType<Client['getTaxesFromBasket']>> => {
    type Options = Argument<Client['getTaxesFromBasket']>
    type Data = DataType<Client['getTaxesFromBasket']>
    const {shopperBaskets: client} = useCommerceApi()
    const methodName = 'getTaxesFromBasket'
    const requiredParameters = ['organizationId', 'basketId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
