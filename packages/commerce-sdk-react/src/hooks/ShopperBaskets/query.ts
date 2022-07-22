/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType, QueryResponse} from '../types'
import {useAsync} from '../useAsync'
import useCommerceApi from '../useCommerceApi'

type Client = ApiClients['shopperBaskets']

/**
 * A hook for `ShopperBaskets#getBasket`.
 * Gets a basket.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getbasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useBasket = (
    arg: Argument<Client['getBasket']>
): QueryResponse<DataType<Client['getBasket']>> => {
    const {shopperBaskets: client} = useCommerceApi()
    return useAsync(() => client.getBasket(arg), [arg])
}
/**
 * A hook for `ShopperBaskets#getPaymentMethodsForBasket`.
 * Gets applicable payment methods for an existing basket considering the open payment amount only.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getPaymentMethodsForBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getpaymentmethodsforbasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePaymentMethodsForBasket = (
    arg: Argument<Client['getPaymentMethodsForBasket']>
): QueryResponse<DataType<Client['getPaymentMethodsForBasket']>> => {
    const {shopperBaskets: client} = useCommerceApi()
    return useAsync(() => client.getPaymentMethodsForBasket(arg), [arg])
}
/**
 * A hook for `ShopperBaskets#getPriceBooksForBasket`.
 * Gets applicable price books for an existing basket.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getPriceBooksForBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getpricebooksforbasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePriceBooksForBasket = (
    arg: Argument<Client['getPriceBooksForBasket']>
): QueryResponse<DataType<Client['getPriceBooksForBasket']>> => {
    const {shopperBaskets: client} = useCommerceApi()
    return useAsync(() => client.getPriceBooksForBasket(arg), [arg])
}
/**
 * A hook for `ShopperBaskets#getShippingMethodsForShipment`.
 * Gets the applicable shipping methods for a certain shipment of a basket.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getShippingMethodsForShipment} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getshippingmethodsforshipment} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useShippingMethodsForShipment = (
    arg: Argument<Client['getShippingMethodsForShipment']>
): QueryResponse<DataType<Client['getShippingMethodsForShipment']>> => {
    const {shopperBaskets: client} = useCommerceApi()
    return useAsync(() => client.getShippingMethodsForShipment(arg), [arg])
}
/**
 * A hook for `ShopperBaskets#getTaxesFromBasket`.
 * This method gives you the external taxation data set by the PUT taxes API. This endpoint can be called only if external taxation mode was used for basket creation. See POST /baskets for more information.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getTaxesFromBasket} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#gettaxesfrombasket} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useTaxesFromBasket = (
    arg: Argument<Client['getTaxesFromBasket']>
): QueryResponse<DataType<Client['getTaxesFromBasket']>> => {
    const {shopperBaskets: client} = useCommerceApi()
    return useAsync(() => client.getTaxesFromBasket(arg), [arg])
}
