/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType} from '../types'
import {useQuery} from '../useQuery'
import useCommerceApi from '../useCommerceApi'
import {UseQueryResult} from '@tanstack/react-query'

type Client = ApiClients['shopperOrders']

/**
 * A hook for `ShopperOrders#getOrder`.
 * Gets information for an order.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getOrder} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#getorder} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useOrder = (
    arg: Argument<Client['getOrder']>
): UseQueryResult<DataType<Client['getOrder']>, Error> => {
    const {shopperOrders: client} = useCommerceApi()
    return useQuery([], () => client.getOrder(arg))
}
/**
 * A hook for `ShopperOrders#getPaymentMethodsForOrder`.
 * Gets the applicable payment methods for an existing order considering the open payment amount only.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getPaymentMethodsForOrder} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#getpaymentmethodsfororder} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePaymentMethodsForOrder = (
    arg: Argument<Client['getPaymentMethodsForOrder']>
): UseQueryResult<DataType<Client['getPaymentMethodsForOrder']>, Error> => {
    const {shopperOrders: client} = useCommerceApi()
    return useQuery([], () => client.getPaymentMethodsForOrder(arg))
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
    arg: Argument<Client['getTaxesFromOrder']>
): UseQueryResult<DataType<Client['getTaxesFromOrder']>, Error> => {
    const {shopperOrders: client} = useCommerceApi()
    return useQuery([], () => client.getTaxesFromOrder(arg))
}
