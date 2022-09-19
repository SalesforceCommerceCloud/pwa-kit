/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthenticatedRequest from './useAuthenticatedRequest'
import {useMutation as useReactQueryMutataion, MutationFunction} from '@tanstack/react-query'

export const useMutation = <TData = unknown, TError = unknown, TVariables = unknown>(
    fn: MutationFunction<TData, TVariables>
) => {
    // TODO: fix this
    const authenticatedFn = useAuthenticatedRequest<TData>(fn)
    return useReactQueryMutataion<TData, TError, TVariables>(authenticatedFn)
}
