/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ApiClients, ApiQueryKey, ApiQueryOptions, Argument, DataType} from '../types'
import useCommerceApi from '../useCommerceApi'
import {useQuery} from '../useQuery'
import {mergeOptions} from '../utils'

type Client = ApiClients['shopperExperience']

/**
 * A hook for `ShopperExperience#getPages`.
 * Get Page Designer pages. The results will apply the visibility rules for each page's components, such as personalization or scheduled visibility.

Either `categoryId` or `productId` must be given in addition to `aspectTypeId`. Because only a single page-to-product and page-to-category assignment per aspect type can be authored today, the returned results contains one element at most.

**Important**: Because this resource uses the GET method, you must not pass sensitive data (payment card information, for example) and must not perform any transactional processes within the server-side scripts that are run for the page and components.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-experience?meta=getPages} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperexperience.shopperexperience-1.html#getpages} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePages = (
    apiOptions: Argument<Client['getPages']>,
    queryOptions: ApiQueryOptions<Client['getPages']> = {}
): UseQueryResult<DataType<Client['getPages']>> => {
    const {shopperExperience: client} = useCommerceApi()
    const method = async (options: Argument<Client['getPages']>) => await client.getPages(options)
    const requiredParameters = ['organizationId', 'aspectTypeId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/pages',
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getPages']>>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * A hook for `ShopperExperience#getPage`.
 * Get a Page Designer page based on a single page ID. The results will apply the visibility rules for the page's components, such as personalization or scheduled visibility.

**Important**: Because this resource uses the GET method, you must not pass sensitive data (payment card information, for example) and must not perform any transactional processes within the server-side scripts that are run for the page and components.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-experience?meta=getPage} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperexperience.shopperexperience-1.html#getpage} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePage = (
    apiOptions: Argument<Client['getPage']>,
    queryOptions: ApiQueryOptions<Client['getPage']> = {}
): UseQueryResult<DataType<Client['getPage']>> => {
    const {shopperExperience: client} = useCommerceApi()
    const method = async (options: Argument<Client['getPage']>) => await client.getPage(options)
    const requiredParameters = ['organizationId', 'pageId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/pages/',
        parameters.pageId,
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getPage']>>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
