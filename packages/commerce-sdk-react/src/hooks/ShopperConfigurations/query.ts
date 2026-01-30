/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ShopperConfigurations} from 'commerce-sdk-isomorphic'
import {ApiClients, ApiQueryOptions, Argument, DataType, NullableParameters} from '../types'
import {useQuery} from '../useQuery'
import {mergeOptions, omitNullableParameters, pickValidParams} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'
import {CLIENT_KEYS} from '../../constant'
import useCommerceApi from '../useCommerceApi'

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_CONFIGURATIONS
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

/**
 * Gets configuration information that encompasses toggles, preferences, and configuration that allow the application to be reactive to changes performed by the merchant, admin, or support engineer.
 *
 * @group ShopperConfigurations
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Configurations `getConfigurations` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-configurations?meta=getConfigurations| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperconfigurations.shopperconfigurations-1.html#getconfigurations | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useConfigurations = (
    apiOptions: NullableParameters<Argument<Client['getConfigurations']>>,
    queryOptions: ApiQueryOptions<Client['getConfigurations']> = {}
): UseQueryResult<DataType<Client['getConfigurations']>> => {
    type Options = Argument<Client['getConfigurations']>
    type Data = DataType<Client['getConfigurations']>
    const client = useCommerceApi(CLIENT_KEY)
    const methodName = 'getConfigurations'
    const requiredParameters = ShopperConfigurations.paramKeys[`${methodName}Required`]

    // Parameters can be set in `apiOptions` or `client.clientConfig`
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions || {}))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperConfigurations.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'useConfigurations',
        ...queryOptions.meta
    }

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
