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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getOrder']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getOrder']>> => {
    const {shopperOrders: client} = useCommerceApi()
    const method = (arg: Argument<Client['getOrder']>) => client.getOrder(arg)
    const requiredParameters = ['organizationId', 'orderNo', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({parameters}: MergedOptions<Client, Argument<Client['getOrder']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/orders/',
            parameters.orderNo,
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
 * A hook for `ShopperOrders#getPaymentMethodsForOrder`.
 * Gets the applicable payment methods for an existing order considering the open payment amount only.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getPaymentMethodsForOrder} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#getpaymentmethodsfororder} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePaymentMethodsForOrder = (
    apiOptions: Argument<Client['getPaymentMethodsForOrder']>,
    queryOptions: Omit<
        UseQueryOptions<DataType<Client['getPaymentMethodsForOrder']>>,
        'queryFn'
    > = {}
): UseQueryResult<DataType<Client['getPaymentMethodsForOrder']>> => {
    const {shopperOrders: client} = useCommerceApi()
    const method = (arg: Argument<Client['getPaymentMethodsForOrder']>) =>
        client.getPaymentMethodsForOrder(arg)
    const requiredParameters = ['organizationId', 'orderNo', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getPaymentMethodsForOrder']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/orders/',
            parameters.orderNo,
            '/payment-methods',
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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getTaxesFromOrder']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getTaxesFromOrder']>> => {
    const {shopperOrders: client} = useCommerceApi()
    const method = (arg: Argument<Client['getTaxesFromOrder']>) => client.getTaxesFromOrder(arg)
    const requiredParameters = ['organizationId', 'orderNo', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getTaxesFromOrder']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/orders/',
            parameters.orderNo,
            '/taxes',
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
