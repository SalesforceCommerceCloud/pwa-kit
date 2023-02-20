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
    type Options = Argument<Client['getShopperContext']>
    type Data = DataType<Client['getShopperContext']>
    const {shopperContexts: client} = useCommerceApi()
    const method = async (options: Options) => await client.getShopperContext(options)
    const requiredParameters = ['organizationId', 'usid'] as const
    const allParameters = [...requiredParameters] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    // `client.clientConfig` can have parameters that are not relevant to this endpoint, so we must
    // exclude them when generating the query key.
    const parameters = pick(netOptions.parameters, allParameters)
    const queryKey = [
        '/organizations/',
        parameters.organizationId,
        '/shopper-context/',
        parameters.usid,
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
