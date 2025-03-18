/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCustomer, useCustomerId, useCustomerType} from '@salesforce/commerce-sdk-react'

/**
 * A hook that returns the current customer.
 *
 */
export const useCurrentCustomer = () => {
    const customerId = useCustomerId()
    const {isRegistered, isGuest, customerType} = useCustomerType()
    const query = useCustomer({parameters: {customerId}}, {enabled: !!customerId && isRegistered})
    const value = {
        ...query,
        data: {
            ...query.data,
            customerType,
            customerId,
            isRegistered,
            isGuest
        }
    }
    return value
}
