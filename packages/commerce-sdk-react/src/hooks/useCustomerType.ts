/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthDataValue from './useAuthDataValue'

export type CustomerType = null | 'guest' | 'registered'
type useCustomerType = {
    customerType: CustomerType
    isGuest: boolean
    isRegistered: boolean
    isExternal: boolean
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
 * @group Helpers
 * @category Shopper Authentication
 *
 */
const useCustomerType = (): useCustomerType => {
    let customerType: string | null = useAuthDataValue('customer_type')

    const isGuest = customerType === 'guest'
    const isRegistered = customerType === 'registered'

    if (customerType !== null && customerType !== 'guest' && customerType !== 'registered') {
        customerType = null
    }

    // `uido` is the IDP origin claim from the access token's `isb`. Anything
    // other than 'slas' or 'ecom' means the user came from an external IDP.
    const uido: string | null = useAuthDataValue('uido')

    const isExternal: boolean = customerType === 'registered' && uido !== 'slas' && uido !== 'ecom'

    return {
        customerType,
        isGuest,
        isRegistered,
        isExternal
    }
}

export default useCustomerType
