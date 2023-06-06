/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCustomerProductLists, useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
const onClient = typeof window !== 'undefined'
// TODO: remove `listId` input -> use the first list of type wish_list instead
// (mimic the logic in the other older hook 'use-wishlist.js')
export const useWishList = ({listId = ''} = {}) => {
    const {data: customer} = useCurrentCustomer()
    const {customerId} = customer
    const createCustomerProductList = useShopperCustomersMutation('createCustomerProductList')
    const {data: productLists, ...restOfQuery} = useCustomerProductLists(
        {
            parameters: {customerId}
        },
        {
            onSuccess: (data) => {
                if (!data.total) {
                    createCustomerProductList.mutate({
                        parameters: {customerId},
                        // we only use one type of product lists for now
                        body: {type: 'wish_list'}
                    })
                }
            },
            enabled: onClient && Boolean(customerId)
        }
    )

    const wishLists = productLists?.data?.filter((list) => list.type === 'wish_list') || []
    const currentWishlist = wishLists.find((list) => list.id === listId)

    return {
        data: !listId ? wishLists[0] : currentWishlist,
        ...restOfQuery
    }
}
