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
import {mergeOptions, omitNullableParameters} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'

type Client = ApiClients['shopperContexts']

/**
 * Gets the shopper's context based on the shopperJWT.
 * @group ShopperContexts
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Contexts `getShopperContext` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-contexts?meta=getShopperContext| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercontexts.shoppercontexts-1.html#getshoppercontext | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useShopperContext = (
    apiOptions: NullableParameters<Argument<Client['getShopperContext']>>,
    queryOptions: ApiQueryOptions<Client['getShopperContext']> = {}
): UseQueryResult<DataType<Client['getShopperContext']>> => {
    type Options = Argument<Client['getShopperContext']>
    type Data = DataType<Client['getShopperContext']>
    const {shopperContexts: client} = useCommerceApi()
    const methodName = 'getShopperContext'
    const requiredParameters = ['organizationId', 'usid'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
