/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryOptions, UseQueryResult} from '@tanstack/react-query'
import {ApiClients, Argument, DataType} from '../types'
import useCommerceApi from '../useCommerceApi'
import {useQuery} from '../useQuery'

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
    queryOptions: UseQueryOptions<DataType<Client['getBasket']>>
): UseQueryResult<DataType<Client['getBasket']>> => {
    const requiredParameters = ['organizationId', 'basketId', 'siteId'] as const
    const queryKey = ['TODO']
    const {shopperBaskets: client} = useCommerceApi()
    const method = client.getBasket.bind(client)

    return useQuery(
        apiOptions,
        {
            queryKey,
            ...queryOptions
        },
        {
            client,
            method,
            requiredParameters
        }
    )
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
    queryOptions: UseQueryOptions<DataType<Client['getPaymentMethodsForBasket']>>
): UseQueryResult<DataType<Client['getPaymentMethodsForBasket']>> => {
    const requiredParameters = ['organizationId', 'basketId', 'siteId'] as const
    const queryKey = ['TODO']
    const {shopperBaskets: client} = useCommerceApi()
    const method = client.getPaymentMethodsForBasket.bind(client)

    return useQuery(
        apiOptions,
        {
            queryKey,
            ...queryOptions
        },
        {
            client,
            method,
            requiredParameters
        }
    )
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
    queryOptions: UseQueryOptions<DataType<Client['getPriceBooksForBasket']>>
): UseQueryResult<DataType<Client['getPriceBooksForBasket']>> => {
    const requiredParameters = ['organizationId', 'basketId', 'siteId'] as const
    const queryKey = ['TODO']
    const {shopperBaskets: client} = useCommerceApi()
    const method = client.getPriceBooksForBasket.bind(client)

    return useQuery(
        apiOptions,
        {
            queryKey,
            ...queryOptions
        },
        {
            client,
            method,
            requiredParameters
        }
    )
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
    queryOptions: UseQueryOptions<DataType<Client['getShippingMethodsForShipment']>>
): UseQueryResult<DataType<Client['getShippingMethodsForShipment']>> => {
    const requiredParameters = ['organizationId', 'basketId', 'shipmentId', 'siteId'] as const
    const queryKey = ['TODO']
    const {shopperBaskets: client} = useCommerceApi()
    const method = client.getShippingMethodsForShipment.bind(client)

    return useQuery(
        apiOptions,
        {
            queryKey,
            ...queryOptions
        },
        {
            client,
            method,
            requiredParameters
        }
    )
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
    queryOptions: UseQueryOptions<DataType<Client['getTaxesFromBasket']>>
): UseQueryResult<DataType<Client['getTaxesFromBasket']>> => {
    const requiredParameters = ['organizationId', 'basketId', 'siteId'] as const
    const queryKey = ['TODO']
    const {shopperBaskets: client} = useCommerceApi()
    const method = client.getTaxesFromBasket.bind(client)

    return useQuery(
        apiOptions,
        {
            queryKey,
            ...queryOptions
        },
        {
            client,
            method,
            requiredParameters
        }
    )
}
