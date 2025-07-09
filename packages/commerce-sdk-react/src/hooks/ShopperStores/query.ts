/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createUseQuery} from '../createUseQuery'
import * as queryKeyHelpers from './queryKeyHelpers'

/**
 * This resource retrieves a list of stores for the given site that are within a configured distance of a geolocation.
 *
 * The distance is interpreted either in miles or kilometers, depending on the distanceUnit input parameter. The location is
 * specified either by directly providing a latitude and longitude coordinate pair, or by providing a country and a postal code.
 * If a postal code is passed, the resource looks in the system's geolocation mappings to find the coordinates for this postal code.
 * If no matching geolocation is found, the resource returns an empty list of stores.
 * If coordinates are passed, the values for country and postal code are ignored.
 * @group SearchStores
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Search `productSearch` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-stores?meta=searchStores| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperstores.shopperstores-1.html#searchstores | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useSearchStores = createUseQuery({
    clientKey: 'shopperStores',
    methodName: 'searchStores',
    displayName: 'useSearchStores',
    queryKeyHelper: queryKeyHelpers.searchStores
})

/**
 * Returns stores identified by the IDs provided as input.
 * @group SearchStores
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Search `productSearch` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-stores?meta=getStores| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperstores.shopperstores-1.html#getStores | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useStores = createUseQuery({
    clientKey: 'shopperStores',
    methodName: 'getStores',
    displayName: 'useStores',
    queryKeyHelper: queryKeyHelpers.getStores
})
