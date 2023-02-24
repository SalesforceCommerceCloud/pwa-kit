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

type Client = ApiClients['shopperOrders']

/**
 * A hook for `ShopperOrders#getOrder`.
 * Gets information for an order.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getOrder} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#getorder} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useOrder = (
    apiOptions: Argument<Client['getOrder']>,
    queryOptions: ApiQueryOptions<Client['getOrder']> = {}
): UseQueryResult<DataType<Client['getOrder']>> => {
    type Options = Argument<Client['getOrder']>
    type Data = DataType<Client['getOrder']>
    const {shopperOrders: client} = useCommerceApi()
    const methodName = 'getOrder'
    const requiredParameters = ['organizationId', 'orderNo', 'siteId'] as const

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
 * A hook for `ShopperOrders#getPaymentMethodsForOrder`.
 * Gets the applicable payment methods for an existing order considering the open payment amount only.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getPaymentMethodsForOrder} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#getpaymentmethodsfororder} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePaymentMethodsForOrder = (
    apiOptions: Argument<Client['getPaymentMethodsForOrder']>,
    queryOptions: ApiQueryOptions<Client['getPaymentMethodsForOrder']> = {}
): UseQueryResult<DataType<Client['getPaymentMethodsForOrder']>> => {
    type Options = Argument<Client['getPaymentMethodsForOrder']>
    type Data = DataType<Client['getPaymentMethodsForOrder']>
    const {shopperOrders: client} = useCommerceApi()
    const methodName = 'getPaymentMethodsForOrder'
    const requiredParameters = ['organizationId', 'orderNo', 'siteId'] as const

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
 * A hook for `ShopperOrders#getTaxesFromOrder`.
 * This method gives you the external taxation data of the order transferred from the basket during 
order creation. This endpoint can be called only if external taxation was used. See POST /baskets 
for more information.         
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getTaxesFromOrder} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#gettaxesfromorder} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useTaxesFromOrder = (
    apiOptions: Argument<Client['getTaxesFromOrder']>,
    queryOptions: ApiQueryOptions<Client['getTaxesFromOrder']> = {}
): UseQueryResult<DataType<Client['getTaxesFromOrder']>> => {
    type Options = Argument<Client['getTaxesFromOrder']>
    type Data = DataType<Client['getTaxesFromOrder']>
    const {shopperOrders: client} = useCommerceApi()
    const methodName = 'getTaxesFromOrder'
    const requiredParameters = ['organizationId', 'orderNo', 'siteId'] as const

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
