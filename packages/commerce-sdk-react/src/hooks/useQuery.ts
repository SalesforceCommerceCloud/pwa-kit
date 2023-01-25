/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    useQuery as useReactQuery,
    UseQueryOptions,
    QueryKey,
    QueryFunction
} from '@tanstack/react-query'
import useAuthenticatedClient from './useAuthenticatedClient'
import {AddParameters, ApiClients} from './types'

type QueryFunctionWithApiClients<Data, QK extends QueryKey> = AddParameters<
    QueryFunction<Data, QK>,
    // TODO: Remove this after merging in prettier v2 changes
    // eslint-disable-next-line prettier/prettier
    [apiClients: ApiClients]
>

export const useQuery = <Data, Err, QK extends QueryKey>(
    queryKey: QK,
    fn: QueryFunctionWithApiClients<Data, QK>,
    queryOptions?: UseQueryOptions<Data, Err, Data, QK>
) => {
    const authenticatedFn = useAuthenticatedClient(fn)
    return useReactQuery<Data, Err, Data, QK>(queryKey, authenticatedFn, queryOptions)
}
