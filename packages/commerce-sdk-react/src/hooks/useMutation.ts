/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthenticatedClient from './useAuthenticatedClient'
import {useMutation as useReactQueryMutation, UseMutationOptions} from '@tanstack/react-query'
import {IMutationFunction} from './types'

export const useMutation = <TData = unknown, TError = unknown, TVariables = unknown>(
    fn: IMutationFunction<TData, TVariables>,
    options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) => {
    const authenticatedFn = useAuthenticatedClient<TData, TVariables>(fn)
    return useReactQueryMutation<TData, TError, TVariables>(authenticatedFn, options)
}
