/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {createUseQuery} from '../createUseQuery'
import * as queryKeyHelpers from './queryKeyHelpers'

/**
 * Gets a customer's information.
 *
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomer` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomer| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomer | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomer = createUseQuery({
    clientKey: 'shopperCustomers',
    methodName: 'getCustomer',
    displayName: 'useCustomer',
    queryKeyHelper: queryKeyHelpers.getCustomer
})

/**
 * Retrieves a customer's address by address name.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerAddress` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerAddress| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomeraddress | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerAddress = createUseQuery({
    clientKey: 'shopperCustomers',
    methodName: 'getCustomerAddress',
    displayName: 'useCustomerAddress',
    queryKeyHelper: queryKeyHelpers.getCustomerAddress
})

/**
 * Gets the baskets of a customer.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerBaskets` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerBaskets| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerbaskets | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerBaskets = createUseQuery({
    clientKey: 'shopperCustomers',
    methodName: 'getCustomerBaskets',
    displayName: 'useCustomerBaskets',
    queryKeyHelper: queryKeyHelpers.getCustomerBaskets
})

/**
 * Returns a pageable list of all customer's orders.
 *
 * The default page size is 10.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerOrders` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerOrders| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerorders | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerOrders = createUseQuery({
    clientKey: 'shopperCustomers',
    methodName: 'getCustomerOrders',
    displayName: 'useCustomerOrders',
    queryKeyHelper: queryKeyHelpers.getCustomerOrders
})

/**
 * Retrieves a customer's payment instrument by its ID.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerPaymentInstrument` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerPaymentInstrument| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerpaymentinstrument | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerPaymentInstrument = createUseQuery({
    clientKey: 'shopperCustomers',
    methodName: 'getCustomerPaymentInstrument',
    displayName: 'useCustomerPaymentInstrument',
    queryKeyHelper: queryKeyHelpers.getCustomerPaymentInstrument
})

/**
 * Returns all customer product lists.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerProductLists` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductLists| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlists | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerProductLists = createUseQuery({
    clientKey: 'shopperCustomers',
    methodName: 'getCustomerProductLists',
    displayName: 'useCustomerProductLists',
    queryKeyHelper: queryKeyHelpers.getCustomerProductLists
})

/**
 * Returns a customer product list of the given customer and the items in the list.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerProductList` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductList| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlist | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerProductList = createUseQuery({
    clientKey: 'shopperCustomers',
    methodName: 'getCustomerProductList',
    displayName: 'useCustomerProductList',
    queryKeyHelper: queryKeyHelpers.getCustomerProductList
})

/**
 * Returns an item of a customer product list and the actual product details like image, availability and price.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerProductListItem` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductListItem| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlistitem | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerProductListItem = createUseQuery({
    clientKey: 'shopperCustomers',
    methodName: 'getCustomerProductListItem',
    displayName: 'useCustomerProductListItem',
    queryKeyHelper: queryKeyHelpers.getCustomerProductListItem
})

/**
 * Retrieves all public product lists as defined by the given search term (for example, email OR first name and last name).
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getPublicProductListsBySearchTerm` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductListsBySearchTerm| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getpublicproductlistsbysearchterm | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePublicProductListsBySearchTerm = createUseQuery({
    clientKey: 'shopperCustomers',
    methodName: 'getPublicProductListsBySearchTerm',
    displayName: 'usePublicProductListsBySearchTerm',
    queryKeyHelper: queryKeyHelpers.getPublicProductListsBySearchTerm
})

/**
 * Retrieves a public product list by ID and the items under that product list.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getPublicProductList` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductList| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getpublicproductlist | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePublicProductList = createUseQuery({
    clientKey: 'shopperCustomers',
    methodName: 'getPublicProductList',
    displayName: 'usePublicProductList',
    queryKeyHelper: queryKeyHelpers.getPublicProductList
})

/**
 * Retrieves an item from a public product list and the actual product details like product, image, availability and price.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getProductListItem` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getProductListItem| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getproductlistitem | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useProductListItem = createUseQuery({
    clientKey: 'shopperCustomers',
    methodName: 'getProductListItem',
    displayName: 'useProductListItem',
    queryKeyHelper: queryKeyHelpers.getProductListItem
})
