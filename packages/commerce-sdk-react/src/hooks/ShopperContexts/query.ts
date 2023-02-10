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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getShopperContext']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getShopperContext']>> => {
    const {shopperContexts: client} = useCommerceApi()
    const method = (arg: Argument<Client['getShopperContext']>) => client.getShopperContext(arg)
    const requiredParameters = ['organizationId', 'usid'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getShopperContext']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/shopper-context/',
            parameters.usid,
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
