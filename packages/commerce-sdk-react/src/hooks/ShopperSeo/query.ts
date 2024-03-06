/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ApiClients, ApiQueryOptions, Argument, DataType, NullableParameters} from '../types'
import useCommerceApi from '../useCommerceApi'
import {useQuery} from '../useQuery'
import {getCustomKeys, mergeOptions, omitNullableParameters, pick} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'
import paramKeysMap from './paramKeys'

type Client = ApiClients["shopperSeo"]

/**
 * Gets URL mapping information for a URL that a shopper clicked or typed in.
 *
 * The mapping information is based on URL rules and redirects set up in Business Manager.
 * For more information about prerequisites and sample usage, see [URL Resolution](https://developer.salesforce.com/docs/commerce/commerce-api/guide/url-resolution.html). You can customize the behavior of this endpoint by using hooks.
 * See the hooks for getUrlMapping in the Hook List.
 * @group ShopperSearch
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Search `productSearch` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-search?meta=productSearch| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppersearch.shoppersearch-1.html#productsearch | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useUrlMapping = (
    apiOptions: NullableParameters<Argument<Client['getUrlMapping']>>,
    queryOptions: ApiQueryOptions<Client['getUrlMapping']> = {}
): UseQueryResult<DataType<Client['getUrlMapping']>> => {
    type Options = Argument<Client['getUrlMapping']>
    type Data = DataType<Client['getUrlMapping']>
    const {shopperSeo: client} = useCommerceApi()
    const methodName = 'getUrlMapping'
    const requiredParameters = ['organizationId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const paramKeys = [...paramKeysMap[methodName], ...getCustomKeys(netOptions.parameters)]
    const parameters = pick(netOptions.parameters, paramKeys)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
