/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    useCustomerBaskets,
    useCustomerId,
    useCustomerType,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'
import {usePrevious} from '@salesforce/retail-react-app/app/hooks/use-previous'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'

/**
 * Custom hook to handle basket merging when a guest user logs in
 * Merges the guest basket with the registered user's basket if conditions are met
 * @returns {Function} handleMergeBasket function that returns a promise
 */
export const useMergeBasket = () => {
    const customerId = useCustomerId()
    const {customerType} = useCustomerType()
    const prevAuthType = usePrevious(customerType)
    const {data: baskets} = useCustomerBaskets(
        {parameters: {customerId}},
        {enabled: !!customerId && !isServer, keepPreviousData: true}
    )
    const mergeBasket = useShopperBasketsMutation('mergeBasket')

    const handleMergeBasket = async () => {
        const hasBasketItem = baskets?.baskets?.[0]?.productItems?.length > 0
        // we only want to merge basket when the user is logged in as a recurring user
        // only recurring users trigger the login mutation, new user triggers register mutation
        // this logic needs to stay in this block because this is the only place that tells if a user is a recurring user
        // if you change logic here, also change it in login page
        const shouldMergeBasket = hasBasketItem && prevAuthType === 'guest'
        if (shouldMergeBasket) {
            await mergeBasket.mutateAsync({
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

    return handleMergeBasket
}
