/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {createUseQuery} from '../createUseQuery'
import * as queryKeyHelpers from './queryKeyHelpers'

/**
 * Gets a basket.
 * @group ShopperBaskets
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Baskets `getBasket` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getBasket| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getbasket | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useBasket = createUseQuery({
    clientKey: 'shopperBaskets',
    methodName: 'getBasket',
    displayName: 'useBasket',
    queryKeyHelper: queryKeyHelpers.getBasket
})
/**
 * Gets applicable payment methods for an existing basket considering the open payment amount only.
 * @group ShopperBaskets
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Baskets `getPaymentMethodsForBasket` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getPaymentMethodsForBasket| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getpaymentmethodsforbasket | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePaymentMethodsForBasket = createUseQuery({
    clientKey: 'shopperBaskets',
    methodName: 'getPaymentMethodsForBasket',
    displayName: 'usePaymentMethodsForBasket',
    queryKeyHelper: queryKeyHelpers.getPaymentMethodsForBasket
})

/**
 * Gets applicable price books for an existing basket.
 * @group ShopperBaskets
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Baskets `getPriceBooksForBasket` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getPriceBooksForBasket| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getpricebooksforbasket | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePriceBooksForBasket = createUseQuery({
    clientKey: 'shopperBaskets',
    methodName: 'getPriceBooksForBasket',
    displayName: 'usePriceBooksForBasket',
    queryKeyHelper: queryKeyHelpers.getPriceBooksForBasket
})
/**
 * Gets the applicable shipping methods for a certain shipment of a basket.
 * @group ShopperBaskets
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Baskets `getShippingMethodsForShipment` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getShippingMethodsForShipment| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#getshippingmethodsforshipment | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useShippingMethodsForShipment = createUseQuery({
    clientKey: 'shopperBaskets',
    methodName: 'getShippingMethodsForShipment',
    displayName: 'useShippingMethodsForShipment',
    queryKeyHelper: queryKeyHelpers.getShippingMethodsForShipment
})
/**
 * This method gives you the external taxation data set by the PUT taxes API. This endpoint can be called only if external taxation mode was used for basket creation. See POST /baskets for more information.
 * @group ShopperBaskets
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Baskets `getTaxesFromBasket` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getTaxesFromBasket| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#gettaxesfrombasket | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useTaxesFromBasket = createUseQuery({
    clientKey: 'shopperBaskets',
    methodName: 'getTaxesFromBasket',
    displayName: 'useTaxesFromBasket',
    queryKeyHelper: queryKeyHelpers.getTaxesFromBasket
})
