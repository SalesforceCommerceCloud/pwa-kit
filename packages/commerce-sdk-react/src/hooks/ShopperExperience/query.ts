/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as queryKeyHelpers from './queryKeyHelpers'
import {createUseQuery} from '../createUseQuery'

/**
 * Get Page Designer pages.
 *
 * The results will apply the visibility rules for each page's components, such as personalization or scheduled visibility. Either `categoryId` or `productId` must be given in addition to `aspectTypeId`. Because only a single page-to-product and page-to-category assignment per aspect type can be authored today, the returned results contains one element at most.
 * **Important**: Because this resource uses the GET method, you must not pass sensitive data (payment card information, for example) and must not perform any transactional processes within the server-side scripts that are run for the page and components.
 * @group ShopperExperience
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Experience `getPages` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-experience?meta=getPages| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperexperience.shopperexperience-1.html#getpages | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePages = createUseQuery({
    clientKey: 'shopperExperience',
    methodName: 'getPages',
    displayName: 'usePages',
    queryKeyHelper: queryKeyHelpers.getPages
})

/**
 * Get a Page Designer page based on a single page ID.
 *
 * The results will apply the visibility rules for the page's components, such as personalization or scheduled visibility.
 * **Important**: Because this resource uses the GET method, you must not pass sensitive data (payment card information, for example) and must not perform any transactional processes within the server-side scripts that are run for the page and components.
 * @group ShopperExperience
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Experience `getPage` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-experience?meta=getPage| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperexperience.shopperexperience-1.html#getpage | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePage = createUseQuery({
    clientKey: 'shopperExperience',
    methodName: 'getPage',
    displayName: 'usePage',
    queryKeyHelper: queryKeyHelpers.getPage
})
