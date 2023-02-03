/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMutation as useReactQueryMutation, useQueryClient} from '@tanstack/react-query'
import {CacheUpdateGetter, ApiOptions, ApiMethod} from './types'
import {useAuthorizationHeader} from './useAuthorizationHeader'
import useCustomerId from './useCustomerId'
import {updateCache} from './utils'

export const useMutation = <Options extends ApiOptions, Data>(hookConfig: {
    method: ApiMethod<Options, Data>
    getCacheUpdates: CacheUpdateGetter<Options, Data>
}) => {
    const queryClient = useQueryClient()
    const customerId = useCustomerId()
    const authenticatedMethod = useAuthorizationHeader(hookConfig.method)

    return useReactQueryMutation(authenticatedMethod, {
        onSuccess: (data, options) => {
            const cacheUpdates = hookConfig.getCacheUpdates(customerId, options, data)
            updateCache(queryClient, cacheUpdates, data)
        }
    })
}
