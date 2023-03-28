/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQueries} from '@tanstack/react-query'
import {ApiClients, ApiQueryOptions, Argument, DataType, NullableParameters} from '../types'
import useCommerceApi from '../useCommerceApi'
import {hasAllKeys, mergeOptions, omitNullableParameters} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'
import {useAuthorizationHeader} from '../useAuthorizationHeader'

type Client = ApiClients['shopperProducts']
//TODO: What is the better signature for this api
export const useCategoryBulk = (
    apiOptions: NullableParameters<Argument<Client['getCategory']>>,
    ids: string[],
    queryOptions: ApiQueryOptions<Client['getCategory']> = {}
) => {
    type Options = Argument<Client['getCategory']>
    type Data = DataType<Client['getCategory']>
    const {shopperProducts: client} = useCommerceApi()
    const methodName = 'getCategory'

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    // const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    // const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)
    const authenticatedMethod = useAuthorizationHeader(method)

    const queries = ids.map((id) => {
        // reconstruct params with correct id
        const netOptions = omitNullableParameters(
            mergeOptions(client, {...apiOptions, parameters: {...apiOptions.parameters, id}})
        )
        // This type assertion is NOT safe in all cases. However, we know that `requiredParameters` is
        // the list of parameters required by `Options`, and we know that in the default case (when
        // `queryOptions.enabled` is not set), we only execute the hook when `apiOptions` has all
        // required parameters. Therefore, we know that `apiOptions` satisfies `Options` in the default
        // case, so the type assertion is safe in the default case. We explicitly do NOT guarantee type
        // safety when `queryOptions.enabled` is set; when it is `true`, the callback may be called with
        // missing parameters. This will result in a runtime error. I think that this is an acceptable
        // trade-off, as the behavior is opt-in by the end user, and it feels like adding type safety
        // for this case would add significantly more complexity.
        const wrappedMethod = async () => await authenticatedMethod(netOptions as Options)
        const requiredParameters = ['organizationId', 'id', 'siteId'] as const
        return {
            queryKey: queryKeyHelpers[methodName].queryKey({
                ...netOptions.parameters,
                id,
                // @ts-ignore
                levels: apiOptions.parameters.levels || 1
            }),
            queryFn: wrappedMethod,
            enabled: hasAllKeys(apiOptions.parameters, requiredParameters),
            ...queryOptions
        }
    })
    return useQueries({
        // @ts-ignore
        queries
    })
}
