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

type Client = ApiClients['shopperContexts']

/**
 * A hook for `ShopperContexts#getShopperContext`.
 * Gets the shopper's context based on the shopperJWT. ******** This API is currently a work in progress, and not available to use yet. ********
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-contexts?meta=getShopperContext} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercontexts.shoppercontexts-1.html#getshoppercontext} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useShopperContext = (
    apiOptions: Argument<Client['getShopperContext']>,
    queryOptions: ApiQueryOptions<Client['getShopperContext']> = {}
): UseQueryResult<DataType<Client['getShopperContext']>> => {
    const {shopperContexts: client} = useCommerceApi()
    const method = async (options: Argument<Client['getShopperContext']>) =>
        await client.getShopperContext(options)
    const requiredParameters = ['organizationId', 'usid'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/shopper-context/',
        parameters.usid,
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getShopperContext']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
