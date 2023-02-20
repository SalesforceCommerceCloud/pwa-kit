/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ApiClients, ApiQueryOptions, Argument, DataType} from '../types'
import useCommerceApi from '../useCommerceApi'
import {useQuery} from '../useQuery'
import {mergeOptions, pick} from '../utils'

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
    type Options = Argument<Client['getPages']>
    type Data = DataType<Client['getPages']>
    const {shopperExperience: client} = useCommerceApi()
    const method = async (options: Options) => await client.getPages(options)
    const requiredParameters = ['organizationId', 'aspectTypeId', 'siteId'] as const
    const allParameters = [
        ...requiredParameters,
        'categoryId',
        'productId',

        'aspectAttributes',
        'parameters',

        'locale'
    ] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    // `client.clientConfig` can have parameters that are not relevant to this endpoint, so we must
    // exclude them when generating the query key.
    const parameters = pick(netOptions.parameters, allParameters)
    const queryKey = ['/organizations/', parameters.organizationId, '/pages', parameters] as const

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
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
    type Options = Argument<Client['getPage']>
    type Data = DataType<Client['getPage']>
    const {shopperExperience: client} = useCommerceApi()
    const method = async (options: Options) => await client.getPage(options)
    const requiredParameters = ['organizationId', 'pageId', 'siteId'] as const
    const allParameters = [
        ...requiredParameters,
        'aspectAttributes',
        'parameters',

        'locale'
    ] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    // `client.clientConfig` can have parameters that are not relevant to this endpoint, so we must
    // exclude them when generating the query key.
    const parameters = pick(netOptions.parameters, allParameters)
    const queryKey = [
        '/organizations/',
        parameters.organizationId,
        '/pages/',
        parameters.pageId,
        parameters
    ] as const

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
