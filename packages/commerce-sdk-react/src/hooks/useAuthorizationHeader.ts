/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiOptions, ApiMethod} from './types'
import useAuthContext from './useAuthContext'

/**
 * Creates a method that waits for authentication to complete and automatically includes an
 * Authorization header when making requests.
 * @param method Bound API method
 * @internal
 */
export const useAuthorizationHeader = <Options extends ApiOptions, Data>(
    method: ApiMethod<Options, Data>
): ApiMethod<Options, Data> => {
    const auth = useAuthContext()
    return async (options) => {
        const {access_token} = await auth.ready()

        if (options?.parameters?.customerId && options?.parameters?.customerId !== auth.get('customer_id')) {
            console.log('customerId mismatch')
            console.log(options?.parameters?.customerId)
            console.log(options?.parameters?.customerId)
            options.parameters.customerId = auth.get('customer_id')
        }

        return await method({
            ...options,
            headers: {
                Authorization: `Bearer ${access_token}`,
                ...options.headers
            }
        })
    }
}
