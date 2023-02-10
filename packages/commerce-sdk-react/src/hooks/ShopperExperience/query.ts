/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryOptions, UseQueryResult} from '@tanstack/react-query'
import {ApiClients, Argument, DataType, MergedOptions} from '../types'
import useCommerceApi from '../useCommerceApi'
import {useQuery} from '../useQuery'

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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getPages']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getPages']>> => {
    const {shopperExperience: client} = useCommerceApi()
    const method = (arg: Argument<Client['getPages']>) => client.getPages(arg)
    const requiredParameters = ['organizationId', 'aspectTypeId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({parameters}: MergedOptions<Client, Argument<Client['getPages']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/pages',
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getPage']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getPage']>> => {
    const {shopperExperience: client} = useCommerceApi()
    const method = (arg: Argument<Client['getPage']>) => client.getPage(arg)
    const requiredParameters = ['organizationId', 'pageId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({parameters}: MergedOptions<Client, Argument<Client['getPage']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/pages/',
            parameters.pageId,
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
    })
}
