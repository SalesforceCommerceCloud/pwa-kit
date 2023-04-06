/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect, useRef} from 'react'
import {
    useCustomerBaskets,
    useCustomerType,
    useShopperBasketsMutation
} from 'commerce-sdk-react-preview'
import {useCurrentCustomer} from './use-current-customer'
import {isServer} from '../utils/utils'

// This value represents the max age in milliseconds a customer can be before they are
// no longer considered a "new" customer.
// E.g. If a customers creation date is older than 2 seconds it will no longer be considered
// a new customer.
const NEW_CUSTOMER_MAX_AGE = 2 * 1000 // 2 seconds in milliseconds

// This hook contains a useEffect that is triggered upon user login
// and merge the guest basket into the user's basket
export const useAutoBasketMerge = () => {
    const prevAuthType = useRef()
    const {data: customer} = useCurrentCustomer()
    const {customerType} = useCustomerType()
    const {data: baskets} = useCustomerBaskets(
        {parameters: {customerId: customer.customerId}},
        {enabled: !!customer.customerId && !isServer, keepPreviousData: true}
    )
    const mergeBasket = useShopperBasketsMutation('mergeBasket')

    useEffect(() => {
        prevAuthType.current = customerType
    }, [])

    useEffect(() => {
        const lastLoginTimeStamp = Date.parse(customer.lastLoginTime)
        const creationTimeStamp = Date.parse(customer.creationDate)
        const isNewCustomer = lastLoginTimeStamp - creationTimeStamp < NEW_CUSTOMER_MAX_AGE
        const isUponLogin =
            customerType === 'registered' && prevAuthType.current === 'guest' && !isNewCustomer
        const hasBasketItem = baskets?.baskets?.[0]?.productItems?.length > 0
        const shouldMerge = isUponLogin && hasBasketItem

        if (shouldMerge) {
            mergeBasket.mutate({
                headers: {
                    // This is not required since the request has no body
                    // but CommerceAPI throws a '419 - Unsupported Media Type' error if this header is removed.
                    'Content-Type': 'application/json'
                },
                parameters: {
                    createDestinationBasket: true
                }
            })
        }
    }, [customerType])
}
