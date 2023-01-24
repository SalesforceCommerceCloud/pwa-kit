/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQuery as useReactQuery, UseQueryOptions, QueryKey} from '@tanstack/react-query'
import useAuthenticatedClient from './useAuthenticatedClient'
import {IQueryFunction} from './types'

export const useQuery = <Data>(
    queryKey: QueryKey,
    fn: IQueryFunction<Data>,
    queryOptions?: UseQueryOptions<Data, Error>
) => {
    const authenticatedFn = useAuthenticatedClient(fn)
    return useReactQuery(queryKey, authenticatedFn, queryOptions)
}
