/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ShopperPayments} from 'commerce-sdk-isomorphic'
import {ApiClients, ApiQueryOptions, Argument, DataType, NullableParameters} from '../types'
import {useQuery} from '../useQuery'
import {mergeOptions, omitNullableParameters, pickValidParams} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'
import {CLIENT_KEYS} from '../../constant'
import useCommerceApi from '../useCommerceApi'

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_PAYMENTS
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

/**
 * Gets payment configuration.
 * @group ShopperPayments
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Payments `getPaymentConfiguration` endpoint.
 */
export const usePaymentConfiguration = (
    apiOptions: NullableParameters<Argument<Client['getPaymentConfiguration']>>,
    queryOptions: ApiQueryOptions<Client['getPaymentConfiguration']> = {}
): UseQueryResult<DataType<Client['getPaymentConfiguration']>> => {
    type Options = Argument<Client['getPaymentConfiguration']>
    type Data = DataType<Client['getPaymentConfiguration']> // ← Add this
    const client = useCommerceApi(CLIENT_KEY)
    const methodName = 'getPaymentConfiguration'
    const requiredParameters = ShopperPayments.paramKeys[`${methodName}Required`] // ← Add this

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(netOptions.parameters, ShopperPayments.paramKeys[methodName]) // ← Add this
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'usePaymentConfiguration',
        ...queryOptions.meta
    }

    // ← Fix this call to match the pattern
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
