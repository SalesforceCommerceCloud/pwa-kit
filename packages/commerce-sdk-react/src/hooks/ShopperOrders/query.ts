/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType} from '../types'
import {useQuery} from '../useQuery'
import {UseQueryOptions, UseQueryResult} from '@tanstack/react-query'
import {NotImplementedError} from '../utils'

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
        ['/orders', arg],
        (_, {shopperOrders}) => {
            return shopperOrders.getOrder({parameters, headers}, rawResponse)
        },
        options
    )
}

/**
 * WARNING: This method is not implemented yet.
 *
 * A hook for `ShopperOrders#getPaymentMethodsForOrder`.
 * Gets the applicable payment methods for an existing order considering the open payment amount only.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getPaymentMethodsForOrder} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#getpaymentmethodsfororder} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function usePaymentMethodsForOrder(): void {
    NotImplementedError()
}

/**
 * WARNING: This method is not implemented yet.
 * 
 * A hook for `ShopperOrders#getTaxesFromOrder`.
 * This method gives you the external taxation data of the order transferred from the basket during
order creation. This endpoint can be called only if external taxation was used. See POST /baskets
for more information.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getTaxesFromOrder} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#gettaxesfromorder} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useTaxesFromOrder(): void {
    NotImplementedError()
}

export {useOrder, usePaymentMethodsForOrder, useTaxesFromOrder}
