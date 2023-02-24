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
import {mergeOptions} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'

type Client = ApiClients['shopperGiftCertificates']

/**
 * A hook for `ShopperGiftCertificates#getGiftCertificate`.
 * Action to retrieve an existing gift certificate.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-gift-certificates?meta=getGiftCertificate} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppergiftcertificates.shoppergiftcertificates-1.html#getgiftcertificate} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useGiftCertificate = (
    apiOptions: Argument<Client['getGiftCertificate']>,
    queryOptions: ApiQueryOptions<Client['getGiftCertificate']> = {}
): UseQueryResult<DataType<Client['getGiftCertificate']>> => {
    type Options = Argument<Client['getGiftCertificate']>
    type Data = DataType<Client['getGiftCertificate']>
    const {shopperGiftCertificates: client} = useCommerceApi()
    const methodName = 'getGiftCertificate'
    const requiredParameters = ['organizationId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(
        netOptions,
        {
            // !!! This is a violation of our design goal of minimal logic in the indivudal endpoint
            // endpoint hooks. This is because this method is a post method, rather than GET,
            // and its body contains secrets. Setting cacheTime to 0 avoids exposing the secrets in
            // the shared cache.
            cacheTime: 0,
            ...queryOptions
        },
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
