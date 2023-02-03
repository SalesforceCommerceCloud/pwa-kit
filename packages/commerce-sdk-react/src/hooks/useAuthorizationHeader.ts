/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiOptions, ApiMethod} from './types'
import useAuth from './useAuth'

export const useAuthorizationHeader = <Opts extends ApiOptions, Ret>(
    fn: ApiMethod<Opts, Ret>
): ApiMethod<Opts, Ret> => {
    const auth = useAuth()
    return async (options: Opts) => {
        const {access_token} = await auth.ready()
        return await fn({
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${access_token}`
            }
        })
    }
}
