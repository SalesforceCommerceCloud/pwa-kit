/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createUseQuery} from '../createUseQuery'
import * as queryKeyHelpers from './queryKeyHelpers'

/**
 * Gets information for an order.
 * @group ShopperOrders
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Orders `getOrder` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getOrder| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#getorder | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useOrder = createUseQuery({
    clientKey: 'shopperOrders',
    methodName: 'getOrder',
    displayName: 'useOrder',
    queryKeyHelper: queryKeyHelpers.getOrder
})

/**
 * Gets the applicable payment methods for an existing order considering the open payment amount only.
 * @group ShopperOrders
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Orders `getPaymentMethodsForOrder` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getPaymentMethodsForOrder| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#getpaymentmethodsfororder | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePaymentMethodsForOrder = createUseQuery({
    clientKey: 'shopperOrders',
    methodName: 'getPaymentMethodsForOrder',
    displayName: 'usePaymentMethodsForOrder',
    queryKeyHelper: queryKeyHelpers.getPaymentMethodsForOrder
})

/**
 * This method gives you the external taxation data of the order transferred from the basket during
order creation. This endpoint can be called only if external taxation was used. See POST /baskets
for more information.
 * @group ShopperOrders
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Orders `getTaxesFromOrder` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=getTaxesFromOrder| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperorders.shopperorders-1.html#gettaxesfromorder | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useTaxesFromOrder = createUseQuery({
    clientKey: 'shopperOrders',
    methodName: 'getTaxesFromOrder',
    displayName: 'useTaxesFromOrder',
    queryKeyHelper: queryKeyHelpers.getTaxesFromOrder
})
