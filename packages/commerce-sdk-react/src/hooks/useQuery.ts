/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQuery as useReactQuery, UseQueryOptions, QueryKey} from '@tanstack/react-query'
import useAuthenticatedClient from './useAuthenticatedClient'
import {IQueryFunction} from './types'

export const useQuery = <TData>(
    queryKey: QueryKey,
    fn: IQueryFunction<TData>,
    queryOptions?: UseQueryOptions<TData, Error>
) => {
    const authenticatedFn = useAuthenticatedClient(fn)
    return useReactQuery<TData, Error>(queryKey, authenticatedFn, queryOptions)
}
