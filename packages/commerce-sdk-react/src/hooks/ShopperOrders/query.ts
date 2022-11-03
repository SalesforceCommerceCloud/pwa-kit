/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType} from '../types'
import {useQuery} from '../useQuery'
import useCommerceApi from '../useCommerceApi'
import {UseQueryOptions, UseQueryResult} from '@tanstack/react-query'

type Client = ApiClients['shopperOrders']

type UseOrderParameters = NonNullable<Argument<Client['getOrder']>>['parameters']
type UseOrderHeaders = NonNullable<Argument<Client['getOrder']>>['headers']
type UseOrderArg = {
    headers?: UseOrderHeaders
    rawResponse?: boolean
} & UseOrderParameters

/**
 * A hook for `ShopperOrders#getOrder`.
 * Gets information for an order.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getOrder} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#getorder} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useOrder(
    arg: Omit<UseOrderArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getOrder']> | Response, Error>
): UseQueryResult<DataType<Client['getOrder']>, Error>
function useOrder(
    arg: Omit<UseOrderArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getOrder']> | Response, Error>
): UseQueryResult<Response, Error>
function useOrder(
    arg: UseOrderArg,
    options?: UseQueryOptions<DataType<Client['getOrder']> | Response, Error>
): UseQueryResult<DataType<Client['getOrder']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    return useQuery(
        ['order', arg],
        (_, {shopperOrders}) => {
            return shopperOrders.getOrder({parameters, headers}, rawResponse)
        },
        options
    )
}

type UsePaymentMethodsParameters = NonNullable<
    Argument<Client['getPaymentMethodsForOrder']>
>['parameters']
type UsePaymentMethodsHeaders = NonNullable<
    Argument<Client['getPaymentMethodsForOrder']>
>['headers']
type UsePaymentMethodsArg = {
    headers?: UsePaymentMethodsHeaders
    rawResponse?: boolean
} & UsePaymentMethodsParameters

/**
 * A hook for `ShopperOrders#getPaymentMethodsForOrder`.
 * Gets the applicable payment methods for an existing order considering the open payment amount only.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getPaymentMethodsForOrder} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#getpaymentmethodsfororder} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function usePaymentMethodsForOrder(
    arg: Omit<UsePaymentMethodsArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getPaymentMethodsForOrder']> | Response, Error>
): UseQueryResult<DataType<Client['getPaymentMethodsForOrder']>, Error>
function usePaymentMethodsForOrder(
    arg: Omit<UsePaymentMethodsArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getPaymentMethodsForOrder']> | Response, Error>
): UseQueryResult<Response, Error>
function usePaymentMethodsForOrder(
    arg: UsePaymentMethodsArg,
    options?: UseQueryOptions<DataType<Client['getPaymentMethodsForOrder']> | Response, Error>
): UseQueryResult<DataType<Client['getPaymentMethodsForOrder']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    return useQuery(
        ['paymentMethods', arg],
        (_, {shopperOrders}) => {
            return shopperOrders.getPaymentMethodsForOrder({parameters, headers}, rawResponse)
        },
        options
    )
}

type UseTaxesParameters = NonNullable<Argument<Client['getTaxesFromOrder']>>['parameters']
type UseTaxesHeaders = NonNullable<Argument<Client['getTaxesFromOrder']>>['headers']
type UseTaxesArg = {
    headers?: UseTaxesHeaders
    rawResponse?: boolean
} & UseTaxesParameters

/**
 * A hook for `ShopperOrders#getTaxesFromOrder`.
 * This method gives you the external taxation data of the order transferred from the basket during
order creation. This endpoint can be called only if external taxation was used. See POST /baskets
for more information.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getTaxesFromOrder} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#gettaxesfromorder} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useTaxesFromOrder(
    arg: Omit<UseTaxesArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getTaxesFromOrder']> | Response, Error>
): UseQueryResult<DataType<Client['getTaxesFromOrder']>, Error>
function useTaxesFromOrder(
    arg: Omit<UseTaxesArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getTaxesFromOrder']> | Response, Error>
): UseQueryResult<Response, Error>
function useTaxesFromOrder(
    arg: UseTaxesArg,
    options?: UseQueryOptions<DataType<Client['getTaxesFromOrder']> | Response, Error>
): UseQueryResult<DataType<Client['getTaxesFromOrder']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    return useQuery(
        ['taxes', arg],
        (_, {shopperOrders}) => {
            return shopperOrders.getTaxesFromOrder({parameters, headers}, rawResponse)
        },
        options
    )
}

export {useOrder, usePaymentMethodsForOrder, useTaxesFromOrder}
