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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getGiftCertificate']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getGiftCertificate']>> => {
    const {shopperGiftCertificates: client} = useCommerceApi()
    const method = (arg: Argument<Client['getGiftCertificate']>) => client.getGiftCertificate(arg)
    const requiredParameters = ['organizationId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getGiftCertificate']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/gift-certificate',
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(
        apiOptions,
        {
            // !!! This is a violation of our design goal of minimal logic in the endpoint hook
            // implementations. This is because getGiftCertificate is actually a POST method,
            // rather than GET, and its body contains a secret (gift certificate code). To avoid
            // exposing that secret in the shared cache, we set cacheTime to 0 to avoid caching it.
            cacheTime: 0,
            ...queryOptions
        },
        {
            client,
            method,
            requiredParameters,
            getQueryKey
        }
    )
}
