/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQuery as useReactQuery, UseQueryOptions} from '@tanstack/react-query'
import useAuthenticatedRequest from './useAuthenticatedRequest'
import {ApiClients} from './types'

export const useQuery = <TData>(
    queryKey: unknown[],
    fn: (apiClients: ApiClients) => Promise<TData>,
    queryOptions?: UseQueryOptions<TData, Error>
) => {
    const authenticatedFn = useAuthenticatedRequest<TData>(fn)
    return useReactQuery<TData, Error>(queryKey, authenticatedFn, queryOptions)
}
