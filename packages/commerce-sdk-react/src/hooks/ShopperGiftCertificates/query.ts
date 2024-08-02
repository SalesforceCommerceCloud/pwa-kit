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
import {mergeOptions, omitNullableParameters, pickValidParams} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'
import {ShopperGiftCertificates} from 'commerce-sdk-isomorphic'

type Client = ApiClients['shopperGiftCertificates']

/**
 * Action to retrieve an existing gift certificate.
 * @group ShopperGiftCertificates
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Gift Certificates `getGiftCertificate` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-gift-certificates?meta=getGiftCertificate| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppergiftcertificates.shoppergiftcertificates-1.html#getgiftcertificate | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useGiftCertificate = (
    apiOptions: NullableParameters<Argument<Client['getGiftCertificate']>>,
    queryOptions: ApiQueryOptions<Client['getGiftCertificate']> = {}
): UseQueryResult<DataType<Client['getGiftCertificate']>> => {
    type Options = Argument<Client['getGiftCertificate']>
    type Data = DataType<Client['getGiftCertificate']>
    const {shopperGiftCertificates: client} = useCommerceApi()
    const methodName = 'getGiftCertificate'
    const requiredParameters = ShopperGiftCertificates.paramKeys[`${methodName}Required`]

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperGiftCertificates.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)

    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'useGiftCertificate',
        ...queryOptions.meta
    }

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>(
        {...netOptions, parameters},
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
