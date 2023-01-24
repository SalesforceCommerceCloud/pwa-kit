/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMutation as useReactQueryMutation, UseMutationOptions} from '@tanstack/react-query'
import useAuthenticatedClient from './useAuthenticatedClient'
import {IMutationFunction} from './types'

export const useMutation = <Data = unknown, Err = unknown, Vars = unknown>(
    fn: IMutationFunction<Data, Vars>,
    options?: Omit<UseMutationOptions<Data, Err, Vars>, 'mutationFn'>
) => {
    const authenticatedFn = useAuthenticatedClient(fn)
    return useReactQueryMutation(authenticatedFn, options)
}
