/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuth from './useAuth'
import useLocalStorage from './useLocalStorage'

const onClient = typeof window !== 'undefined'

/**
 * A hook to return customer auth type, either guest or registered user
 *
 */
const useCustomerType = (): null | 'guest' | 'registered' => {
    let value = null
    if (onClient) {
        value = useLocalStorage('customer_type')
    } else {
        const auth = useAuth()
        value = auth.get('customer_type')
    }

    if (value !== null || value !== 'guest' || value !== 'registered') {
        console.warn('Unrecognized customer type found in storage.')
        return null
    }

    return value
}

export default useCustomerType
