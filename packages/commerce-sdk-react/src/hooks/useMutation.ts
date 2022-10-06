/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useAuthenticatedMutation} from './useAuthenticatedRequest'
import {useMutation as useReactQueryMutation} from '@tanstack/react-query'
import {MutationFunction} from './types'

export const useMutation = <TData = unknown, TError = unknown, TVariables = unknown>(
    fn: MutationFunction<TData, TVariables>
) => {
    const authenticatedFn = useAuthenticatedMutation<TData, TVariables>(fn)
    return useReactQueryMutation<TData, TError, TVariables>(authenticatedFn)
}
