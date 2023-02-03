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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getBasket']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getBasket']>> => {
    const {shopperBaskets: client} = useCommerceApi()
    const method = (arg: Argument<Client['getBasket']>) => client.getBasket(arg)
    const requiredParameters = ['organizationId', 'basketId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = <T extends Record<string, unknown>>(parameters: T) =>
        [
            'https://',
            parameters.shortCode,
            '.api.commercecloud.salesforce.com/checkout/shopper-baskets/',
            parameters.version,
            '/organizations/',
            parameters.organizationId,
            '/baskets/',
            parameters.basketId,
            '?',
            'siteId',
            parameters.siteId,
            'locale',
            parameters.locale,
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
 * A hook for `ShopperBaskets#getPaymentMethodsForBasket`.
 * Gets applicable payment methods for an existing basket considering the open payment amount only.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getPaymentMethodsForBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getpaymentmethodsforbasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePaymentMethodsForBasket = (
    apiOptions: Argument<Client['getPaymentMethodsForBasket']>,
    queryOptions: Omit<
        UseQueryOptions<DataType<Client['getPaymentMethodsForBasket']>>,
        'queryFn'
    > = {}
): UseQueryResult<DataType<Client['getPaymentMethodsForBasket']>> => {
    const {shopperBaskets: client} = useCommerceApi()
    const method = (arg: Argument<Client['getPaymentMethodsForBasket']>) =>
        client.getPaymentMethodsForBasket(arg)
    const requiredParameters = ['organizationId', 'basketId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = <T extends Record<string, unknown>>(parameters: T) =>
        [
            'https://',
            parameters.shortCode,
            '.api.commercecloud.salesforce.com/checkout/shopper-baskets/',
            parameters.version,
            '/organizations/',
            parameters.organizationId,
            '/baskets/',
            parameters.basketId,
            '/payment-methods',
            '?',
            'siteId',
            parameters.siteId,
            'locale',
            parameters.locale,
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
 * A hook for `ShopperBaskets#getPriceBooksForBasket`.
 * Gets applicable price books for an existing basket.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getPriceBooksForBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getpricebooksforbasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePriceBooksForBasket = (
    apiOptions: Argument<Client['getPriceBooksForBasket']>,
    queryOptions: Omit<UseQueryOptions<DataType<Client['getPriceBooksForBasket']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getPriceBooksForBasket']>> => {
    const {shopperBaskets: client} = useCommerceApi()
    const method = (arg: Argument<Client['getPriceBooksForBasket']>) =>
        client.getPriceBooksForBasket(arg)
    const requiredParameters = ['organizationId', 'basketId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = <T extends Record<string, unknown>>(parameters: T) =>
        [
            'https://',
            parameters.shortCode,
            '.api.commercecloud.salesforce.com/checkout/shopper-baskets/',
            parameters.version,
            '/organizations/',
            parameters.organizationId,
            '/baskets/',
            parameters.basketId,
            '/price-books',
            '?',
            'siteId',
            parameters.siteId,
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
 * A hook for `ShopperBaskets#getShippingMethodsForShipment`.
 * Gets the applicable shipping methods for a certain shipment of a basket.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getShippingMethodsForShipment} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getshippingmethodsforshipment} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useShippingMethodsForShipment = (
    apiOptions: Argument<Client['getShippingMethodsForShipment']>,
    queryOptions: Omit<
        UseQueryOptions<DataType<Client['getShippingMethodsForShipment']>>,
        'queryFn'
    > = {}
): UseQueryResult<DataType<Client['getShippingMethodsForShipment']>> => {
    const {shopperBaskets: client} = useCommerceApi()
    const method = (arg: Argument<Client['getShippingMethodsForShipment']>) =>
        client.getShippingMethodsForShipment(arg)
    const requiredParameters = ['organizationId', 'basketId', 'shipmentId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = <T extends Record<string, unknown>>(parameters: T) =>
        [
            'https://',
            parameters.shortCode,
            '.api.commercecloud.salesforce.com/checkout/shopper-baskets/',
            parameters.version,
            '/organizations/',
            parameters.organizationId,
            '/baskets/',
            parameters.basketId,
            '/shipments/',
            parameters.shipmentId,
            '/shipping-methods',
            '?',
            'siteId',
            parameters.siteId,
            'locale',
            parameters.locale,
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
 * A hook for `ShopperBaskets#getTaxesFromBasket`.
 * This method gives you the external taxation data set by the PUT taxes API. This endpoint can be called only if external taxation mode was used for basket creation. See POST /baskets for more information.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getTaxesFromBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#gettaxesfrombasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useTaxesFromBasket = (
    apiOptions: Argument<Client['getTaxesFromBasket']>,
    queryOptions: Omit<UseQueryOptions<DataType<Client['getTaxesFromBasket']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getTaxesFromBasket']>> => {
    const {shopperBaskets: client} = useCommerceApi()
    const method = (arg: Argument<Client['getTaxesFromBasket']>) => client.getTaxesFromBasket(arg)
    const requiredParameters = ['organizationId', 'basketId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = <T extends Record<string, unknown>>(parameters: T) =>
        [
            'https://',
            parameters.shortCode,
            '.api.commercecloud.salesforce.com/checkout/shopper-baskets/',
            parameters.version,
            '/organizations/',
            parameters.organizationId,
            '/baskets/',
            parameters.basketId,
            '/taxes',
            '?',
            'siteId',
            parameters.siteId,
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
