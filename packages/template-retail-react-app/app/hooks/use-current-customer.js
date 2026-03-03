/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCustomer, useCustomerId, useCustomerType} from '@salesforce/commerce-sdk-react'

/**
 * A hook that returns the current customer.
 * @param {Array<string>} [expand] - Optional array of fields to expand in the customer query
 * @param {Object} [queryOptions] - Optional React Query options
 */
export const useCurrentCustomer = (expand, queryOptions = {}) => {
    const customerId = useCustomerId()
    const {isRegistered, isGuest, customerType} = useCustomerType()
    const parameters = {
        customerId,
        ...(expand && {expand})
    }
    const query = useCustomer(
        {parameters},
        {enabled: !!customerId && isRegistered, ...queryOptions}
    )
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
