/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from './useAuthContext'
import useLocalStorage from './useLocalStorage'
import useConfig from './useConfig'

const onClient = typeof window !== 'undefined'
export type CustomerType = null | 'guest' | 'registered'
type useCustomerType = {
    customerType: CustomerType
    isGuest: boolean
    isRegistered: boolean
}

/**
 * A hook to return customer auth type.
 *
 * Customer type can have 3 values:
 * - null
 * - guest
 * - registered
 *
 * During initialization, type is null. And it is possible that
 * isGuest and isRegistered to both be false.
 *
 */
const useCustomerType = (): useCustomerType => {
    let customerType = null
    if (onClient) {
        // `onClient` is a constant, so the hooks will always have the same execution order,
        // despite technically being inside a conditional.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const {siteId} = useConfig()
        // eslint-disable-next-line react-hooks/rules-of-hooks
        customerType = useLocalStorage(`${siteId}_customer_type`)
    } else {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const auth = useAuthContext()
        customerType = auth.get('customer_type')
    }

    const isGuest = customerType === 'guest'
    const isRegistered = customerType === 'registered'

    if (customerType !== null && customerType !== 'guest' && customerType !== 'registered') {
        console.warn(`Unrecognized customer type found in storage: ${customerType}`)
        customerType = null
    }

    return {
        customerType,
        isGuest,
        isRegistered
    }
}

export default useCustomerType
