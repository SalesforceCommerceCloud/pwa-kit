/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useRef} from 'react'
import {
    useShopperBasketsMutation,
    useCustomerBaskets,
    useCustomerId,
    useCustomerType
} from 'commerce-sdk-react-preview'
import {isServer} from '../utils/utils'

export const useMergeBasket = () => {
    const {customerType} = useCustomerType()
    const prevAuthType = useRef()
    useEffect(() => {
        prevAuthType.current = customerType
    }, [customerType])

    const customerId = useCustomerId()
    const {data: baskets} = useCustomerBaskets(
        {parameters: {customerId}},
        {enabled: !!customerId && !isServer, keepPreviousData: true}
    )

    const mergeBasket = useShopperBasketsMutation('mergeBasket')

    const mergeBasketIfNeeded = () => {
        const hasBasketItem = baskets?.baskets?.[0]?.productItems?.length > 0
        // we only want to merge basket when customerType changes from guest to registered
        const shouldMergeBasket = hasBasketItem && prevAuthType.current === 'guest'
        if (shouldMergeBasket) {
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
    }

    return {
        mergeBasketIfNeeded
    }
}
