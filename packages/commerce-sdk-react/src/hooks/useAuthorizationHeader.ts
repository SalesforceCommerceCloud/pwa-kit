/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuth from './useAuth'

// This feels like a bad name
export const useAuthorizationHeader = <Arg extends {headers?: Record<string, string>}, Ret>(
    fn: (arg: Arg) => Promise<Ret>,
    original: Arg
) => {
    const auth = useAuth()
    return async function(): Promise<Ret> {
        const {access_token} = await auth.ready()
        return fn({
            ...original,
            headers: {
                ...original.headers,
                Authorization: `Bearer ${access_token}`
            }
        })
    }
}
