/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {MutationFunction, useMutation as useReactQueryMutation, UseMutationOptions} from '@tanstack/react-query'
import useAuthenticatedClient from './useAuthenticatedClient'
import {AddParameters, ApiClients} from './types'

type MutationFunctionWithApiClients<Data, Vars> = AddParameters<
    MutationFunction<Data, Vars>,
    // TODO: Remove this after merging in prettier v2 changes
    // eslint-disable-next-line prettier/prettier
    [apiClients: ApiClients]
>

export const useMutation = <Data, Err, Vars>(
    fn: MutationFunctionWithApiClients<Data, Vars>,
    options?: Omit<UseMutationOptions<Data, Err, Vars>, 'mutationFn'>
) => {
    const authenticatedFn = useAuthenticatedClient(fn)
    return useReactQueryMutation(authenticatedFn, options)
}
