/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType} from '../types'
import {useQuery} from '../useQuery'
import {UseQueryOptions, UseQueryResult} from '@tanstack/react-query'
import {NotImplementedError} from './../utils'

type Client = ApiClients['shopperBaskets']

type UseBasketParameters = NonNullable<Argument<Client['getBasket']>>['parameters']
type UseBasketHeaders = NonNullable<Argument<Client['getBasket']>>['headers']
type UseBasketArg = {
    headers?: UseBasketHeaders
    rawResponse?: boolean
} & UseBasketParameters
/**
 * A hook for `ShopperBaskets#getBasket`.
 * Gets a basket.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getbasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useBasket(
    arg: Omit<UseBasketArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getBasket']> | Response, Error>
): UseQueryResult<DataType<Client['getBasket']>, Error>
function useBasket(
    arg: Omit<UseBasketArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getBasket']> | Response, Error>
): UseQueryResult<Response, Error>
function useBasket(
    arg: UseBasketArg,
    options?: UseQueryOptions<DataType<Client['getBasket']> | Response, Error>
): UseQueryResult<DataType<Client['getBasket']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    const defaultOptions = {
        enabled: !!parameters.basketId
    }
    return useQuery(
        ['/baskets', parameters.basketId, arg],
        (_, {shopperBaskets}) => shopperBaskets.getBasket({parameters, headers}, rawResponse),
        {...defaultOptions, ...options}
    )
}

type UsePaymentMethodsForBasketParameters = NonNullable<
    Argument<Client['getPaymentMethodsForBasket']>
>['parameters']
type UsePaymentMethodsForBasketHeaders = NonNullable<
    Argument<Client['getPaymentMethodsForBasket']>
>['headers']
type UsePaymentMethodsForBasketArg = {
    headers?: UsePaymentMethodsForBasketHeaders
    rawResponse?: boolean
} & UsePaymentMethodsForBasketParameters
/**
 * A hook for `ShopperBaskets#getPaymentMethodsForBasket`.
 * Gets applicable payment methods for an existing basket considering the open payment amount only.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getPaymentMethodsForBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getpaymentmethodsforbasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function usePaymentMethodsForBasket(
    arg: Omit<UsePaymentMethodsForBasketArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getPaymentMethodsForBasket']> | Response, Error>
): UseQueryResult<DataType<Client['getPaymentMethodsForBasket']>, Error>
function usePaymentMethodsForBasket(
    arg: Omit<UsePaymentMethodsForBasketArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getPaymentMethodsForBasket']> | Response, Error>
): UseQueryResult<Response, Error>
function usePaymentMethodsForBasket(
    arg: UsePaymentMethodsForBasketArg,
    options?: UseQueryOptions<DataType<Client['getPaymentMethodsForBasket']> | Response, Error>
): UseQueryResult<DataType<Client['getPaymentMethodsForBasket']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    const defaultOptions = {
        enabled: !!parameters.basketId
    }

    return useQuery(
        ['/baskets', parameters.basketId, '/payment-methods', arg],
        (_, {shopperBaskets}) =>
            shopperBaskets.getPaymentMethodsForBasket({parameters, headers}, rawResponse),
        {...defaultOptions, ...options}
    )
}

/**
 * WARNING: This method is not implemented yet.
 *
 * A hook for `ShopperBaskets#getPriceBooksForBasket`.
 * Gets applicable price books for an existing basket.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getPriceBooksForBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getpricebooksforbasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function usePriceBooksForBasket(): void {
    NotImplementedError()
}

type UseShippingMethodsForShipmentParameters = NonNullable<
    Argument<Client['getShippingMethodsForShipment']>
>['parameters']
type UseShippingMethodsForShipmentHeaders = NonNullable<
    Argument<Client['getShippingMethodsForShipment']>
>['headers']
type UseShippingMethodsForShipmentArg = {
    headers?: UseShippingMethodsForShipmentHeaders
    rawResponse?: boolean
} & UseShippingMethodsForShipmentParameters
/**
 * A hook for `ShopperBaskets#getShippingMethodsForShipment`.
 * Gets the applicable shipping methods for a certain shipment of a basket.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getShippingMethodsForShipment} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getshippingmethodsforshipment} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useShippingMethodsForShipment(
    arg: Omit<UseShippingMethodsForShipmentArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getShippingMethodsForShipment']> | Response, Error>
): UseQueryResult<DataType<Client['getShippingMethodsForShipment']>, Error>
function useShippingMethodsForShipment(
    arg: Omit<UseShippingMethodsForShipmentArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getShippingMethodsForShipment']> | Response, Error>
): UseQueryResult<Response, Error>
function useShippingMethodsForShipment(
    arg: UseShippingMethodsForShipmentArg,
    options?: UseQueryOptions<DataType<Client['getShippingMethodsForShipment']> | Response, Error>
): UseQueryResult<DataType<Client['getShippingMethodsForShipment']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    const defaultOptions = {
        enabled: !!parameters.basketId && !!parameters.shipmentId
    }
    return useQuery(
        [
            '/baskets',
            parameters.basketId,
            '/shipments',
            parameters.shipmentId,
            '/shipping-methods',
            arg
        ],
        (_, {shopperBaskets}) =>
            shopperBaskets.getShippingMethodsForShipment({parameters, headers}, rawResponse),
        {...defaultOptions, ...options}
    )
}

/**
 * WARNING: This method is not implemented yet.
 *
 * A hook for `ShopperBaskets#getTaxesFromBasket`.
 * This method gives you the external taxation data set by the PUT taxes API. This endpoint can be called only if external taxation mode was used for basket creation. See POST /baskets for more information.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getTaxesFromBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#gettaxesfrombasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useTaxesFromBasket(): void {
    NotImplementedError()
}

export {
    useBasket,
    usePaymentMethodsForBasket,
    usePriceBooksForBasket,
    useShippingMethodsForShipment,
    useTaxesFromBasket
}
